/**
 * Centralized error handling types and classes
 */

export enum ErrorCode {
  // API Errors (1000-1999)
  API_GENERIC = 1000,
  API_RATE_LIMIT = 1001,
  API_UNAUTHORIZED = 1002,
  API_FORBIDDEN = 1003,
  API_NOT_FOUND = 1004,
  API_TIMEOUT = 1005,
  API_NETWORK = 1006,

  // iNaturalist Errors (2000-2999)
  INAT_GENERIC = 2000,
  INAT_AUTH_FAILED = 2001,
  INAT_RATE_LIMIT = 2002,
  INAT_INVALID_RESPONSE = 2003,

  // Database Errors (3000-3999)
  DB_GENERIC = 3000,
  DB_CONNECTION = 3001,
  DB_QUERY = 3002,
  DB_CONSTRAINT = 3003,

  // Validation Errors (4000-4999)
  VALIDATION_GENERIC = 4000,
  VALIDATION_REQUIRED = 4001,
  VALIDATION_FORMAT = 4002,

  // Business Logic Errors (5000-5999)
  BUSINESS_GENERIC = 5000,
  SYNC_FAILED = 5001,
  GAMIFICATION_ERROR = 5002,

  // Unknown/Generic (9000+)
  UNKNOWN = 9000,
}

export interface ErrorContext {
  userId?: string;
  endpoint?: string;
  statusCode?: number;
  [key: string]: any;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: ErrorContext;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: ErrorContext
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);

    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    this.timestamp = new Date();

    Error.captureStackTrace(this);
  }
}

// Specific error classes for common scenarios

export class APIError extends AppError {
  constructor(message: string, statusCode: number = 500, context?: ErrorContext) {
    super(message, ErrorCode.API_GENERIC, statusCode, true, context);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', context?: ErrorContext) {
    super(message, ErrorCode.API_RATE_LIMIT, 429, true, context);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', context?: ErrorContext) {
    super(message, ErrorCode.API_UNAUTHORIZED, 401, true, context);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', context?: ErrorContext) {
    super(message, ErrorCode.API_NOT_FOUND, 404, true, context);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, ErrorCode.VALIDATION_GENERIC, 400, true, context);
  }
}

export class INatError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.INAT_GENERIC, context?: ErrorContext) {
    super(message, code, 500, true, context);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, ErrorCode.DB_GENERIC, 500, true, context);
  }
}

export class SyncError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, ErrorCode.SYNC_FAILED, 500, true, context);
  }
}
