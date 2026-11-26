import { BillOfMaterials } from './bom.model.js';
import { Product } from '../products/product.model.js';
import { StockBalance } from '../inventory/stockBalance.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getNextSequence } from '../../utils/sequenceGenerator.js';

export const getBOMs = asyncHandler(async (req, res) => {
  const { productId, isActive, page = 1, limit = 20 } = req.query;
  const query = { companyId: req.companyId };
  if (productId) query.product = productId;
  if (isActive !== undefined && isActive !== '') query.isActive = isActive === 'true';

  const parsedLimit = parseInt(limit, 10);
  const skip = (parseInt(page, 10) - 1) * parsedLimit;

  const [boms, total] = await Promise.all([
    BillOfMaterials.find(query)
      .populate('product', 'sku name uom itemType standardCost')
      .populate('components.product', 'sku name uom standardCost')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit),
    BillOfMaterials.countDocuments(query),
  ]);

  return ApiResponse.success(res, boms, 'BOMs retrieved', 200, {
    page: parseInt(page, 10),
    limit: parsedLimit,
    total,
    totalPages: Math.ceil(total / parsedLimit),
  });
});

export const getBOMById = asyncHandler(async (req, res) => {
  const bom = await BillOfMaterials.findOne({ _id: req.params.id, companyId: req.companyId })
    .populate('product')
    .populate('components.product');

  if (!bom) throw ApiError.notFound('Bill of Materials not found');
  return ApiResponse.success(res, bom);
});

export const createBOM = asyncHandler(async (req, res) => {
  const {
    productId,
    version = '1.0',
    outputQuantity = 1,
    outputUnit,
    components,
    laborCost = 0,
    overheadCost = 0,
    notes,
  } = req.body;

  if (!productId || !components?.length) {
    throw ApiError.badRequest('Finished product and at least one component are required');
  }

  const finishedProduct = await Product.findOne({ _id: productId, companyId: req.companyId });
  if (!finishedProduct) throw ApiError.notFound('Finished product not found');

  // Circular dependency check: component cannot be the same as output product
  let calculatedMaterialCost = 0;
  const processedComponents = [];

  for (const comp of components) {
    if (comp.productId.toString() === productId.toString()) {
      throw ApiError.badRequest(
        `Circular dependency detected: Component '${finishedProduct.name}' cannot be used as an ingredient for itself`
      );
    }

    const compProd = await Product.findOne({ _id: comp.productId, companyId: req.companyId });
    if (!compProd) throw ApiError.badRequest(`Component product not found: ${comp.productId}`);

    const qty = Number(comp.quantity);
    const scrapPct = Number(comp.scrapPercentage) || 0;
    const effectiveQty = qty * (1 + scrapPct / 100);
    const unitCost = Number(comp.unitCost ?? compProd.standardCost ?? 0);
    const componentTotalCost = Math.round(effectiveQty * unitCost * 100) / 100;

    calculatedMaterialCost += componentTotalCost;

    processedComponents.push({
      product: compProd._id,
      quantity: qty,
      scrapPercentage: scrapPct,
      unitCost,
      notes: comp.notes || '',
    });
  }

  const totalEstimatedCost =
    Math.round((calculatedMaterialCost + Number(laborCost) + Number(overheadCost)) * 100) / 100;

  const bomNumber = await getNextSequence(req.companyId, 'BOM', 'BOM', 4);

  const bom = await BillOfMaterials.create({
    companyId: req.companyId,
    bomNumber,
    version,
    product: finishedProduct._id,
    outputQuantity: Number(outputQuantity) || 1,
    outputUnit: outputUnit || finishedProduct.uom,
    components: processedComponents,
    estimatedMaterialCost: Math.round(calculatedMaterialCost * 100) / 100,
    laborCost: Number(laborCost) || 0,
    overheadCost: Number(overheadCost) || 0,
    totalEstimatedCost,
    isApproved: true,
    isActive: true,
    notes,
  });

  const createdBOM = await BillOfMaterials.findById(bom._id)
    .populate('product', 'sku name uom')
    .populate('components.product', 'sku name uom');

  return ApiResponse.created(res, createdBOM, 'Bill of Materials created successfully');
});

/**
 * Calculate theoretical material requirements and check inventory availability
 */
export const calculateRequirements = asyncHandler(async (req, res) => {
  const { bomId, plannedQuantity, warehouseId } = req.body;

  if (!bomId || !plannedQuantity) {
    throw ApiError.badRequest('BOM ID and planned quantity are required');
  }

  const bom = await BillOfMaterials.findOne({ _id: bomId, companyId: req.companyId })
    .populate('product')
    .populate('components.product');

  if (!bom) throw ApiError.notFound('BOM not found');

  const productionRatio = Number(plannedQuantity) / (bom.outputQuantity || 1);
  const requirements = [];
  let hasShortage = false;

  for (const comp of bom.components) {
    const rawQty = comp.quantity * productionRatio;
    const scrapAllowance = (rawQty * (comp.scrapPercentage || 0)) / 100;
    const requiredQty = Math.round((rawQty + scrapAllowance) * 1000) / 1000;

    // Check stock balance in selected warehouse or across all warehouses
    const balanceQuery = { companyId: req.companyId, productId: comp.product._id };
    if (warehouseId) balanceQuery.warehouseId = warehouseId;

    const balances = await StockBalance.find(balanceQuery);
    const onHand = balances.reduce((sum, b) => sum + (b.onHand || 0), 0);
    const reserved = balances.reduce((sum, b) => sum + (b.reserved || 0), 0);
    const quarantined = balances.reduce((sum, b) => sum + (b.quarantined || 0), 0);
    const available = Math.max(0, onHand - reserved - quarantined);

    const isShortage = available < requiredQty;
    if (isShortage) hasShortage = true;

    requirements.push({
      product: {
        id: comp.product._id,
        sku: comp.product.sku,
        name: comp.product.name,
        uom: comp.product.uom,
        standardCost: comp.product.standardCost,
      },
      baseQuantity: comp.quantity,
      scrapPercentage: comp.scrapPercentage,
      requiredQuantity: requiredQty,
      onHand,
      reserved,
      quarantined,
      available,
      isShortage,
      shortageQuantity: isShortage ? Math.round((requiredQty - available) * 1000) / 1000 : 0,
      estimatedCost: Math.round(requiredQty * (comp.unitCost || comp.product.standardCost || 0) * 100) / 100,
    });
  }

  const totalEstimatedMaterialCost = requirements.reduce((acc, r) => acc + r.estimatedCost, 0);

  return ApiResponse.success(res, {
    bom: {
      id: bom._id,
      bomNumber: bom.bomNumber,
      version: bom.version,
      product: bom.product,
      outputQuantity: bom.outputQuantity,
    },
    plannedQuantity: Number(plannedQuantity),
    requirements,
    hasShortage,
    totalEstimatedMaterialCost: Math.round(totalEstimatedMaterialCost * 100) / 100,
  });
});
