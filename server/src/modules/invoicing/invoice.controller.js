import { Invoice } from './invoice.model.js';
import { Customer } from '../customers/customer.model.js';
import { Product } from '../products/product.model.js';
import { SalesOrder } from '../sales/salesOrder.model.js';
import { Payment } from '../payments/payment.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getNextSequence } from '../../utils/sequenceGenerator.js';
import { withTransaction } from '../../config/db.js';
import { recordAuditLog } from '../audit-logs/auditLog.model.js';
import { INVOICE_STATUSES } from '../../config/constants.js';

export const getInvoices = asyncHandler(async (req, res) => {
  const { status, customerId, search, overdueOnly, page = 1, limit = 20 } = req.query;

  const query = { companyId: req.companyId };
  if (status) query.status = status;
  if (customerId) query.customerId = customerId;
  if (search) query.invoiceNumber = { $regex: search, $options: 'i' };

  if (overdueOnly === 'true') {
    query.dueDate = { $lt: new Date() };
    query.status = { $in: [INVOICE_STATUSES.POSTED, INVOICE_STATUSES.PARTIALLY_PAID] };
  }

  const parsedLimit = parseInt(limit, 10);
  const skip = (parseInt(page, 10) - 1) * parsedLimit;

  const [invoices, total] = await Promise.all([
    Invoice.find(query)
      .populate('customerId', 'name code email phone')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit),
    Invoice.countDocuments(query),
  ]);

  return ApiResponse.success(res, invoices, 'Invoices retrieved', 200, {
    page: parseInt(page, 10),
    limit: parsedLimit,
    total,
    totalPages: Math.ceil(total / parsedLimit),
  });
});

export const getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, companyId: req.companyId })
    .populate('customerId')
    .populate('salesOrderId')
    .populate('createdBy', 'name email')
    .populate('postedBy', 'name email');

  if (!invoice) throw ApiError.notFound('Invoice not found');

  const payments = await Payment.find({
    companyId: req.companyId,
    invoiceId: invoice._id,
  }).populate('recordedBy', 'name email');

  return ApiResponse.success(res, { invoice, payments });
});

export const createInvoice = asyncHandler(async (req, res) => {
  const {
    customerId,
    salesOrderId,
    dueDate,
    items,
    notes,
    terms,
  } = req.body;

  if (!customerId || !dueDate || !items?.length) {
    throw ApiError.badRequest('Customer, due date, and invoice items are required');
  }

  const customer = await Customer.findOne({ _id: customerId, companyId: req.companyId });
  if (!customer) throw ApiError.notFound('Customer not found');

  let subtotal = 0;
  let taxTotal = 0;
  let discountTotal = 0;
  const processedItems = [];

  for (const item of items) {
    const product = await Product.findOne({ _id: item.productId, companyId: req.companyId });
    if (!product) throw ApiError.badRequest(`Invalid product identifier: ${item.productId}`);

    const qty = Number(item.quantity);
    const unitPrice = Number(item.unitPrice ?? product.sellingPrice ?? 0);
    const discountPct = Number(item.discountPercentage) || 0;
    const taxRate = Number(item.taxRate ?? product.taxRate ?? 0);

    const baseLineTotal = qty * unitPrice;
    const lineDiscount = Math.round(((baseLineTotal * discountPct) / 100) * 100) / 100;
    const lineSubtotal = Math.round((baseLineTotal - lineDiscount) * 100) / 100;
    const lineTax = Math.round(((lineSubtotal * taxRate) / 100) * 100) / 100;
    const lineTotal = Math.round((lineSubtotal + lineTax) * 100) / 100;

    subtotal += lineSubtotal;
    taxTotal += lineTax;
    discountTotal += lineDiscount;

    // Snapshot of product details to prevent master data mutation affecting historical invoice
    processedItems.push({
      product: product._id,
      sku: product.sku,
      name: product.name,
      description: item.description || product.description,
      quantity: qty,
      unitPrice,
      discountPercentage: discountPct,
      taxRate,
      taxAmount: lineTax,
      subtotal: lineSubtotal,
      total: lineTotal,
    });
  }

  const grandTotal = Math.round((subtotal + taxTotal) * 100) / 100;
  const invoiceNumber = await getNextSequence(req.companyId, 'INV', 'INV', 4);

  const invoice = await Invoice.create({
    companyId: req.companyId,
    invoiceNumber,
    salesOrderId: salesOrderId || null,
    customerId: customer._id,
    customerSnapshot: {
      name: customer.name,
      code: customer.code,
      email: customer.email,
      phone: customer.phone,
      billingAddress: customer.billingAddress,
      taxNumber: customer.taxNumber,
    },
    dueDate: new Date(dueDate),
    items: processedItems,
    subtotal,
    taxTotal,
    discountTotal,
    grandTotal,
    amountPaid: 0,
    balanceDue: grandTotal,
    status: INVOICE_STATUSES.DRAFT,
    createdBy: req.user._id,
    notes,
    terms,
  });

  await recordAuditLog({
    companyId: req.companyId,
    user: req.user,
    action: 'INVOICE_CREATED',
    module: 'INVOICING',
    recordId: invoice._id,
    recordRef: invoice.invoiceNumber,
    details: { customer: customer.name, grandTotal },
    req,
  });

  const createdInvoice = await Invoice.findById(invoice._id).populate('customerId', 'name code');
  return ApiResponse.created(res, createdInvoice, 'Invoice created successfully');
});

