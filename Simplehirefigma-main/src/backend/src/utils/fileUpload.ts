import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';
import { AppError } from './errors';

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
  region: config.aws.region,
  ...(config.aws.endpoint && { endpoint: config.aws.endpoint, s3ForcePathStyle: true }),
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

    const params: AWS.S3.PutObjectRequest = {
      Bucket: config.aws.s3Bucket,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    };

    const result = await s3.upload(params).promise();

    return {
      url: result.Location,
      key: result.Key,
    };
  } catch (error: any) {
    throw new AppError('File upload failed', 500, 'UPLOAD_ERROR', { error: error.message });
  }
};

export const deleteFile = async (key: string): Promise<void> => {
  try {
    const params: AWS.S3.DeleteObjectRequest = {
      Bucket: config.aws.s3Bucket,
      Key: key,
    };

    await s3.deleteObject(params).promise();
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
