// Custom error class with bulletproof Error inheritance
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode: number = 500, code: string = 'ERROR', details?: any) {
    // Ensure Error is available
    if (typeof Error === 'undefined') {
      throw new TypeError('Error constructor is not available');
    }
    
    super(message);
    
    // Set the name explicitly
    this.name = this.constructor.name || 'AppError';
    
    // Restore prototype chain for proper instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
    
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    
    // Capture stack trace with fallback
    if (typeof (Error as any).captureStackTrace === 'function') {
      (Error as any).captureStackTrace(this, this.constructor);
    } else {
      this.stack = (new Error(message)).stack;
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
