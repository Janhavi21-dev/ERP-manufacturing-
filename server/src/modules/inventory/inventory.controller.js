import { StockBalance } from './stockBalance.model.js';
import { StockMovement } from './stockMovement.model.js';
import { Product } from '../products/product.model.js';
import { InventoryService } from './inventory.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { withTransaction } from '../../config/db.js';

export const getStockOverview = asyncHandler(async (req, res) => {
  const { warehouseId, categoryId, itemType, search, lowStockOnly, page = 1, limit = 20 } = req.query;

  const productFilter = { companyId: req.companyId, isActive: true };
  if (categoryId) productFilter.category = categoryId;
  if (itemType) productFilter.itemType = itemType;
  if (search) {
    productFilter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
    ];
  }

  const products = await Product.find(productFilter)
    .populate('category', 'name code')
    .populate('preferredSupplier', 'name code')
    .sort({ name: 1 });

  const productIds = products.map((p) => p._id);

  const balanceQuery = {
    companyId: req.companyId,
    productId: { $in: productIds },
  };
  if (warehouseId) balanceQuery.warehouseId = warehouseId;

  const balances = await StockBalance.find(balanceQuery).populate('warehouseId', 'name code');

  // Map balances by productId
  const balanceMap = {};
  balances.forEach((b) => {
    const pId = b.productId.toString();
    if (!balanceMap[pId]) {
      balanceMap[pId] = [];
    }
    balanceMap[pId].push(b);
  });

  let overview = products.map((prod) => {
    const prodBalances = balanceMap[prod._id.toString()] || [];
    const totalOnHand = prodBalances.reduce((sum, b) => sum + (b.onHand || 0), 0);
    const totalReserved = prodBalances.reduce((sum, b) => sum + (b.reserved || 0), 0);
    const totalQuarantined = prodBalances.reduce((sum, b) => sum + (b.quarantined || 0), 0);
    const totalAvailable = Math.max(0, totalOnHand - totalReserved - totalQuarantined);
    const isLowStock = totalOnHand <= (prod.reorderLevel || 0);
    const valuation = Math.round(totalOnHand * (prod.standardCost || 0) * 100) / 100;

    return {
      product: {
        id: prod._id,
        sku: prod.sku,
        name: prod.name,
        category: prod.category,
        itemType: prod.itemType,
        uom: prod.uom,
        standardCost: prod.standardCost,
        sellingPrice: prod.sellingPrice,
        reorderLevel: prod.reorderLevel,
        reorderQuantity: prod.reorderQuantity,
      },
      totalOnHand,
      totalReserved,
      totalQuarantined,
      totalAvailable,
      isLowStock,
      valuation,
      warehouseBalances: prodBalances.map((b) => ({
        warehouse: b.warehouseId,
        onHand: b.onHand,
        reserved: b.reserved,
        quarantined: b.quarantined,
        available: Math.max(0, b.onHand - b.reserved - b.quarantined),
      })),
    };
  });

  if (lowStockOnly === 'true') {
    overview = overview.filter((item) => item.isLowStock);
  }

  const parsedPage = parseInt(page, 10);
  const parsedLimit = parseInt(limit, 10);
  const total = overview.length;
  const paginated = overview.slice((parsedPage - 1) * parsedLimit, parsedPage * parsedLimit);

  return ApiResponse.success(res, paginated, 'Stock overview retrieved', 200, {
    page: parsedPage,
    limit: parsedLimit,
    total,
    totalPages: Math.ceil(total / parsedLimit),
  });
});

