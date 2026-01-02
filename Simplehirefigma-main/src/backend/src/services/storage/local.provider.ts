import { StorageProvider, UploadResult } from './types';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import config from '../../config';

/**
 * Safely extract file extension from filename
 * Returns 'bin' as default if no extension is found
 */
function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length === 1 || (parts[0] === '' && parts.length === 2)) {
    // No extension or hidden file with no extension
    return 'bin';
  }
  return parts.pop() || 'bin';
}

export class LocalStorageProvider implements StorageProvider {
  private uploadsDir: string;
  private baseUrl: string;

  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    this.baseUrl = config.appUrl || 'http://localhost:3000';
  }

  async upload(file: Express.Multer.File, folder: string): Promise<UploadResult> {
    const folderPath = path.join(this.uploadsDir, folder);
    await fs.mkdir(folderPath, { recursive: true });

    const fileExtension = getFileExtension(file.originalname);
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = path.join(folderPath, fileName);

    await fs.writeFile(filePath, file.buffer);

    const key = `${folder}/${fileName}`;
    const url = `${this.baseUrl}/uploads/${key}`;

    return { url, key };
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.uploadsDir, key);
    try {
      await fs.unlink(filePath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
}
