import { Response } from 'express';
import logger from '../utils/logger';
import { ResponseHelper } from '../utils/response.helper';
import { asyncHandler } from '../middleware/error.middleware';

export abstract class BaseController {
  protected responseHelper = ResponseHelper;
  protected logger = logger;

  /**
   * Wrapper for async controller methods to handle errors
   */
  protected asyncHandler = asyncHandler;

  /**
   * Log controller action
   */
  protected logAction(action: string, details?: Record<string, any>) {
    this.logger.info(`Controller action: ${action}`, details);
  }

  /**
   * Log controller error
   */
  protected logError(action: string, error: Error, details?: Record<string, any>) {
    this.logger.error(`Controller error in ${action}:`, {
      error: error.message,
      stack: error.stack,
      ...details
    });
  }

  /**
   * Handle controller errors consistently
   */
  protected handleError(res: Response, error: Error, action: string) {
    this.logError(action, error);
    
    if (error.name === 'ValidationError') {
      return this.responseHelper.badRequest(res, error.message);
    }
    
    if (error.name === 'CastError') {
      return this.responseHelper.badRequest(res, 'Invalid ID format');
    }
    
    if (error.name === 'MongoError' && (error as any).code === 11000) {
      return this.responseHelper.badRequest(res, 'Duplicate entry found');
    }
    
    return this.responseHelper.error(res, 'An unexpected error occurred');
  }

  /**
   * Validate required fields
   */
  protected validateRequired(data: any, requiredFields: string[]): string[] {
    const missingFields: string[] = [];
    
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        missingFields.push(field);
      }
    }
    
    return missingFields;
  }

  /**
   * Sanitize data by removing undefined/null values
   */
  protected sanitizeData(data: any): any {
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null && value !== '') {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * Create pagination object
   */
  protected createPagination(page: number, limit: number, total: number) {
    return {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    };
  }

  /**
   * Parse query parameters for pagination and sorting
   */
  protected parseQueryParams(query: any) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '10', 10)));
    const sort = query.sort || 'createdAt';
    const order = query.order === 'asc' ? 1 : -1;
    const search = query.search?.trim();
    
    return { page, limit, sort, order, search };
  }
}
