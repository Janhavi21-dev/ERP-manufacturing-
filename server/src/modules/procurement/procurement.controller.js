import { PurchaseOrder } from './purchaseOrder.model.js';
import { PurchaseRequisition } from './purchaseRequisition.model.js';
import { GoodsReceipt } from './goodsReceipt.model.js';
import { Product } from '../products/product.model.js';
import { Supplier } from '../suppliers/supplier.model.js';
import { InventoryService } from '../inventory/inventory.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getNextSequence } from '../../utils/sequenceGenerator.js';
import { withTransaction } from '../../config/db.js';
import { recordAuditLog } from '../audit-logs/auditLog.model.js';
import { createNotification } from '../notifications/notification.model.js';
import { PO_STATUSES, STOCK_MOVEMENT_TYPES } from '../../config/constants.js';

// =================== PURCHASE REQUISITIONS ===================

export const getRequisitions = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = { companyId: req.companyId };
  if (status) query.status = status;

  const parsedLimit = parseInt(limit, 10);
  const skip = (parseInt(page, 10) - 1) * parsedLimit;

  const [requisitions, total] = await Promise.all([
    PurchaseRequisition.find(query)
      .populate('requestedBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('items.product', 'sku name uom')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit),
    PurchaseRequisition.countDocuments(query),
  ]);

  return ApiResponse.success(res, requisitions, 'Requisitions retrieved', 200, {
    page: parseInt(page, 10),
    limit: parsedLimit,
    total,
    totalPages: Math.ceil(total / parsedLimit),
  });
});

export const createRequisition = asyncHandler(async (req, res) => {
  const { department, items, reason } = req.body;
  if (!department || !items?.length) {
    throw ApiError.badRequest('Department and at least one item are required');
  }

  const reqNumber = await getNextSequence(req.companyId, 'REQ', 'REQ', 4);

  const requisition = await PurchaseRequisition.create({
    companyId: req.companyId,
    requisitionNumber: reqNumber,
    department,
    requestedBy: req.user._id,
    items,
    reason,
    status: 'submitted',
  });

  await recordAuditLog({
    companyId: req.companyId,
    user: req.user,
    action: 'REQUISITION_CREATED',
    module: 'PROCUREMENT',
    recordId: requisition._id,
    recordRef: requisition.requisitionNumber,
    req,
  });

  return ApiResponse.created(res, requisition, 'Purchase requisition submitted');
});

export const approveRequisition = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action, notes } = req.body; // action: 'approve' | 'reject'

  const requisition = await PurchaseRequisition.findOne({ _id: id, companyId: req.companyId });
  if (!requisition) throw ApiError.notFound('Requisition not found');

  if (requisition.status !== 'submitted') {
    throw ApiError.badRequest(`Cannot modify requisition with status '${requisition.status}'`);
  }

  requisition.status = action === 'approve' ? 'approved' : 'rejected';
  requisition.approvedBy = req.user._id;
  requisition.approvalDate = new Date();
  requisition.approvalNotes = notes || '';
  await requisition.save();

  return ApiResponse.success(res, requisition, `Requisition ${requisition.status}`);
});

// =================== PURCHASE ORDERS ===================

export const getPurchaseOrders = asyncHandler(async (req, res) => {
  const { status, supplierId, search, page = 1, limit = 20 } = req.query;

  const query = { companyId: req.companyId };
  if (status) query.status = status;
  if (supplierId) query.supplier = supplierId;
  if (search) {
    query.poNumber = { $regex: search, $options: 'i' };
  }

  const parsedLimit = parseInt(limit, 10);
  const skip = (parseInt(page, 10) - 1) * parsedLimit;

  const [orders, total] = await Promise.all([
    PurchaseOrder.find(query)
      .populate('supplier', 'name code email phone')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('items.product', 'sku name uom')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit),
    PurchaseOrder.countDocuments(query),
  ]);

  return ApiResponse.success(res, orders, 'Purchase orders retrieved', 200, {
    page: parseInt(page, 10),
    limit: parsedLimit,
    total,
    totalPages: Math.ceil(total / parsedLimit),
  });
});

export const getPurchaseOrderById = asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.findOne({ _id: req.params.id, companyId: req.companyId })
    .populate('supplier')
    .populate('createdBy', 'name email')
    .populate('approvedBy', 'name email')
    .populate('items.product');

  if (!po) throw ApiError.notFound('Purchase Order not found');

  // Also fetch any goods receipts tied to this PO
  const receipts = await GoodsReceipt.find({
    companyId: req.companyId,
    purchaseOrderId: po._id,
  })
    .populate('warehouseId', 'name code')
    .populate('receivedBy', 'name email');

  return ApiResponse.success(res, { purchaseOrder: po, goodsReceipts: receipts });
});

