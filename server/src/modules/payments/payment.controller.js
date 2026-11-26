import { Payment } from './payment.model.js';
import { Invoice } from '../invoicing/invoice.model.js';
import { Customer } from '../customers/customer.model.js';
import { Supplier } from '../suppliers/supplier.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getNextSequence } from '../../utils/sequenceGenerator.js';
import { withTransaction } from '../../config/db.js';
import { recordAuditLog } from '../audit-logs/auditLog.model.js';
import { INVOICE_STATUSES } from '../../config/constants.js';

export const getPayments = asyncHandler(async (req, res) => {
  const { paymentType, partyId, invoiceId, startDate, endDate, page = 1, limit = 20 } = req.query;

  const query = { companyId: req.companyId };
  if (paymentType) query.paymentType = paymentType;
  if (partyId) query.partyId = partyId;
  if (invoiceId) query.invoiceId = invoiceId;

  if (startDate || endDate) {
    query.paymentDate = {};
    if (startDate) query.paymentDate.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.paymentDate.$lte = end;
    }
  }

  const parsedLimit = parseInt(limit, 10);
  const skip = (parseInt(page, 10) - 1) * parsedLimit;

  const [payments, total] = await Promise.all([
    Payment.find(query)
      .populate('partyId', 'name code')
      .populate('invoiceId', 'invoiceNumber grandTotal balanceDue status')
      .populate('recordedBy', 'name email')
      .sort({ paymentDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit),
    Payment.countDocuments(query),
  ]);

  return ApiResponse.success(res, payments, 'Payments retrieved', 200, {
    page: parseInt(page, 10),
    limit: parsedLimit,
    total,
    totalPages: Math.ceil(total / parsedLimit),
  });
});

export const recordPayment = asyncHandler(async (req, res) => {
  const {
    paymentType,
    partyId,
    invoiceId,
    amount,
    paymentMethod = 'Bank Transfer',
    referenceNumber,
    paymentDate,
    notes,
  } = req.body;

  if (!paymentType || !partyId || !amount || Number(amount) <= 0) {
    throw ApiError.badRequest('Payment type, party ID, and a positive amount are required');
  }

  const parsedAmount = Math.round(Number(amount) * 100) / 100;

  const result = await withTransaction(async (session) => {
    let partyModel = 'Customer';
    let partyName = '';

    if (paymentType === 'CUSTOMER_RECEIPT') {
      partyModel = 'Customer';
      const customer = await Customer.findOne({ _id: partyId, companyId: req.companyId }).session(session);
      if (!customer) throw ApiError.notFound('Customer not found');
      partyName = customer.name;

      if (invoiceId) {
        const invoice = await Invoice.findOne({ _id: invoiceId, companyId: req.companyId }).session(session);
        if (!invoice) throw ApiError.notFound('Invoice not found');

        if (invoice.status === INVOICE_STATUSES.PAID) {
          throw ApiError.badRequest('Invoice has already been fully paid');
        }

        if (parsedAmount > invoice.balanceDue) {
          throw ApiError.badRequest(
            `Payment amount (${parsedAmount}) exceeds the remaining balance due (${invoice.balanceDue})`
          );
        }

        invoice.amountPaid = Math.round((invoice.amountPaid + parsedAmount) * 100) / 100;
        invoice.balanceDue = Math.round((invoice.grandTotal - invoice.amountPaid) * 100) / 100;

        if (invoice.balanceDue <= 0.001) {
          invoice.balanceDue = 0;
          invoice.status = INVOICE_STATUSES.PAID;
        } else {
          invoice.status = INVOICE_STATUSES.PARTIALLY_PAID;
        }

        await invoice.save({ session });
      }

      // Reduce outstanding receivable balance
      await Customer.findByIdAndUpdate(
        partyId,
        { $inc: { balance: -parsedAmount } },
        { session }
      );
    } else if (paymentType === 'SUPPLIER_PAYMENT') {
      partyModel = 'Supplier';
      const supplier = await Supplier.findOne({ _id: partyId, companyId: req.companyId }).session(session);
      if (!supplier) throw ApiError.notFound('Supplier not found');
      partyName = supplier.name;

      // Reduce outstanding payable balance
      await Supplier.findByIdAndUpdate(
        partyId,
        { $inc: { balance: -parsedAmount } },
        { session }
      );
    } else {
      throw ApiError.badRequest(`Unsupported payment type: ${paymentType}`);
    }

    const paymentNumber = await getNextSequence(req.companyId, 'PAY', 'PAY', 4, session);

    const payment = new Payment({
      companyId: req.companyId,
      paymentNumber,
      paymentType,
      partyId,
      partyModel,
      invoiceId: invoiceId || null,
      amount: parsedAmount,
      paymentMethod,
      referenceNumber,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      recordedBy: req.user._id,
      notes,
    });

    await payment.save({ session });

    await recordAuditLog({
      companyId: req.companyId,
      user: req.user,
      action: 'PAYMENT_RECORDED',
      module: 'PAYMENTS',
      recordId: payment._id,
      recordRef: payment.paymentNumber,
      details: { paymentType, party: partyName, amount: parsedAmount },
      session,
    });

    return payment;
  });

  return ApiResponse.created(res, result, 'Payment recorded successfully');
});
