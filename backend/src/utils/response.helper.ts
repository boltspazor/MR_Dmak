import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  meta?: Record<string, any>;
}

export class ResponseHelper {
  static success<T>(
    res: Response,
    data?: T,
    message: string = 'Success',
    statusCode: number = 200,
    meta?: Record<string, any>
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      ...(data !== undefined && { data }),
      ...(meta && { meta })
    };

    return res.status(statusCode).json(response);
  }

  static created<T>(
    res: Response,
    data?: T,
    message: string = 'Resource created successfully'
  ): Response {
    return this.success(res, data, message, 201);
  }

  static error(
    res: Response,
    message: string = 'Internal server error',
    statusCode: number = 500,
    meta?: Record<string, any>
  ): Response {
    const response: ApiResponse = {
      success: false,
      message,
      ...(meta && { meta })
    };

    return res.status(statusCode).json(response);
  }

  static notFound(
    res: Response,
    message: string = 'Resource not found'
  ): Response {
    return this.error(res, message, 404);
  }

  static unauthorized(
    res: Response,
    message: string = 'Unauthorized access'
  ): Response {
    return this.error(res, message, 401);
  }

  static forbidden(
    res: Response,
    message: string = 'Access forbidden'
  ): Response {
    return this.error(res, message, 403);
  }

  static badRequest(
    res: Response,
    message: string = 'Bad request',
    meta?: Record<string, any>
  ): Response {
    return this.error(res, message, 400, meta);
  }

  static paginated<T>(
    res: Response,
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
    },
    message: string = 'Success'
  ): Response {
    const pages = Math.ceil(pagination.total / pagination.limit);
    
    const response: ApiResponse<T[]> = {
      success: true,
      message,
      data,
      pagination: {
        ...pagination,
        pages
      }
    };

    return res.status(200).json(response);
  }
}