export const getStockMovements = asyncHandler(async (req, res) => {
  const {
    productId,
    warehouseId,
    type,
    referenceType,
    referenceNumber,
    startDate,
    endDate,
    page = 1,
    limit = 20,
  } = req.query;

  const query = { companyId: req.companyId };

  if (productId) query.productId = productId;
  if (warehouseId) query.warehouseId = warehouseId;
  if (type) query.type = type;
  if (referenceType) query.referenceType = referenceType;
  if (referenceNumber) query.referenceNumber = { $regex: referenceNumber, $options: 'i' };

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.timestamp.$lte = end;
    }
  }

  const parsedLimit = parseInt(limit, 10);
  const skip = (parseInt(page, 10) - 1) * parsedLimit;

  const [movements, total] = await Promise.all([
    StockMovement.find(query)
      .populate('productId', 'sku name uom itemType')
      .populate('warehouseId', 'code name')
      .sort({ timestamp: -1, createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit),
    StockMovement.countDocuments(query),
  ]);

  return ApiResponse.success(res, movements, 'Stock movements retrieved', 200, {
    page: parseInt(page, 10),
    limit: parsedLimit,
    total,
    totalPages: Math.ceil(total / parsedLimit),
  });
});

export const adjustStock = asyncHandler(async (req, res) => {
  const { productId, warehouseId, adjustmentQuantity, reason } = req.body;

  if (!productId || !warehouseId || adjustmentQuantity === undefined || !reason) {
    throw ApiError.badRequest('Product, warehouse, adjustment quantity, and reason are required');
  }

  const result = await withTransaction(async (session) => {
    return await InventoryService.adjustStock({
      companyId: req.companyId,
      productId,
      warehouseId,
      adjustmentQuantity: Number(adjustmentQuantity),
      reason,
      user: req.user,
      session,
    });
  });

  return ApiResponse.created(res, result, 'Stock adjustment recorded successfully');
});

export const transferStock = asyncHandler(async (req, res) => {
  const { productId, fromWarehouseId, toWarehouseId, quantity, notes } = req.body;

  if (!productId || !fromWarehouseId || !toWarehouseId || !quantity) {
    throw ApiError.badRequest('Product, source warehouse, target warehouse, and quantity are required');
  }

  const result = await withTransaction(async (session) => {
    return await InventoryService.transferStock({
      companyId: req.companyId,
      productId,
      fromWarehouseId,
      toWarehouseId,
      quantity: Number(quantity),
      user: req.user,
      notes,
      session,
    });
  });

  return ApiResponse.success(res, result, 'Stock transfer completed successfully');
});

export const reconcileStock = asyncHandler(async (req, res) => {
  const { productId, warehouseId } = req.query;

  if (!productId || !warehouseId) {
    throw ApiError.badRequest('Product ID and Warehouse ID are required for reconciliation');
  }

  const result = await InventoryService.reconcileStock({
    companyId: req.companyId,
    productId,
    warehouseId,
  });

  return ApiResponse.success(res, result, 'Stock reconciliation report generated');
});

export const getReorderAlerts = asyncHandler(async (req, res) => {
  const products = await Product.find({ companyId: req.companyId, isActive: true })
    .populate('category', 'name')
    .populate('preferredSupplier', 'name code email phone');

  const balances = await StockBalance.find({ companyId: req.companyId });
  const onHandByProduct = {};
  balances.forEach((b) => {
    const pId = b.productId.toString();
    onHandByProduct[pId] = (onHandByProduct[pId] || 0) + (b.onHand || 0);
  });

  const alerts = [];
  products.forEach((prod) => {
    const onHand = onHandByProduct[prod._id.toString()] || 0;
    if (onHand <= prod.reorderLevel) {
      alerts.push({
        product: {
          id: prod._id,
          sku: prod.sku,
          name: prod.name,
          category: prod.category,
          uom: prod.uom,
          reorderLevel: prod.reorderLevel,
          reorderQuantity: prod.reorderQuantity,
          standardCost: prod.standardCost,
          preferredSupplier: prod.preferredSupplier,
        },
        currentStock: onHand,
        shortage: Math.max(0, prod.reorderLevel - onHand),
        recommendedOrder: prod.reorderQuantity,
      });
    }
  });

  return ApiResponse.success(res, alerts, 'Reorder alerts retrieved');
});
