import { storageService } from '../services/storage';
import { UploadResult } from '../services/storage/types';

// Re-export for backward compatibility
export const uploadFile = async (
  file: Express.Multer.File,
  folder: string
): Promise<UploadResult> => {
  return storageService.upload(file, folder);
};

export const deleteFile = async (key: string): Promise<void> => {
  return storageService.delete(key);
};

export const validateFileType = (file: Express.Multer.File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.mimetype);
};

export const validateFileSize = (file: Express.Multer.File, maxSize: number): boolean => {
  return file.size <= maxSize;
};

// Export storage service for direct access if needed
export { storageService };
