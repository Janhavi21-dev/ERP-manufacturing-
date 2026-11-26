import { ProductCategory } from './category.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await ProductCategory.find({ companyId: req.companyId }).sort({ name: 1 });
  return ApiResponse.success(res, categories);
});

export const createCategory = asyncHandler(async (req, res) => {
  const { code, name, description } = req.body;
  if (!code || !name) {
    throw ApiError.badRequest('Code and Name are required');
  }

  const existing = await ProductCategory.findOne({
    companyId: req.companyId,
    code: code.toUpperCase().trim(),
  });
  if (existing) {
    throw ApiError.conflict(`Category code '${code}' already exists`);
  }

  const category = await ProductCategory.create({
    companyId: req.companyId,
    code: code.toUpperCase().trim(),
    name: name.trim(),
    description,
  });

  return ApiResponse.created(res, category, 'Category created');
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await ProductCategory.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!category) {
    throw ApiError.notFound('Category not found');
  }

  if (req.body.name) category.name = req.body.name.trim();
  if (req.body.description !== undefined) category.description = req.body.description;
  if (req.body.isActive !== undefined) category.isActive = req.body.isActive;

  await category.save();
  return ApiResponse.success(res, category, 'Category updated');
});
