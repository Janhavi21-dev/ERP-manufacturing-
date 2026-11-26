import { WorkOrder } from './workOrder.model.js';
import { BillOfMaterials } from '../bills-of-materials/bom.model.js';
import { Product } from '../products/product.model.js';
import { InventoryService } from '../inventory/inventory.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getNextSequence } from '../../utils/sequenceGenerator.js';
import { withTransaction } from '../../config/db.js';
import { recordAuditLog } from '../audit-logs/auditLog.model.js';
import { createNotification } from '../notifications/notification.model.js';
import { WORK_ORDER_STATUSES, STOCK_MOVEMENT_TYPES } from '../../config/constants.js';

export const getWorkOrders = asyncHandler(async (req, res) => {
  const { status, productId, priority, search, page = 1, limit = 20 } = req.query;

  const query = { companyId: req.companyId };
  if (status) query.status = status;
  if (productId) query.product = productId;
  if (priority) query.priority = priority;
  if (search) {
    query.workOrderNumber = { $regex: search, $options: 'i' };
  }

  const parsedLimit = parseInt(limit, 10);
  const skip = (parseInt(page, 10) - 1) * parsedLimit;

  const [orders, total] = await Promise.all([
    WorkOrder.find(query)
      .populate('product', 'sku name uom itemType standardCost')
      .populate('destinationWarehouse', 'code name')
      .populate('sourceWarehouse', 'code name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit),
    WorkOrder.countDocuments(query),
  ]);

  return ApiResponse.success(res, orders, 'Work orders retrieved', 200, {
    page: parseInt(page, 10),
    limit: parsedLimit,
    total,
    totalPages: Math.ceil(total / parsedLimit),
  });
});

export const getWorkOrderById = asyncHandler(async (req, res) => {
  const order = await WorkOrder.findOne({ _id: req.params.id, companyId: req.companyId })
    .populate('product')
    .populate('bom')
    .populate('destinationWarehouse')
    .populate('sourceWarehouse')
    .populate('assignedTo')
    .populate('createdBy', 'name email')
    .populate('plannedMaterials.product');

  if (!order) throw ApiError.notFound('Work Order not found');
  return ApiResponse.success(res, order);
});

export const createWorkOrder = asyncHandler(async (req, res) => {
  const {
    productId,
    bomId,
    plannedQuantity,
    destinationWarehouseId,
    sourceWarehouseId,
    startDate,
    targetDate,
    priority = 'medium',
    assignedTo,
    notes,
  } = req.body;

  if (!productId || !bomId || !plannedQuantity || !destinationWarehouseId || !sourceWarehouseId) {
    throw ApiError.badRequest(
      'Product, BOM, planned quantity, destination warehouse, and source warehouse are required'
    );
  }

  const [product, bom] = await Promise.all([
    Product.findOne({ _id: productId, companyId: req.companyId }),
    BillOfMaterials.findOne({ _id: bomId, companyId: req.companyId }).populate('components.product'),
  ]);

  if (!product) throw ApiError.notFound('Finished product not found');
  if (!bom) throw ApiError.notFound('Bill of Materials not found');

  const ratio = Number(plannedQuantity) / (bom.outputQuantity || 1);

  // Compute planned component requirements from BOM
  const plannedMaterials = bom.components.map((c) => {
    const rawQty = c.quantity * ratio;
    const scrap = (rawQty * (c.scrapPercentage || 0)) / 100;
    const required = Math.round((rawQty + scrap) * 1000) / 1000;

    return {
      product: c.product._id,
      requiredQuantity: required,
      issuedQuantity: 0,
      returnedQuantity: 0,
      unitCost: c.unitCost || c.product?.standardCost || 0,
    };
  });

  const workOrderNumber = await getNextSequence(req.companyId, 'WO', 'WO', 4);

  const workOrder = await WorkOrder.create({
    companyId: req.companyId,
    workOrderNumber,
    product: product._id,
    bom: bom._id,
    bomVersion: bom.version,
    plannedQuantity: Number(plannedQuantity),
    destinationWarehouse: destinationWarehouseId,
    sourceWarehouse: sourceWarehouseId,
    plannedMaterials,
    priority,
    startDate: startDate ? new Date(startDate) : new Date(),
    targetDate: targetDate ? new Date(targetDate) : null,
    assignedTo: assignedTo || null,
    notes,
    createdBy: req.user._id,
    status: WORK_ORDER_STATUSES.PLANNED,
  });

  await recordAuditLog({
    companyId: req.companyId,
    user: req.user,
    action: 'WORK_ORDER_CREATED',
    module: 'PRODUCTION',
    recordId: workOrder._id,
    recordRef: workOrder.workOrderNumber,
    details: { product: product.name, plannedQuantity },
    req,
  });

  const createdWO = await WorkOrder.findById(workOrder._id)
    .populate('product', 'sku name uom')
    .populate('destinationWarehouse', 'code name')
    .populate('sourceWarehouse', 'code name');

  return ApiResponse.created(res, createdWO, 'Work Order created successfully');
});

export const releaseWorkOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await withTransaction(async (session) => {
    const order = await WorkOrder.findOne({ _id: id, companyId: req.companyId }).session(session);
    if (!order) throw ApiError.notFound('Work Order not found');

    if (
      order.status !== WORK_ORDER_STATUSES.PLANNED &&
      order.status !== WORK_ORDER_STATUSES.APPROVED
    ) {
      throw ApiError.badRequest(`Cannot release work order with status '${order.status}'`);
    }

    // Check availability and reserve each required material
    for (const mat of order.plannedMaterials) {
      await InventoryService.reserveStock({
        companyId: req.companyId,
        productId: mat.product,
        warehouseId: order.sourceWarehouse,
        quantity: mat.requiredQuantity,
        session,
      });
    }

    order.status = WORK_ORDER_STATUSES.RELEASED;
    await order.save({ session });

    await recordAuditLog({
      companyId: req.companyId,
      user: req.user,
      action: 'WORK_ORDER_RELEASED',
      module: 'PRODUCTION',
      recordId: order._id,
      recordRef: order.workOrderNumber,
      details: { status: 'released' },
      session,
    });

    return order;
  });

  return ApiResponse.success(res, result, 'Work Order released and materials reserved successfully');
});

