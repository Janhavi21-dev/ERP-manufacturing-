import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/apiError.js';
import { User } from '../modules/users/user.model.js';
import { ROLES } from '../config/constants.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_manufacturing_erp_development_minimum_32_chars';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(ApiError.unauthorized('Authentication required. No token provided.'));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(ApiError.unauthorized('Session has expired. Please log in again.'));
      }
      return next(ApiError.unauthorized('Invalid authentication token.'));
    }

    const user = await User.findById(decoded.id).populate('role');
    if (!user) {
      return next(ApiError.unauthorized('User associated with this token no longer exists.'));
    }

    if (!user.isActive) {
      return next(ApiError.forbidden('This user account has been deactivated. Please contact your administrator.'));
    }

    req.user = user;
    req.companyId = user.companyId;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Restrict access to users with specified role(s)
 * @param  {...string} roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('User not authenticated'));
    }

    if (req.user.roleName === ROLES.SUPER_ADMIN) {
      return next();
    }

    if (!roles.includes(req.user.roleName)) {
      return next(
        ApiError.forbidden(
          `Forbidden: Role '${req.user.roleName}' is not authorized to access this resource`
        )
      );
    }

    next();
  };
};

/**
 * Check if the user has specific permission(s)
 * @param  {...string} permissions
 */
export const hasPermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('User not authenticated'));
    }

    if (req.user.roleName === ROLES.SUPER_ADMIN) {
      return next();
    }

    const userPermissions = req.user.role?.permissions || [];
    const hasAll = permissions.every((perm) => userPermissions.includes(perm));

    if (!hasAll) {
      return next(
        ApiError.forbidden('Forbidden: You do not have the required permissions for this action')
      );
    }

    next();
  };
};
