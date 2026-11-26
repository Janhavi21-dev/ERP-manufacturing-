import { User } from './user.model.js';
import { Role } from '../roles/role.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { recordAuditLog } from '../audit-logs/auditLog.model.js';

export const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '', role = '', isActive } = req.query;

  const query = { companyId: req.companyId };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  if (role) {
    query.roleName = role;
  }

  if (isActive !== undefined && isActive !== '') {
    query.isActive = isActive === 'true';
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const parsedLimit = parseInt(limit, 10);

  const [users, total] = await Promise.all([
    User.find(query)
      .populate('role', 'name permissions isSystemRole')
      .populate('employeeId', 'employeeCode department designation')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit),
    User.countDocuments(query),
  ]);

  return ApiResponse.success(res, users, 'Users retrieved', 200, {
    page: parseInt(page, 10),
    limit: parsedLimit,
    total,
    totalPages: Math.ceil(total / parsedLimit),
  });
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    _id: req.params.id,
    companyId: req.companyId,
  })
    .populate('role')
    .populate('employeeId');

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return ApiResponse.success(res, user);
});

export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, roleId, employeeId } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict('A user with this email address already exists');
  }

  const role = await Role.findById(roleId);
  if (!role) {
    throw ApiError.badRequest('Specified role not found');
  }

  const user = await User.create({
    companyId: req.companyId,
    name,
    email: email.toLowerCase(),
    password,
    role: role._id,
    roleName: role.name,
    employeeId: employeeId || null,
    isActive: true,
  });

  await recordAuditLog({
    companyId: req.companyId,
    user: req.user,
    action: 'USER_CREATED',
    module: 'USERS',
    recordId: user._id,
    recordRef: user.email,
    details: { role: role.name },
    req,
  });

  const createdUser = await User.findById(user._id).populate('role');
  return ApiResponse.created(res, createdUser, 'User created successfully');
});

export const updateUser = asyncHandler(async (req, res) => {
  const { name, roleId, employeeId, isActive, password } = req.body;
  const user = await User.findOne({
    _id: req.params.id,
    companyId: req.companyId,
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (name) user.name = name;
  if (isActive !== undefined) user.isActive = isActive;
  if (employeeId !== undefined) user.employeeId = employeeId;

  if (roleId) {
    const role = await Role.findById(roleId);
    if (!role) throw ApiError.badRequest('Role not found');
    user.role = role._id;
    user.roleName = role.name;
  }

  if (password) {
    user.password = password; // triggers pre-save hash
  }

  await user.save();

  await recordAuditLog({
    companyId: req.companyId,
    user: req.user,
    action: 'USER_UPDATED',
    module: 'USERS',
    recordId: user._id,
    recordRef: user.email,
    req,
  });

  const updatedUser = await User.findById(user._id).populate('role');
  return ApiResponse.success(res, updatedUser, 'User updated successfully');
});

export const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    _id: req.params.id,
    companyId: req.companyId,
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (String(user._id) === String(req.user._id)) {
    throw ApiError.badRequest('You cannot deactivate your own account');
  }

  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });

  await recordAuditLog({
    companyId: req.companyId,
    user: req.user,
    action: user.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
    module: 'USERS',
    recordId: user._id,
    recordRef: user.email,
    req,
  });

  return ApiResponse.success(
    res,
    { id: user._id, isActive: user.isActive },
    `User ${user.isActive ? 'activated' : 'deactivated'} successfully`
  );
});
