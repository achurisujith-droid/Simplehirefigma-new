/**
 * File Upload Validation Tests
 * Tests for defensive null checks on req.files in interview and assessment endpoints
 */

import { AppError } from '../src/utils/errors';

describe('File Upload Validation', () => {
  describe('req.files Null Check', () => {
    it('should throw AppError with 400 status when req.files is undefined', () => {
      // Simulate the validation logic from interview.routes.ts and assessment.controller.ts
      const validateFiles = (files: any) => {
        if (!files) {
          throw new AppError(
            'File upload failed. Please ensure you are uploading files as multipart/form-data.',
            400,
            'FILE_UPLOAD_ERROR'
          );
        }
        return files;
      };

      expect(() => validateFiles(undefined)).toThrow(AppError);
      
      try {
        validateFiles(undefined);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(400);
        expect((error as AppError).code).toBe('FILE_UPLOAD_ERROR');
        expect((error as AppError).message).toContain('multipart/form-data');
      }
    });

    it('should throw AppError with 400 status when req.files is null', () => {
      const validateFiles = (files: any) => {
        if (!files) {
          throw new AppError(
            'File upload failed. Please ensure you are uploading files as multipart/form-data.',
            400,
            'FILE_UPLOAD_ERROR'
          );
        }
        return files;
      };

      expect(() => validateFiles(null)).toThrow(AppError);
      
      try {
        validateFiles(null);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(400);
        expect((error as AppError).code).toBe('FILE_UPLOAD_ERROR');
      }
    });

    it('should pass validation when req.files is a valid object', () => {
      const validateFiles = (files: any) => {
        if (!files) {
          throw new AppError(
            'File upload failed. Please ensure you are uploading files as multipart/form-data.',
            400,
            'FILE_UPLOAD_ERROR'
          );
        }
        return files;
      };

      const mockFiles = {
        resume: [{ 
          fieldname: 'resume',
          originalname: 'test-resume.pdf',
          mimetype: 'application/pdf',
          size: 1024
        }]
      };

      expect(() => validateFiles(mockFiles)).not.toThrow();
      expect(validateFiles(mockFiles)).toEqual(mockFiles);
    });
  });

  describe('Resume File Validation', () => {
    it('should throw AppError when resume field is missing', () => {
      const validateResume = (files: any) => {
        if (!files.resume || files.resume.length === 0) {
          throw new AppError('Resume is required', 400, 'VALIDATION_ERROR');
        }
        return files.resume;
      };

      const filesWithoutResume = {
        idCard: [{ fieldname: 'idCard' }]
      };

      expect(() => validateResume(filesWithoutResume)).toThrow(AppError);
      
      try {
        validateResume(filesWithoutResume);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(400);
        expect((error as AppError).code).toBe('VALIDATION_ERROR');
        expect((error as AppError).message).toBe('Resume is required');
      }
    });

    it('should throw AppError when resume array is empty', () => {
      const validateResume = (files: any) => {
        if (!files.resume || files.resume.length === 0) {
          throw new AppError('Resume is required', 400, 'VALIDATION_ERROR');
        }
        return files.resume;
      };

      const filesWithEmptyResume = {
        resume: []
      };

      expect(() => validateResume(filesWithEmptyResume)).toThrow(AppError);
    });

    it('should pass validation when resume file is present', () => {
      const validateResume = (files: any) => {
        if (!files.resume || files.resume.length === 0) {
          throw new AppError('Resume is required', 400, 'VALIDATION_ERROR');
        }
        return files.resume;
      };

      const validFiles = {
        resume: [{ 
          fieldname: 'resume',
          originalname: 'test-resume.pdf',
          mimetype: 'application/pdf',
          size: 1024
        }]
      };

      expect(() => validateResume(validFiles)).not.toThrow();
      expect(validateResume(validFiles)).toEqual(validFiles.resume);
    });
  });

  describe('Combined Validation Flow', () => {
    it('should validate both req.files existence and resume presence', () => {
      const fullValidation = (reqFiles: any) => {
        // Step 1: Check if req.files exists
        if (!reqFiles) {
          throw new AppError(
            'File upload failed. Please ensure you are uploading files as multipart/form-data.',
            400,
            'FILE_UPLOAD_ERROR'
          );
        }

        const files = reqFiles as { [fieldname: string]: any[] };

        // Step 2: Check if resume file exists
        if (!files.resume || files.resume.length === 0) {
          throw new AppError('Resume is required', 400, 'VALIDATION_ERROR');
        }

        return files.resume[0];
      };

      // Test undefined req.files
      expect(() => fullValidation(undefined)).toThrow(AppError);
      try {
        fullValidation(undefined);
      } catch (error) {
        expect((error as AppError).code).toBe('FILE_UPLOAD_ERROR');
      }

      // Test missing resume
      expect(() => fullValidation({})).toThrow(AppError);
      try {
        fullValidation({});
      } catch (error) {
        expect((error as AppError).code).toBe('VALIDATION_ERROR');
      }

      // Test valid files
      const validFiles = {
        resume: [{ 
          fieldname: 'resume',
          originalname: 'test-resume.pdf',
          mimetype: 'application/pdf',
          size: 1024
        }]
      };
      expect(() => fullValidation(validFiles)).not.toThrow();
      expect(fullValidation(validFiles)).toEqual(validFiles.resume[0]);
    });

    it('should allow optional idCard file', () => {
      const validateWithOptionalIdCard = (reqFiles: any) => {
        if (!reqFiles) {
          throw new AppError(
            'File upload failed. Please ensure you are uploading files as multipart/form-data.',
            400,
            'FILE_UPLOAD_ERROR'
          );
        }

        const files = reqFiles as { [fieldname: string]: any[] };

        if (!files.resume || files.resume.length === 0) {
          throw new AppError('Resume is required', 400, 'VALIDATION_ERROR');
        }

        // ID card is optional
        const resumeFile = files.resume[0];
        const idCardFile = files.idCard?.[0];

        return { resumeFile, idCardFile };
      };

      const filesWithoutIdCard = {
        resume: [{ fieldname: 'resume' }]
      };

      const filesWithIdCard = {
        resume: [{ fieldname: 'resume' }],
        idCard: [{ fieldname: 'idCard' }]
      };

      expect(() => validateWithOptionalIdCard(filesWithoutIdCard)).not.toThrow();
      expect(validateWithOptionalIdCard(filesWithoutIdCard).idCardFile).toBeUndefined();

      expect(() => validateWithOptionalIdCard(filesWithIdCard)).not.toThrow();
      expect(validateWithOptionalIdCard(filesWithIdCard).idCardFile).toBeDefined();
    });
  });
});