export const createPurchaseOrder = asyncHandler(async (req, res) => {
  const { supplierId, items, expectedDeliveryDate, paymentTerms, notes } = req.body;

  if (!supplierId || !items?.length) {
    throw ApiError.badRequest('Supplier and items are required');
  }

  const supplier = await Supplier.findOne({ _id: supplierId, companyId: req.companyId });
  if (!supplier) throw ApiError.notFound('Supplier not found');

  // Backend calculation of prices and tax
  let subtotal = 0;
  let taxTotal = 0;

  const processedItems = [];
  for (const item of items) {
    const product = await Product.findOne({ _id: item.productId, companyId: req.companyId });
    if (!product) throw ApiError.badRequest(`Invalid product identifier: ${item.productId}`);

    const qty = Number(item.quantity);
    const unitPrice = Number(item.unitPrice ?? product.standardCost ?? 0);
    const taxRate = Number(item.taxRate ?? product.taxRate ?? 0);

    const lineSubtotal = Math.round(qty * unitPrice * 100) / 100;
    const lineTax = Math.round(((lineSubtotal * taxRate) / 100) * 100) / 100;
    const lineTotal = Math.round((lineSubtotal + lineTax) * 100) / 100;

    subtotal += lineSubtotal;
    taxTotal += lineTax;

    processedItems.push({
      product: product._id,
      quantity: qty,
      receivedQuantity: 0,
      unitPrice,
      taxRate,
      taxAmount: lineTax,
      subtotal: lineSubtotal,
      total: lineTotal,
    });
  }

  const grandTotal = Math.round((subtotal + taxTotal) * 100) / 100;
  const poNumber = await getNextSequence(req.companyId, 'PO', 'PO', 4);

  const po = await PurchaseOrder.create({
    companyId: req.companyId,
    poNumber,
    supplier: supplier._id,
    items: processedItems,
    subtotal,
    taxTotal,
    grandTotal,
    expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
    paymentTerms: paymentTerms || supplier.paymentTerms || 'Net 30',
    notes,
    createdBy: req.user._id,
    status: PO_STATUSES.SUBMITTED,
  });

  await recordAuditLog({
    companyId: req.companyId,
    user: req.user,
    action: 'PURCHASE_ORDER_CREATED',
    module: 'PROCUREMENT',
    recordId: po._id,
    recordRef: po.poNumber,
    details: { supplier: supplier.name, grandTotal },
    req,
  });

  const createdPO = await PurchaseOrder.findById(po._id)
    .populate('supplier', 'name code')
    .populate('items.product', 'sku name uom');

  return ApiResponse.created(res, createdPO, 'Purchase order created successfully');
});

export const approvePurchaseOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const po = await PurchaseOrder.findOne({ _id: id, companyId: req.companyId });
  if (!po) throw ApiError.notFound('Purchase Order not found');

  if (po.status !== PO_STATUSES.SUBMITTED && po.status !== PO_STATUSES.DRAFT) {
    throw ApiError.badRequest(`Cannot approve PO in '${po.status}' status`);
  }

  po.status = PO_STATUSES.APPROVED;
  po.approvedBy = req.user._id;
  po.approvalDate = new Date();
  await po.save();

  await recordAuditLog({
    companyId: req.companyId,
    user: req.user,
    action: 'PURCHASE_ORDER_APPROVED',
    module: 'PROCUREMENT',
    recordId: po._id,
    recordRef: po.poNumber,
    req,
  });

  await createNotification({
    companyId: req.companyId,
    title: 'PO Approved',
    message: `Purchase order ${po.poNumber} has been approved and is ready for receiving`,
    type: 'success',
    category: 'PROCUREMENT',
    link: `/procurement/orders/${po._id}`,
  });

  return ApiResponse.success(res, po, 'Purchase Order approved successfully');
});

// =================== GOODS RECEIPT (RECEIVING & QC) ===================

