import { Product } from './product.model.js';
import { StockBalance } from '../inventory/stockBalance.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { recordAuditLog } from '../audit-logs/auditLog.model.js';

export const getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    itemType = '',
    category = '',
    isActive,
    sortBy = 'name',
    sortOrder = 'asc',
  } = req.query;

  const query = { companyId: req.companyId };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
      { barcode: { $regex: search, $options: 'i' } },
    ];
  }

  if (itemType) query.itemType = itemType;
  if (category) query.category = category;
  if (isActive !== undefined && isActive !== '') query.isActive = isActive === 'true';

  const parsedLimit = parseInt(limit, 10);
  const skip = (parseInt(page, 10) - 1) * parsedLimit;
  const sortDirection = sortOrder === 'desc' ? -1 : 1;

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('category', 'name code')
      .populate('preferredSupplier', 'name code')
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(parsedLimit),
    Product.countDocuments(query),
  ]);

  return ApiResponse.success(res, products, 'Products retrieved', 200, {
    page: parseInt(page, 10),
    limit: parsedLimit,
    total,
    totalPages: Math.ceil(total / parsedLimit),
  });
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    _id: req.params.id,
    companyId: req.companyId,
  })
    .populate('category')
    .populate('preferredSupplier');

  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  // Also fetch stock balances across warehouses
  const balances = await StockBalance.find({
    companyId: req.companyId,
    productId: product._id,
  }).populate('warehouseId', 'name code');

  const onHand = balances.reduce((sum, b) => sum + b.onHand, 0);
  const reserved = balances.reduce((sum, b) => sum + b.reserved, 0);
  const quarantined = balances.reduce((sum, b) => sum + b.quarantined, 0);

  return ApiResponse.success(res, {
    product,
    inventory: {
      onHand,
      reserved,
      quarantined,
      available: Math.max(0, onHand - reserved - quarantined),
      balances,
    },
  });
});

export const createProduct = asyncHandler(async (req, res) => {
  const {
    sku,
    name,
    description,
    category,
    itemType,
    uom,
    barcode,
    standardCost = 0,
    sellingPrice = 0,
    reorderLevel = 10,
    reorderQuantity = 50,
    preferredSupplier,
    taxRate = 0,
    trackBatchExpiry = false,
  } = req.body;

  if (!sku || !name || !category || !itemType || !uom) {
    throw ApiError.badRequest('SKU, Name, Category, Item Type, and Unit of Measure are required');
  }

  const existing = await Product.findOne({
    companyId: req.companyId,
    sku: sku.toUpperCase().trim(),
  });
  if (existing) {
    throw ApiError.conflict(`Product with SKU '${sku}' already exists in your company`);
  }

  const product = await Product.create({
    companyId: req.companyId,
    sku: sku.toUpperCase().trim(),
    name: name.trim(),
    description,
    category,
    itemType,
    uom,
    barcode,
    standardCost: Number(standardCost) || 0,
    sellingPrice: Number(sellingPrice) || 0,
    reorderLevel: Number(reorderLevel) || 0,
    reorderQuantity: Number(reorderQuantity) || 0,
    preferredSupplier: preferredSupplier || null,
    taxRate: Number(taxRate) || 0,
    trackBatchExpiry: Boolean(trackBatchExpiry),
    isActive: true,
  });

  await recordAuditLog({
    companyId: req.companyId,
    user: req.user,
    action: 'PRODUCT_CREATED',
    module: 'PRODUCTS',
    recordId: product._id,
    recordRef: product.sku,
    details: { name: product.name, itemType: product.itemType },
    req,
  });

  const created = await Product.findById(product._id)
    .populate('category', 'name code')
    .populate('preferredSupplier', 'name code');

  return ApiResponse.created(res, created, 'Product created successfully');
});

export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findOne({ _id: id, companyId: req.companyId });

  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  const allowedUpdates = [
    'name',
    'description',
    'category',
    'itemType',
    'uom',
    'barcode',
    'standardCost',
    'sellingPrice',
    'reorderLevel',
    'reorderQuantity',
    'preferredSupplier',
    'taxRate',
    'trackBatchExpiry',
    'isActive',
  ];

  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      product[field] = req.body[field];
    }
  });

  await product.save();

  await recordAuditLog({
    companyId: req.companyId,
    user: req.user,
    action: 'PRODUCT_UPDATED',
    module: 'PRODUCTS',
    recordId: product._id,
    recordRef: product.sku,
    req,
  });

  const updated = await Product.findById(product._id)
    .populate('category', 'name code')
    .populate('preferredSupplier', 'name code');

  return ApiResponse.success(res, updated, 'Product updated successfully');
});

export const toggleProductStatus = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  product.isActive = !product.isActive;
  await product.save();

  return ApiResponse.success(
    res,
    { id: product._id, isActive: product.isActive },
    `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`
  );
});
