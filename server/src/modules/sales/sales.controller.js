import { SalesOrder } from './salesOrder.model.js';
import { Dispatch } from '../dispatch/dispatch.model.js';
import { Customer } from '../customers/customer.model.js';
import { Product } from '../products/product.model.js';
import { InventoryService } from '../inventory/inventory.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getNextSequence } from '../../utils/sequenceGenerator.js';
import { withTransaction } from '../../config/db.js';
import { recordAuditLog } from '../audit-logs/auditLog.model.js';
import { createNotification } from '../notifications/notification.model.js';
import { SALES_ORDER_STATUSES, STOCK_MOVEMENT_TYPES } from '../../config/constants.js';

export const getSalesOrders = asyncHandler(async (req, res) => {
  const { status, customerId, search, page = 1, limit = 20 } = req.query;

  const query = { companyId: req.companyId };
  if (status) query.status = status;
  if (customerId) query.customer = customerId;
  if (search) query.soNumber = { $regex: search, $options: 'i' };

  const parsedLimit = parseInt(limit, 10);
  const skip = (parseInt(page, 10) - 1) * parsedLimit;

  const [orders, total] = await Promise.all([
    SalesOrder.find(query)
      .populate('customer', 'name code email phone')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('items.product', 'sku name uom itemType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit),
    SalesOrder.countDocuments(query),
  ]);

  return ApiResponse.success(res, orders, 'Sales orders retrieved', 200, {
    page: parseInt(page, 10),
    limit: parsedLimit,
    total,
    totalPages: Math.ceil(total / parsedLimit),
  });
});

export const getSalesOrderById = asyncHandler(async (req, res) => {
  const order = await SalesOrder.findOne({ _id: req.params.id, companyId: req.companyId })
    .populate('customer')
    .populate('createdBy', 'name email')
    .populate('approvedBy', 'name email')
    .populate('items.product');

  if (!order) throw ApiError.notFound('Sales order not found');

  const dispatches = await Dispatch.find({
    companyId: req.companyId,
    salesOrderId: order._id,
  })
    .populate('warehouseId', 'name code')
    .populate('dispatchedBy', 'name email');

  return ApiResponse.success(res, { salesOrder: order, dispatches });
});

export const createSalesOrder = asyncHandler(async (req, res) => {
  const { customerId, items, deliveryDate, shippingAddress, paymentTerms, notes } = req.body;

  if (!customerId || !items?.length) {
    throw ApiError.badRequest('Customer and items are required');
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

    processedItems.push({
      product: product._id,
      quantity: qty,
      dispatchedQuantity: 0,
      unitPrice,
      discountPercentage: discountPct,
      taxRate,
      taxAmount: lineTax,
      subtotal: lineSubtotal,
      total: lineTotal,
    });
  }

  const grandTotal = Math.round((subtotal + taxTotal) * 100) / 100;
  const soNumber = await getNextSequence(req.companyId, 'SO', 'SO', 4);

  const order = await SalesOrder.create({
    companyId: req.companyId,
    soNumber,
    customer: customer._id,
    items: processedItems,
    subtotal,
    taxTotal,
    discountTotal,
    grandTotal,
    deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
    shippingAddress: shippingAddress || customer.shippingAddress || customer.billingAddress,
    paymentTerms: paymentTerms || customer.paymentTerms || 'Due on Receipt',
    notes,
    createdBy: req.user._id,
    status: SALES_ORDER_STATUSES.SUBMITTED,
  });

  await recordAuditLog({
    companyId: req.companyId,
    user: req.user,
    action: 'SALES_ORDER_CREATED',
    module: 'SALES',
    recordId: order._id,
    recordRef: order.soNumber,
    details: { customer: customer.name, grandTotal },
    req,
  });

  const createdOrder = await SalesOrder.findById(order._id)
    .populate('customer', 'name code')
    .populate('items.product', 'sku name uom');

  return ApiResponse.created(res, createdOrder, 'Sales order created successfully');
});

export const approveSalesOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await SalesOrder.findOne({ _id: id, companyId: req.companyId });
  if (!order) throw ApiError.notFound('Sales order not found');

  if (order.status !== SALES_ORDER_STATUSES.SUBMITTED && order.status !== SALES_ORDER_STATUSES.DRAFT) {
    throw ApiError.badRequest(`Cannot approve sales order in '${order.status}' status`);
  }

  order.status = SALES_ORDER_STATUSES.APPROVED;
  order.approvedBy = req.user._id;
  await order.save();

  await recordAuditLog({
    companyId: req.companyId,
    user: req.user,
    action: 'SALES_ORDER_APPROVED',
    module: 'SALES',
    recordId: order._id,
    recordRef: order.soNumber,
    req,
  });

  await createNotification({
    companyId: req.companyId,
    title: 'Sales Order Approved',
    message: `Sales Order ${order.soNumber} approved and ready for dispatch`,
    type: 'success',
    category: 'SALES',
    link: `/sales/orders/${order._id}`,
  });

  return ApiResponse.success(res, order, 'Sales order approved successfully');
});

// =================== DISPATCH / FULFILLMENT ===================

