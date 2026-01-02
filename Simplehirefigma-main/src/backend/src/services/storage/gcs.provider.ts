import { Storage } from '@google-cloud/storage';
import { StorageProvider, UploadResult } from './types';
import { v4 as uuidv4 } from 'uuid';
import config from '../../config';
import { AppError } from '../../utils/errors';

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

export class GCSProvider implements StorageProvider {
  private storage: Storage;
  private bucket: string;

  constructor() {
    this.storage = new Storage({
      projectId: config.gcs?.projectId,
      keyFilename: config.gcs?.keyFile || undefined,
    });
    this.bucket = config.gcs?.bucket || '';
  }

  async upload(file: Express.Multer.File, folder: string): Promise<UploadResult> {
    try {
      const fileExtension = getFileExtension(file.originalname);
      const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

      const bucket = this.storage.bucket(this.bucket);
      const blob = bucket.file(fileName);

      await blob.save(file.buffer, {
        contentType: file.mimetype,
        public: true,
      });

      const url = `https://storage.googleapis.com/${this.bucket}/${fileName}`;

      return { url, key: fileName };
    } catch (error: any) {
      throw new AppError('File upload failed', 500, 'UPLOAD_ERROR', { error: error.message });
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.storage.bucket(this.bucket).file(key).delete();
    } catch (error: any) {
      throw new AppError('File deletion failed', 500, 'DELETE_ERROR', { error: error.message });
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const [url] = await this.storage.bucket(this.bucket).file(key).getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresIn * 1000,
    });
    return url;
  }
}
