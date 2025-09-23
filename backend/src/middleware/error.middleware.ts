import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { statusCode = 500, message, stack } = err;

  // Log error details
  logger.error('Error occurred:', {
    error: message,
    stack,
    url: req.url,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Handle specific error types
  if ((err as any).type === 'entity.too.large') {
    res.status(413).json({ 
      success: false,
      error: 'File too large',
      message: 'The uploaded file exceeds the maximum allowed size'
    });
  }

  if ((err as any).code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({ 
      success: false,
      error: 'File size exceeds limit',
      message: 'The uploaded file is too large'
    });
  }

  if ((err as any).code === 'LIMIT_UNEXPECTED_FILE') {
    res.status(400).json({ 
      success: false,
      error: 'Unexpected file field',
      message: 'Invalid file upload field'
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
      message: 'Authentication token is invalid'
    });
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: 'Token expired',
      message: 'Authentication token has expired'
    });
  }

  // Database errors
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      error: 'Invalid ID',
      message: 'The provided ID is not valid'
    });
  }

  // Default error response
  const errorResponse = {
    success: false,
    error: statusCode >= 500 ? 'Internal Server Error' : message,
    message: process.env.NODE_ENV === 'production' && statusCode >= 500 
      ? 'Something went wrong' 
      : message,
    ...(process.env.NODE_ENV === 'development' && { stack })
  };

  res.status(statusCode).json(errorResponse);
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: {
      api: '/api',
      health: '/api/health',
      webhook: '/api/webhook',
      webhookStatus: '/api/webhook/status'
    }
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
