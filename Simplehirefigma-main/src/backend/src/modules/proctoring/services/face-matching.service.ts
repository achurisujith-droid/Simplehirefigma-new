/**
 * Face Matching Service
 * AWS Rekognition integration for face comparison
 */

import AWS from 'aws-sdk';
import config from '../../../config';
import logger from '../../../config/logger';

// Initialize AWS Rekognition
const rekognition = new AWS.Rekognition({
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
  region: config.aws.region,
});

export interface FaceMatchResult {
  match: boolean;
  similarity: number;
  confidence: number;
}

/**
 * Compare two faces using AWS Rekognition
 * @param referenceImageBase64 Base64 encoded reference image (ID card)
 * @param liveImageBase64 Base64 encoded live image (selfie/camera capture)
 * @returns Face match result with similarity score
 */
export async function compareFaces(
  referenceImageBase64: string,
  liveImageBase64: string
): Promise<FaceMatchResult> {
  try {
    // Remove data URL prefix if present
    const cleanReference = referenceImageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    const cleanLive = liveImageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    // Convert base64 to buffer
    const referenceBuffer = Buffer.from(cleanReference, 'base64');
    const liveBuffer = Buffer.from(cleanLive, 'base64');

    logger.info('Comparing faces with AWS Rekognition');

    // Call AWS Rekognition CompareFaces API
    const result = await rekognition
      .compareFaces({
        SourceImage: {
          Bytes: referenceBuffer,
        },
        TargetImage: {
          Bytes: liveBuffer,
        },
        SimilarityThreshold: 70, // Minimum similarity threshold
      })
      .promise();

    // Check if faces match
    if (!result.FaceMatches || result.FaceMatches.length === 0) {
      logger.warn('No face matches found');
      return {
        match: false,
        similarity: 0,
        confidence: 0,
      };
    }

    // Get the best match
    const bestMatch = result.FaceMatches[0];
    const similarity = bestMatch.Similarity || 0;
    const confidence = bestMatch.Face?.Confidence || 0;

    logger.info(`Face match result: similarity=${similarity.toFixed(2)}%, confidence=${confidence.toFixed(2)}%`);

    return {
      match: similarity >= 80, // 80% threshold for match
      similarity,
      confidence,
    };
  } catch (error: any) {
    logger.error('Error comparing faces:', error);

    // Handle specific AWS errors
    if (error.code === 'InvalidImageFormatException') {
      throw new Error('Invalid image format. Please provide a valid JPEG or PNG image.');
    } else if (error.code === 'InvalidParameterException') {
      throw new Error('Invalid image. Please ensure the image contains a face.');
    }

    throw error;
  }
}

export const faceMatchingService = {
  compareFaces,
};
