// Custom error class with proper Error inheritance
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode: number = 500, code: string = 'ERROR', details?: any) {
    super(message);
    
    // Restore prototype chain for proper instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
    
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      details: this.details,
      stack: this.stack,
    };
  }

  toString() {
    return `[${this.code}] ${this.message}`;
  }
}
