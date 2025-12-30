import { AppError } from '../src/utils/errors';

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
      expect(error.stack).toBeDefined();
    });

    it('should create an AppError with custom values', () => {
      const error = new AppError('Not found', 404, 'NOT_FOUND', { resource: 'user' });
      
      expect(error.message).toBe('Not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.details).toEqual({ resource: 'user' });
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
      expect(error.stack).toContain('AppError');
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
});
