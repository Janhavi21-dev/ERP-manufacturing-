import { Role } from './role.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { PERMISSIONS } from '../../config/constants.js';

export const getRoles = asyncHandler(async (req, res) => {
  const roles = await Role.find({
    $or: [{ companyId: req.companyId }, { companyId: null }],
  }).sort({ isSystemRole: -1, name: 1 });

  return ApiResponse.success(res, roles);
});

export const getPermissionsList = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, Object.values(PERMISSIONS));
});

export const createRole = asyncHandler(async (req, res) => {
  const { name, description, permissions } = req.body;

  const existing = await Role.findOne({
    companyId: req.companyId,
    name: { $regex: new RegExp(`^${name}$`, 'i') },
  });
  if (existing) {
    throw ApiError.conflict(`Role '${name}' already exists.`);
  }

  const role = await Role.create({
    companyId: req.companyId,
    name,
    description,
    permissions: permissions || [],
    isSystemRole: false,
  });

  return ApiResponse.created(res, role, 'Role created successfully');
});

export const updateRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { description, permissions } = req.body;

  const role = await Role.findOne({ _id: id, companyId: req.companyId });
  if (!role) {
    throw ApiError.notFound('Role not found or cannot be modified');
  }

  if (description !== undefined) role.description = description;
  if (permissions !== undefined) role.permissions = permissions;

  await role.save();

  return ApiResponse.success(res, role, 'Role updated successfully');
});
