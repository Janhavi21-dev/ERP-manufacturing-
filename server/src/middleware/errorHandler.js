import { ApiError } from '../utils/apiError.js';

export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    const message = `Invalid resource identifier: ${err.value}`;
    error = new ApiError(400, message);
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `Duplicate value entered for ${field}. A record with this ${field} already exists.`;
    error = new ApiError(409, message);
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    error = new ApiError(400, 'Database validation failed', messages);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Invalid authentication token');
  }

  if (err.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Authentication token has expired. Please log in again.');
  }

  // Handle Zod Validation Error (if passed directly)
  if (err.name === 'ZodError') {
    const formattedErrors = err.errors?.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    })) || [];
    error = new ApiError(400, 'Request validation failed', formattedErrors);
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const response = {
    success: false,
    statusCode,
    message,
    ...(error.errors?.length > 0 && { errors: error.errors }),
    ...((process.env.NODE_ENV || 'development') === 'development' && { stack: error.stack }),
  };

  if (statusCode >= 500) {
    console.error('💥 Server Error:', err);
  }

  return res.status(statusCode).json(response);
};
