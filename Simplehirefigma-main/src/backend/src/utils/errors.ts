/**
 * Custom Application Error Class
 * Handles all application-level errors with proper Error inheritance
 */

// Defensive check: Ensure Error is available before class definition
if (typeof Error === 'undefined') {
  throw new TypeError('CRITICAL: Error constructor is not available in runtime environment');
}

// Store Error reference to avoid lookup issues
const BaseError = Error;

export class AppError extends BaseError {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(
    message: string, 
    statusCode: number = 500, 
    code: string = 'ERROR', 
    details?: any,
    isOperational: boolean = true
  ) {
    // Call parent constructor
    super(message);
    
    // Manually set the name
    this.name = 'AppError';
    
    // Set properties
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    
    // Fix prototype chain explicitly
    // This is critical for instanceof checks to work correctly
    Object.setPrototypeOf(this, AppError.prototype);
    
    // Capture stack trace with multiple fallbacks
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else if (typeof (BaseError as any).captureStackTrace === 'function') {
      (BaseError as any).captureStackTrace(this, this.constructor);
    } else {
      // Manual stack trace creation as last resort
      try {
        throw new Error(message);
      } catch (e: any) {
        this.stack = e.stack;
      }
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      details: this.details,
      isOperational: this.isOperational,
      stack: this.stack,
    };
  }

  toString() {
    return `[${this.code}] ${this.message}`;
  }
}

// Factory functions for common errors
export const createValidationError = (message: string, details?: any) => 
  new AppError(message, 400, 'VALIDATION_ERROR', details);

export const createNotFoundError = (message: string, details?: any) => 
  new AppError(message, 404, 'NOT_FOUND', details);

export const createUnauthorizedError = (message: string = 'Unauthorized', details?: any) => 
  new AppError(message, 401, 'UNAUTHORIZED', details);

export const createForbiddenError = (message: string = 'Forbidden', details?: any) => 
  new AppError(message, 403, 'FORBIDDEN', details);

export const createInternalError = (message: string = 'Internal server error', details?: any) => 
  new AppError(message, 500, 'INTERNAL_ERROR', details);
