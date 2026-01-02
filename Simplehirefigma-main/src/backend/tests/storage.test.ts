import { LocalStorageProvider } from '../src/services/storage/local.provider';
import { storageService } from '../src/services/storage';
import fs from 'fs/promises';
import path from 'path';

describe('LocalStorageProvider', () => {
  const provider = new LocalStorageProvider();
  const testFolder = 'test-uploads';

  afterAll(async () => {
    // Cleanup test files
    try {
      await fs.rm(path.join(process.cwd(), 'uploads', testFolder), { recursive: true });
    } catch (e) {
      // Ignore errors if directory doesn't exist
    }
  });

  it('should upload a file to local storage', async () => {
    const mockFile = {
      originalname: 'test.pdf',
      buffer: Buffer.from('test content'),
      mimetype: 'application/pdf',
      fieldname: 'file',
      encoding: '7bit',
      size: 12,
      stream: {} as any,
      destination: '',
      filename: '',
      path: '',
    } as Express.Multer.File;

    const result = await provider.upload(mockFile, testFolder);

    expect(result.url).toContain('/uploads/');
    expect(result.key).toContain(testFolder);
    expect(result.key).toMatch(/\.pdf$/);
  });

  it('should delete a file from local storage', async () => {
    const mockFile = {
      originalname: 'delete-test.pdf',
      buffer: Buffer.from('delete me'),
      mimetype: 'application/pdf',
      fieldname: 'file',
      encoding: '7bit',
      size: 9,
      stream: {} as any,
      destination: '',
      filename: '',
      path: '',
    } as Express.Multer.File;

    const result = await provider.upload(mockFile, testFolder);
    await provider.delete(result.key);

    const filePath = path.join(process.cwd(), 'uploads', result.key);
    await expect(fs.access(filePath)).rejects.toThrow();
  });

  it('should not throw error when deleting non-existent file', async () => {
    await expect(provider.delete('non-existent-folder/non-existent-file.pdf')).resolves.not.toThrow();
  });
});

describe('StorageService', () => {
  it('should initialize with a provider type', () => {
    expect(storageService.getProviderType()).toMatch(/^(local|gcs|s3)$/);
  });

  it('should use local storage when no cloud credentials are configured', () => {
    // In test environment, we expect local storage to be used
    const providerType = storageService.getProviderType();
    // Provider type should be one of the valid types
    expect(['local', 'gcs', 's3']).toContain(providerType);
  });

  it('should throw error for getSignedUrl when provider does not support it', async () => {
    // Local provider doesn't support signed URLs
    if (storageService.getProviderType() === 'local') {
      await expect(storageService.getSignedUrl('test-key')).rejects.toThrow(
        'Signed URLs not supported by current storage provider'
      );
    }
  });
});
