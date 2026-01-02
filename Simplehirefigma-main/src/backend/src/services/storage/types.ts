export interface UploadResult {
  url: string;
  key: string;
}

export interface StorageProvider {
  upload(file: Express.Multer.File, folder: string): Promise<UploadResult>;
  delete(key: string): Promise<void>;
  getSignedUrl?(key: string, expiresIn?: number): Promise<string>;
}

export type StorageProviderType = 'local' | 'gcs' | 's3';