export const createDispatch = asyncHandler(async (req, res) => {
  const {
    salesOrderId,
    warehouseId,
    carrier,
    trackingNumber,
    items, // Array of { productId, dispatchQuantity, batchNumber }
    notes,
  } = req.body;

  if (!salesOrderId || !warehouseId || !items?.length) {
    throw ApiError.badRequest('Sales Order ID, Warehouse ID, and dispatch items are required');
  }

  const result = await withTransaction(async (session) => {
    const order = await SalesOrder.findOne({ _id: salesOrderId, companyId: req.companyId }).session(session);
    if (!order) throw ApiError.notFound('Sales Order not found');

    if (
      order.status !== SALES_ORDER_STATUSES.APPROVED &&
      order.status !== SALES_ORDER_STATUSES.PARTIALLY_FULFILLED
    ) {
      throw ApiError.badRequest(
        `Dispatches can only be created for 'approved' or 'partially_fulfilled' orders. Current status: ${order.status}`
      );
    }

    const dispatchNumber = await getNextSequence(req.companyId, 'DSP', 'DSP', 4, session);
    const dispatchItems = [];

    for (const item of items) {
      const pIdStr = (item.productId?._id || item.productId)?.toString();
      const soLine = order.items.find((i) => i.product.toString() === pIdStr);
      if (!soLine) {
        throw ApiError.badRequest(`Product ${pIdStr} is not part of Sales Order ${order.soNumber}`);
      }

      const dispatchQty = Number(item.dispatchQuantity);
      if (dispatchQty <= 0) {
        throw ApiError.badRequest('Dispatch quantity must be greater than zero');
      }

      const remainingAllowed = soLine.quantity - soLine.dispatchedQuantity;
      if (dispatchQty > remainingAllowed) {
        const product = await Product.findById(pIdStr).session(session);
        throw ApiError.badRequest(
          `Over-dispatch error for '${product?.name || pIdStr}'. Ordered: ${soLine.quantity}, Already dispatched: ${soLine.dispatchedQuantity}, Attempting to dispatch: ${dispatchQty}`
        );
      }

      // Deduct Finished Goods from Inventory
      await InventoryService.recordStockMovement({
        companyId: req.companyId,
        productId: soLine.product,
        warehouseId,
        type: STOCK_MOVEMENT_TYPES.SALES_DISPATCH,
        quantity: -dispatchQty,
        unitCost: soLine.unitPrice,
        batchNumber: item.batchNumber || null,
        referenceType: 'DISPATCH',
        referenceId: order._id,
        referenceNumber: `${order.soNumber} / ${dispatchNumber}`,
        user: req.user,
        notes: `Dispatched against Sales Order ${order.soNumber}`,
        session,
      });

      soLine.dispatchedQuantity += dispatchQty;

      dispatchItems.push({
        product: soLine.product,
        orderedQuantity: soLine.quantity,
        dispatchQuantity: dispatchQty,
        unitPrice: soLine.unitPrice,
        batchNumber: item.batchNumber || null,
      });
    }

    // Check if fully dispatched
    const isFullyDispatched = order.items.every((i) => i.dispatchedQuantity >= i.quantity);
    order.status = isFullyDispatched
      ? SALES_ORDER_STATUSES.FULFILLED
      : SALES_ORDER_STATUSES.PARTIALLY_FULFILLED;

    await order.save({ session });

    const dispatchRecord = new Dispatch({
      companyId: req.companyId,
      dispatchNumber,
      salesOrderId: order._id,
      customerId: order.customer,
      warehouseId,
      carrier,
      trackingNumber,
      items: dispatchItems,
      status: 'dispatched',
      dispatchedBy: req.user._id,
      notes,
    });

    await dispatchRecord.save({ session });

    await recordAuditLog({
      companyId: req.companyId,
      user: req.user,
      action: 'SALES_DISPATCHED',
      module: 'SALES',
      recordId: dispatchRecord._id,
      recordRef: `${order.soNumber} -> ${dispatchNumber}`,
      details: { soStatus: order.status },
      session,
    });

    await createNotification({
      companyId: req.companyId,
      title: 'Dispatch Confirmed',
      message: `Dispatch ${dispatchNumber} created for Order ${order.soNumber}. Goods deducted from stock.`,
      type: 'info',
      category: 'SALES',
      link: `/sales/dispatches`,
    });

    return { dispatch: dispatchRecord, salesOrder: order };
  });

  return ApiResponse.created(res, result, 'Goods dispatched and inventory reduced successfully');
});

export const getDispatches = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, salesOrderId } = req.query;

  const query = { companyId: req.companyId };
  if (salesOrderId) query.salesOrderId = salesOrderId;

  const parsedLimit = parseInt(limit, 10);
  const skip = (parseInt(page, 10) - 1) * parsedLimit;

  const [dispatches, total] = await Promise.all([
    Dispatch.find(query)
      .populate('salesOrderId', 'soNumber status grandTotal')
      .populate('customerId', 'name code')
      .populate('warehouseId', 'name code')
      .populate('dispatchedBy', 'name email')
      .populate('items.product', 'sku name uom')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit),
    Dispatch.countDocuments(query),
  ]);

  return ApiResponse.success(res, dispatches, 'Dispatches retrieved', 200, {
    page: parseInt(page, 10),
    limit: parsedLimit,
    total,
    totalPages: Math.ceil(total / parsedLimit),
  });
});