export const issueMaterials = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await withTransaction(async (session) => {
    const order = await WorkOrder.findOne({ _id: id, companyId: req.companyId }).session(session);
    if (!order) throw ApiError.notFound('Work Order not found');

    if (
      order.status !== WORK_ORDER_STATUSES.RELEASED &&
      order.status !== WORK_ORDER_STATUSES.IN_PROGRESS
    ) {
      throw ApiError.badRequest(
        `Materials can only be issued for released or in-progress orders. Current status: ${order.status}`
      );
    }

    // Physically issue each planned material
    for (const mat of order.plannedMaterials) {
      const remainingToIssue = mat.requiredQuantity - mat.issuedQuantity;
      if (remainingToIssue > 0) {
        // Release reservation
        await InventoryService.releaseReservation({
          companyId: req.companyId,
          productId: mat.product,
          warehouseId: order.sourceWarehouse,
          quantity: remainingToIssue,
          session,
        });

        // Deduct from stock
        await InventoryService.recordStockMovement({
          companyId: req.companyId,
          productId: mat.product,
          warehouseId: order.sourceWarehouse,
          type: STOCK_MOVEMENT_TYPES.PRODUCTION_ISSUE,
          quantity: -remainingToIssue,
          unitCost: mat.unitCost,
          referenceType: 'WORK_ORDER',
          referenceId: order._id,
          referenceNumber: order.workOrderNumber,
          user: req.user,
          notes: `Material issued for Work Order ${order.workOrderNumber}`,
          session,
        });

        mat.issuedQuantity = mat.requiredQuantity;
      }
    }

    order.status = WORK_ORDER_STATUSES.IN_PROGRESS;
    if (!order.actualStartDate) order.actualStartDate = new Date();
    await order.save({ session });

    await recordAuditLog({
      companyId: req.companyId,
      user: req.user,
      action: 'MATERIALS_ISSUED',
      module: 'PRODUCTION',
      recordId: order._id,
      recordRef: order.workOrderNumber,
      session,
    });

    return order;
  });

  return ApiResponse.success(res, result, 'Materials issued to production successfully');
});

