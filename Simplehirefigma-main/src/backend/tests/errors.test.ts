import { 
  AppError, 
  createValidationError,
  createNotFoundError,
  createUnauthorizedError,
  createForbiddenError,
  createInternalError
} from '../src/utils/errors';

describe('AppError Class', () => {
  describe('Basic Instantiation', () => {
    it('should create an AppError with default values', () => {
      const error = new AppError('Test error');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('ERROR');
      expect(error.name).toBe('AppError');
      expect(error.isOperational).toBe(true);
      expect(error.stack).toBeDefined();
    });

    it('should create an AppError with custom values', () => {
      const error = new AppError('Not found', 404, 'NOT_FOUND', { resource: 'user' }, false);
      
      expect(error.message).toBe('Not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.details).toEqual({ resource: 'user' });
      expect(error.isOperational).toBe(false);
    });
  });

  describe('Error Inheritance', () => {
    it('should properly extend Error class', () => {
      const error = new AppError('Test error');
      
      expect(error instanceof Error).toBe(true);
      expect(error instanceof AppError).toBe(true);
    });

    it('should have proper prototype chain', () => {
      const error = new AppError('Test error');
      
      expect(Object.getPrototypeOf(error)).toBe(AppError.prototype);
      expect(Object.getPrototypeOf(AppError.prototype)).toBe(Error.prototype);
    });
  });

  describe('Stack Trace', () => {
    it('should capture stack trace', () => {
      const error = new AppError('Test error');
      
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('Test error');
    });
  });

  describe('JSON Serialization', () => {
    it('should serialize to JSON correctly', () => {
      const error = new AppError('Test error', 400, 'BAD_REQUEST', { field: 'email' });
      const json = error.toJSON();
      
      expect(json.name).toBe('AppError');
      expect(json.message).toBe('Test error');
      expect(json.statusCode).toBe(400);
      expect(json.code).toBe('BAD_REQUEST');
      expect(json.details).toEqual({ field: 'email' });
      expect(json.isOperational).toBe(true);
      expect(json.stack).toBeDefined();
    });
  });

  describe('String Representation', () => {
    it('should convert to string correctly', () => {
      const error = new AppError('Test error', 400, 'BAD_REQUEST');
      const str = error.toString();
      
      expect(str).toBe('[BAD_REQUEST] Test error');
    });
  });

  describe('Error Constructor Availability', () => {
    it('should verify Error constructor is available', () => {
      // This test ensures the Error constructor check doesn't throw
      expect(() => {
        new AppError('Test error');
      }).not.toThrow(TypeError);
    });
  });

  describe('Constructor Name', () => {
    it('should use constructor name for the name property', () => {
      const error = new AppError('Test error');
      expect(error.name).toBe('AppError');
      expect(error.constructor.name).toBe('AppError');
    });
  });

  describe('Factory Functions', () => {
    it('should create validation error with factory function', () => {
      const error = createValidationError('Invalid input', { field: 'email' });
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Invalid input');
      expect(error.details).toEqual({ field: 'email' });
    });

    it('should create not found error with factory function', () => {
      const error = createNotFoundError('Resource not found');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('Resource not found');
    });

    it('should create unauthorized error with factory function', () => {
      const error = createUnauthorizedError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.message).toBe('Unauthorized');
    });

    it('should create forbidden error with factory function', () => {
      const error = createForbiddenError('Access denied');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
      expect(error.message).toBe('Access denied');
    });

    it('should create internal error with factory function', () => {
      const error = createInternalError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.message).toBe('Internal server error');
    });
  });
});
