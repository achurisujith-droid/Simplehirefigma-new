// Custom error class that doesn't extend Error to avoid class inheritance issues
export class AppError {
  public statusCode: number;
  public code: string;
  public details?: any;
  public message: string;
  public name: string = 'AppError';
    public stack?: string;

  constructor(message: string, statusCode: number = 500, code: string = 'ERROR', details?: any) {
    this.message = message;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
        this.stack = new Error().stack;
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
