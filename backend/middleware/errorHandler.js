import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

export const notFound = (req, res, next) => next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));

export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  let status = err.statusCode || 500;
  let message = err.isOperational ? err.message : 'Something went wrong';
  let error = err.details;

  if (err instanceof ZodError) {
    status = 400; message = 'Validation failed';
    error = err.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
  } else if (err.name === 'ValidationError') {
    status = 400; message = 'Validation failed';
    error = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.name === 'MulterError') {
    status = 400; message = err.code === 'LIMIT_FILE_SIZE' ? `File too large (max ${env.maxUploadMb} MB)` : 'Invalid file upload';
  } else if (err.code === 11000) {
    status = 409; message = `${Object.keys(err.keyValue)[0]} already exists`;
  } else if (err.name === 'CastError') {
    status = 400; message = 'Invalid ID';
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401; message = 'Invalid or expired token';
  }

  if (status >= 500) console.error(err);
  res.status(status).json({
    success: false,
    message,
    error: error ?? (env.nodeEnv === 'development' && status >= 500 ? err.message : undefined),
  });
}