export const reportProduction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { acceptedQuantity = 0, rejectedQuantity = 0, scrapQuantity = 0, notes } = req.body;

  const order = await WorkOrder.findOne({ _id: id, companyId: req.companyId });
  if (!order) throw ApiError.notFound('Work Order not found');

  if (order.status !== WORK_ORDER_STATUSES.IN_PROGRESS) {
    throw ApiError.badRequest('Production reporting is only allowed for in-progress work orders');
  }

  order.actualOutput.acceptedQuantity += Number(acceptedQuantity);
  order.actualOutput.rejectedQuantity += Number(rejectedQuantity);
  order.actualOutput.scrapQuantity += Number(scrapQuantity);

  if (notes) {
    order.notes = order.notes ? `${order.notes}\n${notes}` : notes;
  }

  await order.save();

  await recordAuditLog({
    companyId: req.companyId,
    user: req.user,
    action: 'PRODUCTION_REPORTED',
    module: 'PRODUCTION',
    recordId: order._id,
    recordRef: order.workOrderNumber,
    details: { acceptedQuantity, rejectedQuantity, scrapQuantity },
    req,
  });

  return ApiResponse.success(res, order, 'Production progress reported');
});

export const completeWorkOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { acceptedQuantity, batchNumber } = req.body;

  const result = await withTransaction(async (session) => {
    const order = await WorkOrder.findOne({ _id: id, companyId: req.companyId })
      .populate('product')
      .session(session);
    if (!order) throw ApiError.notFound('Work Order not found');

    if (order.status !== WORK_ORDER_STATUSES.IN_PROGRESS) {
      throw ApiError.badRequest(`Cannot complete work order with status '${order.status}'`);
    }

    const finalAccepted =
      acceptedQuantity !== undefined ? Number(acceptedQuantity) : order.actualOutput.acceptedQuantity;

    if (finalAccepted <= 0) {
      throw ApiError.badRequest('At least 1 accepted unit of finished goods is required to complete');
    }

    order.actualOutput.acceptedQuantity = finalAccepted;
    order.status = WORK_ORDER_STATUSES.COMPLETED;
    order.actualCompletionDate = new Date();
    if (batchNumber) order.batchNumber = batchNumber;

    // Receive Finished Goods into Destination Warehouse
    await InventoryService.recordStockMovement({
      companyId: req.companyId,
      productId: order.product._id,
      warehouseId: order.destinationWarehouse,
      type: STOCK_MOVEMENT_TYPES.FINISHED_GOODS_RECEIPT,
      quantity: finalAccepted,
      unitCost: order.product.standardCost || 0,
      batchNumber: order.batchNumber || null,
      referenceType: 'WORK_ORDER',
      referenceId: order._id,
      referenceNumber: order.workOrderNumber,
      user: req.user,
      notes: `Finished goods completed from Work Order ${order.workOrderNumber}`,
      session,
    });

    await order.save({ session });

    await recordAuditLog({
      companyId: req.companyId,
      user: req.user,
      action: 'WORK_ORDER_COMPLETED',
      module: 'PRODUCTION',
      recordId: order._id,
      recordRef: order.workOrderNumber,
      details: {
        product: order.product.name,
        completedQuantity: finalAccepted,
      },
      session,
    });

    await createNotification({
      companyId: req.companyId,
      title: 'Production Completed',
      message: `Work Order ${order.workOrderNumber} completed. ${finalAccepted} ${order.product.uom} of ${order.product.name} received into inventory.`,
      type: 'success',
      category: 'PRODUCTION',
      link: `/production/work-orders/${order._id}`,
    });

    return order;
  });

  return ApiResponse.success(res, result, 'Work order completed and finished goods added to stock');
});