export const receiveGoods = asyncHandler(async (req, res) => {
  const {
    purchaseOrderId,
    warehouseId,
    deliveryNoteNumber,
    items, // Array of { productId, receivedQuantity, acceptedQuantity, rejectedQuantity, batchNumber, rejectionReason }
    notes,
  } = req.body;

  if (!purchaseOrderId || !warehouseId || !items?.length) {
    throw ApiError.badRequest('Purchase order ID, warehouse ID, and items are required');
  }

  const result = await withTransaction(async (session) => {
    const po = await PurchaseOrder.findOne({ _id: purchaseOrderId, companyId: req.companyId }).session(session);
    if (!po) throw ApiError.notFound('Purchase Order not found');

    if (po.status !== PO_STATUSES.APPROVED && po.status !== PO_STATUSES.PARTIALLY_RECEIVED) {
      throw ApiError.badRequest(
        `Goods can only be received against 'approved' or 'partially_received' orders. Current status: ${po.status}`
      );
    }

    const grnNumber = await getNextSequence(req.companyId, 'GRN', 'GRN', 4, session);
    const grnItems = [];
    let totalAcceptedValue = 0;

    for (const item of items) {
      const poLine = po.items.find((i) => i.product.toString() === item.productId.toString());
      if (!poLine) {
        throw ApiError.badRequest(`Product ${item.productId} is not part of PO ${po.poNumber}`);
      }

      const receivedQty = Number(item.receivedQuantity) || 0;
      const acceptedQty = Number(item.acceptedQuantity ?? receivedQty) || 0;
      const rejectedQty = Number(item.rejectedQuantity) || Math.max(0, receivedQty - acceptedQty);

      if (receivedQty <= 0) {
        throw ApiError.badRequest('Received quantity must be greater than zero');
      }

      // Check over-receiving prevention
      const remainingAllowed = poLine.quantity - poLine.receivedQuantity;
      if (acceptedQty > remainingAllowed) {
        const product = await Product.findById(item.productId).session(session);
        throw ApiError.badRequest(
          `Cannot receive ${acceptedQty} for '${product?.name || item.productId}'. Remaining expected: ${remainingAllowed}`
        );
      }

      // Record stock movement for accepted quantities
      if (acceptedQty > 0) {
        await InventoryService.recordStockMovement({
          companyId: req.companyId,
          productId: item.productId,
          warehouseId,
          type: STOCK_MOVEMENT_TYPES.PURCHASE_RECEIPT,
          quantity: acceptedQty,
          unitCost: poLine.unitPrice,
          batchNumber: item.batchNumber || null,
          referenceType: 'PURCHASE_RECEIPT',
          referenceId: po._id,
          referenceNumber: `${po.poNumber} / ${grnNumber}`,
          user: req.user,
          notes: `Goods received against PO ${po.poNumber}`,
          session,
        });

        totalAcceptedValue += acceptedQty * poLine.unitPrice;
      }

      // Update PO line item received quantity
      poLine.receivedQuantity += acceptedQty;

      grnItems.push({
        product: item.productId,
        orderedQuantity: poLine.quantity,
        receivedQuantity: receivedQty,
        acceptedQuantity: acceptedQty,
        rejectedQuantity: rejectedQty,
        unitCost: poLine.unitPrice,
        batchNumber: item.batchNumber || null,
        rejectionReason: item.rejectionReason || null,
      });
    }

    // Determine new PO status: are all items fully received?
    const isFullyReceived = po.items.every((i) => i.receivedQuantity >= i.quantity);
    po.status = isFullyReceived ? PO_STATUSES.RECEIVED : PO_STATUSES.PARTIALLY_RECEIVED;
    await po.save({ session });

    // Update supplier payable balance
    await Supplier.findByIdAndUpdate(
      po.supplier,
      { $inc: { balance: totalAcceptedValue } },
      { session }
    );

    // Create GoodsReceipt document
    const inspectionStatus = grnItems.some((i) => i.rejectedQuantity > 0)
      ? grnItems.every((i) => i.acceptedQuantity === 0)
        ? 'failed'
        : 'partial'
      : 'passed';

    const goodsReceipt = new GoodsReceipt({
      companyId: req.companyId,
      grnNumber,
      purchaseOrderId: po._id,
      supplierId: po.supplier,
      warehouseId,
      deliveryNoteNumber,
      items: grnItems,
      inspectionStatus,
      receivedBy: req.user._id,
      notes,
    });

    await goodsReceipt.save({ session });

    await recordAuditLog({
      companyId: req.companyId,
      user: req.user,
      action: 'GOODS_RECEIVED',
      module: 'PROCUREMENT',
      recordId: goodsReceipt._id,
      recordRef: `${po.poNumber} -> ${grnNumber}`,
      details: {
        poStatus: po.status,
        inspectionStatus,
        totalAcceptedValue,
      },
      session,
    });

    return { goodsReceipt, purchaseOrder: po };
  });

  return ApiResponse.created(res, result, 'Goods received and inventory updated successfully');
});

export const getGoodsReceipts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, poId } = req.query;
  const query = { companyId: req.companyId };
  if (poId) query.purchaseOrderId = poId;

  const parsedLimit = parseInt(limit, 10);
  const skip = (parseInt(page, 10) - 1) * parsedLimit;

  const [receipts, total] = await Promise.all([
    GoodsReceipt.find(query)
      .populate('purchaseOrderId', 'poNumber status')
      .populate('supplierId', 'name code')
      .populate('warehouseId', 'name code')
      .populate('receivedBy', 'name email')
      .populate('items.product', 'sku name uom')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit),
    GoodsReceipt.countDocuments(query),
  ]);

  return ApiResponse.success(res, receipts, 'Goods receipts retrieved', 200, {
    page: parseInt(page, 10),
    limit: parsedLimit,
    total,
    totalPages: Math.ceil(total / parsedLimit),
  });
});
