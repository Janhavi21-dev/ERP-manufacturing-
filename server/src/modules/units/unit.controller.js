import { UnitOfMeasure } from './unit.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getUnits = asyncHandler(async (req, res) => {
  const units = await UnitOfMeasure.find({ companyId: req.companyId }).sort({ name: 1 });
  return ApiResponse.success(res, units);
});

export const createUnit = asyncHandler(async (req, res) => {
  const { code, name, symbol } = req.body;
  if (!code || !name || !symbol) {
    throw ApiError.badRequest('Code, Name, and Symbol are required');
  }

  const existing = await UnitOfMeasure.findOne({
    companyId: req.companyId,
    code: code.toUpperCase().trim(),
  });
  if (existing) {
    throw ApiError.conflict(`Unit code '${code}' already exists`);
  }

  const unit = await UnitOfMeasure.create({
    companyId: req.companyId,
    code: code.toUpperCase().trim(),
    name: name.trim(),
    symbol: symbol.trim(),
  });

  return ApiResponse.created(res, unit, 'Unit of measure created');
});
