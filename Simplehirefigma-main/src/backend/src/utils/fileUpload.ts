import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';
import { AppError } from './errors';

// Configure AWS S3 Client
const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
  ...(config.aws.endpoint && { endpoint: config.aws.endpoint, forcePathStyle: true }),
});

interface UploadResult {
  url: string;
  key: string;
}

export const uploadFile = async (
  file: Express.Multer.File,
  folder: string
): Promise<UploadResult> => {
  try {
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: config.aws.s3Bucket,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
      },
    });

    const result = await upload.done();

    // Construct URL based on endpoint configuration
    const url = config.aws.endpoint
      ? `${config.aws.endpoint}/${config.aws.s3Bucket}/${fileName}`
      : `https://${config.aws.s3Bucket}.s3.${config.aws.region}.amazonaws.com/${fileName}`;

    return {
      url,
      key: fileName,
    };
  } catch (error: any) {
    throw new AppError('File upload failed', 500, 'UPLOAD_ERROR', { error: error.message });
  }
};

export const deleteFile = async (key: string): Promise<void> => {
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: config.aws.s3Bucket,
        Key: key,
      })
    );
  } catch (error: any) {
    throw new AppError('File deletion failed', 500, 'DELETE_ERROR', { error: error.message });
  }
};

export const validateFileType = (file: Express.Multer.File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.mimetype);
};

export const validateFileSize = (file: Express.Multer.File, maxSize: number): boolean => {
  return file.size <= maxSize;
};