export const postInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await withTransaction(async (session) => {
    const invoice = await Invoice.findOne({ _id: id, companyId: req.companyId }).session(session);
    if (!invoice) throw ApiError.notFound('Invoice not found');

    if (invoice.status !== INVOICE_STATUSES.DRAFT) {
      throw ApiError.badRequest(`Invoice has already been posted or finalized (status: ${invoice.status})`);
    }

    invoice.status = INVOICE_STATUSES.POSTED;
    invoice.postedAt = new Date();
    invoice.postedBy = req.user._id;
    await invoice.save({ session });

    // Increase customer accounts receivable balance
    await Customer.findByIdAndUpdate(
      invoice.customerId,
      { $inc: { balance: invoice.grandTotal } },
      { session }
    );

    await recordAuditLog({
      companyId: req.companyId,
      user: req.user,
      action: 'INVOICE_POSTED',
      module: 'INVOICING',
      recordId: invoice._id,
      recordRef: invoice.invoiceNumber,
      details: { grandTotal: invoice.grandTotal },
      session,
    });

    return invoice;
  });

  return ApiResponse.success(res, result, 'Invoice posted to ledger successfully');
});

export const voidInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await withTransaction(async (session) => {
    const invoice = await Invoice.findOne({ _id: id, companyId: req.companyId }).session(session);
    if (!invoice) throw ApiError.notFound('Invoice not found');

    if (invoice.status === INVOICE_STATUSES.PAID) {
      throw ApiError.badRequest('Paid invoices cannot be voided. Issue a credit note or refund.');
    }

    if (invoice.amountPaid > 0) {
      throw ApiError.badRequest('Cannot void an invoice with recorded payments. Reverse payments first.');
    }

    if (invoice.status === INVOICE_STATUSES.POSTED) {
      // Reverse receivable from customer balance
      await Customer.findByIdAndUpdate(
        invoice.customerId,
        { $inc: { balance: -invoice.grandTotal } },
        { session }
      );
    }

    invoice.status = INVOICE_STATUSES.VOIDED;
    await invoice.save({ session });

    await recordAuditLog({
      companyId: req.companyId,
      user: req.user,
      action: 'INVOICE_VOIDED',
      module: 'INVOICING',
      recordId: invoice._id,
      recordRef: invoice.invoiceNumber,
      session,
    });

    return invoice;
  });

  return ApiResponse.success(res, result, 'Invoice voided successfully');
});
