import { Warehouse } from './warehouse.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getWarehouses = asyncHandler(async (req, res) => {
  const warehouses = await Warehouse.find({ companyId: req.companyId }).sort({ isDefault: -1, name: 1 });
  return ApiResponse.success(res, warehouses);
});

export const createWarehouse = asyncHandler(async (req, res) => {
  const { code, name, address, contactPerson, phone, isDefault } = req.body;
  if (!code || !name) {
    throw ApiError.badRequest('Warehouse Code and Name are required');
  }

  const existing = await Warehouse.findOne({
    companyId: req.companyId,
    code: code.toUpperCase().trim(),
  });
  if (existing) {
    throw ApiError.conflict(`Warehouse with code '${code}' already exists`);
  }

  if (isDefault) {
    await Warehouse.updateMany({ companyId: req.companyId }, { isDefault: false });
  }

  const warehouse = await Warehouse.create({
    companyId: req.companyId,
    code: code.toUpperCase().trim(),
    name: name.trim(),
    address,
    contactPerson,
    phone,
    isDefault: Boolean(isDefault),
  });

  return ApiResponse.created(res, warehouse, 'Warehouse created');
});

export const updateWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await Warehouse.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!warehouse) {
    throw ApiError.notFound('Warehouse not found');
  }

  if (req.body.name) warehouse.name = req.body.name.trim();
  if (req.body.address) warehouse.address = req.body.address;
  if (req.body.contactPerson !== undefined) warehouse.contactPerson = req.body.contactPerson;
  if (req.body.phone !== undefined) warehouse.phone = req.body.phone;
  if (req.body.isActive !== undefined) warehouse.isActive = req.body.isActive;

  if (req.body.isDefault) {
    await Warehouse.updateMany({ companyId: req.companyId }, { isDefault: false });
    warehouse.isDefault = true;
  }

  await warehouse.save();
  return ApiResponse.success(res, warehouse, 'Warehouse updated');
});
