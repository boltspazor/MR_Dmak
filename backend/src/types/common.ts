import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

// Extended Request interface with user authentication
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload & {
    userId: string;
    email: string;
    role: string;
  };
}

// Common pagination interface
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// Common search interface
export interface SearchQuery extends PaginationQuery {
  search?: string;
  filter?: Record<string, any>;
}

// Database document interface
export interface BaseDocument {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

// API response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: PaginationMeta;
  meta?: Record<string, any>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// Error interfaces
export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// File upload interfaces
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}

// Environment configuration
export interface AppConfig {
  port: number;
  nodeEnv: string;
  database: {
    uri: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  whatsapp: {
    accessToken: string;
    phoneNumberId: string;
    verifyToken: string;
    apiUrl: string;
  };
  cors: {
    origins: string[];
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
}
