import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
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

export class S3Provider implements StorageProvider {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      },
      ...(config.aws.endpoint && { endpoint: config.aws.endpoint, forcePathStyle: true }),
    });
  }

  async upload(file: Express.Multer.File, folder: string): Promise<UploadResult> {
    try {
      const fileExtension = getFileExtension(file.originalname);
      const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: config.aws.s3Bucket,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'public-read',
        },
      });

      await upload.done();

      const url = config.aws.endpoint
        ? `${config.aws.endpoint}/${config.aws.s3Bucket}/${fileName}`
        : `https://${config.aws.s3Bucket}.s3.${config.aws.region}.amazonaws.com/${fileName}`;

      return { url, key: fileName };
    } catch (error: any) {
      throw new AppError('File upload failed', 500, 'UPLOAD_ERROR', { error: error.message });
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: config.aws.s3Bucket,
          Key: key,
        })
      );
    } catch (error: any) {
      throw new AppError('File deletion failed', 500, 'DELETE_ERROR', { error: error.message });
    }
  }
}
