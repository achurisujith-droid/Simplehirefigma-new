import { StorageProvider, StorageProviderType } from './types';
import { LocalStorageProvider } from './local.provider';
import { GCSProvider } from './gcs.provider';
import { S3Provider } from './s3.provider';
import config from '../../config';
import logger from '../../config/logger';

class StorageService {
  private provider: StorageProvider;
  private providerType: StorageProviderType;

  constructor() {
    const { provider, type } = this.initializeProvider();
    this.provider = provider;
    this.providerType = type;
    logger.info(`Storage provider initialized: ${type}`);
  }

  private initializeProvider(): { provider: StorageProvider; type: StorageProviderType } {
    // Priority 1: Google Cloud Storage
    if (config.gcs?.bucket && config.gcs?.projectId) {
      return { provider: new GCSProvider(), type: 'gcs' };
    }

    // Priority 2: AWS S3 (for backward compatibility)
    if (config.aws?.s3Bucket && config.aws?.accessKeyId && config.aws?.secretAccessKey) {
      return { provider: new S3Provider(), type: 's3' };
    }

    // Priority 3: Local filesystem (always available)
    return { provider: new LocalStorageProvider(), type: 'local' };
  }

  getProviderType(): StorageProviderType {
    return this.providerType;
  }

  async upload(file: Express.Multer.File, folder: string) {
    return this.provider.upload(file, folder);
  }

  async delete(key: string) {
    return this.provider.delete(key);
  }

  async getSignedUrl(key: string, expiresIn?: number) {
    if (this.provider.getSignedUrl) {
      return this.provider.getSignedUrl(key, expiresIn);
    }
    throw new Error('Signed URLs not supported by current storage provider');
  }
}

export const storageService = new StorageService();
