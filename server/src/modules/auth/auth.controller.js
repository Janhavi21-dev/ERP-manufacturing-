import { User } from '../users/user.model.js';
import { Company } from '../company/company.model.js';
import { ApiError } from '../../utils/apiError.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { recordAuditLog } from '../audit-logs/auditLog.model.js';

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() })
    .select('+password')
    .populate('role');

  if (!user) {
    await recordAuditLog({
      companyId: null,
      user: null,
      action: 'LOGIN_FAILED',
      module: 'AUTH',
      details: { email, reason: 'User not found' },
      status: 'FAILURE',
      req,
    });
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isActive) {
    await recordAuditLog({
      companyId: user.companyId,
      user,
      action: 'LOGIN_BLOCKED',
      module: 'AUTH',
      details: { email, reason: 'Account deactivated' },
      status: 'FAILURE',
      req,
    });
    throw ApiError.forbidden('Your account has been deactivated. Please contact your administrator.');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    await recordAuditLog({
      companyId: user.companyId,
      user,
      action: 'LOGIN_FAILED',
      module: 'AUTH',
      details: { email, reason: 'Incorrect password' },
      status: 'FAILURE',
      req,
    });
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Generate Token
  const token = user.generateAuthToken();

  // Update last login
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  // Load company info
  const company = await Company.findById(user.companyId);

  // Set secure cookie
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieExpiresDays = parseInt(process.env.JWT_COOKIE_EXPIRES_DAYS || '7', 10);
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: cookieExpiresDays * 24 * 60 * 60 * 1000,
  });

  await recordAuditLog({
    companyId: user.companyId,
    user,
    action: 'LOGIN_SUCCESS',
    module: 'AUTH',
    recordId: user._id,
    recordRef: user.email,
    details: { role: user.roleName },
    req,
  });

  return ApiResponse.success(res, {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.roleName,
      permissions: user.role?.permissions || [],
      company: company
        ? {
            id: company._id,
            name: company.name,
            code: company.code,
            currency: company.currency,
            timezone: company.timezone,
            settings: company.settings,
          }
        : null,
    },
  }, 'Logged in successfully');
});

export const logout = asyncHandler(async (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  });

  if (req.user) {
    await recordAuditLog({
      companyId: req.user.companyId,
      user: req.user,
      action: 'LOGOUT',
      module: 'AUTH',
      recordId: req.user._id,
      recordRef: req.user.email,
      req,
    });
  }

  return ApiResponse.success(res, null, 'Logged out successfully');
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('role');
  const company = await Company.findById(user.companyId);

  return ApiResponse.success(res, {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.roleName,
    permissions: user.role?.permissions || [],
    employeeId: user.employeeId,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    company: company
      ? {
          id: company._id,
          name: company.name,
          code: company.code,
          currency: company.currency,
          timezone: company.timezone,
          settings: company.settings,
        }
      : null,
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  const isCurrentValid = await user.comparePassword(currentPassword);
  if (!isCurrentValid) {
    throw ApiError.badRequest('Current password does not match');
  }

  user.password = newPassword;
  await user.save();

  await recordAuditLog({
    companyId: user.companyId,
    user,
    action: 'PASSWORD_CHANGED',
    module: 'AUTH',
    recordId: user._id,
    recordRef: user.email,
    req,
  });

  return ApiResponse.success(res, null, 'Password updated successfully');
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  const user = await User.findById(req.user._id);

  if (email && email.toLowerCase() !== user.email) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw ApiError.conflict('Email is already in use by another account');
    }
    user.email = email.toLowerCase();
  }

  if (name) {
    user.name = name;
  }

  await user.save();

  return ApiResponse.success(res, {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.roleName,
  }, 'Profile updated successfully');
});
