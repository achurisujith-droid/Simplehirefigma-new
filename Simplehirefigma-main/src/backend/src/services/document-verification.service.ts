/**
 * Document Verification Service
 * Integrates with AWS Textract for ID extraction and Rekognition for face comparison
 */

import AWS from 'aws-sdk';
import config from '../config';
import logger from '../config/logger';
import { AppError } from '../utils/errors';

// Configure AWS services
const textract = new AWS.Textract({
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
  region: config.aws.region,
});

const rekognition = new AWS.Rekognition({
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
  region: config.aws.region,
});

const s3 = new AWS.S3({
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
  region: config.aws.region,
});

interface ExtractedIDData {
  documentType: string;
  fullName?: string;
  documentNumber?: string;
  dateOfBirth?: string;
  expirationDate?: string;
  address?: string;
  issueDate?: string;
  confidence: number;
  rawFields: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
}

interface FaceComparisonResult {
  match: boolean;
  similarity: number;
  confidence: number;
  faces: {
    idFace: any;
    selfieFace: any;
  };
}

export class DocumentVerificationService {
  /**
   * Extract data from ID document using AWS Textract
   */
  async extractIDData(s3Key: string): Promise<ExtractedIDData> {
    try {
      logger.info('Extracting ID data from document:', s3Key);

      const params: AWS.Textract.AnalyzeIDRequest = {
        DocumentPages: [
          {
            S3Object: {
              Bucket: config.aws.s3Bucket,
              Name: s3Key,
            },
          },
        ],
      };

      const result = await textract.analyzeID(params).promise();

      if (!result.IdentityDocuments || result.IdentityDocuments.length === 0) {
        throw new AppError('No identity document found in image', 400, 'NO_DOCUMENT_FOUND');
      }

      const document = result.IdentityDocuments[0];
      const fields = document.IdentityDocumentFields || [];

      // Extract key fields
      const extractedData: ExtractedIDData = {
        documentType: this.getFieldValue(fields, 'DOCUMENT_TYPE') || 'unknown',
        fullName: this.getFieldValue(fields, 'FULL_NAME'),
        documentNumber: this.getFieldValue(fields, 'DOCUMENT_NUMBER'),
        dateOfBirth: this.getFieldValue(fields, 'DATE_OF_BIRTH'),
        expirationDate: this.getFieldValue(fields, 'EXPIRATION_DATE'),
        address: this.getFieldValue(fields, 'ADDRESS'),
        issueDate: this.getFieldValue(fields, 'ISSUE_DATE'),
        confidence: this.calculateAverageConfidence(fields),
        rawFields: fields.map((field: any) => ({
          type: field.Type?.Text || 'unknown',
          value: field.ValueDetection?.Text || '',
          confidence: field.ValueDetection?.Confidence || 0,
        })),
      };

      logger.info('ID data extracted successfully:', {
        documentType: extractedData.documentType,
        confidence: extractedData.confidence,
      });

      return extractedData;
    } catch (error: any) {
      logger.error('Error extracting ID data:', error);
      
      if (error.code === 'InvalidParameterException') {
        throw new AppError('Invalid document format', 400, 'INVALID_DOCUMENT');
      }
      
      if (error.code === 'ProvisionedThroughputExceededException') {
        throw new AppError('Service busy, please try again', 503, 'SERVICE_BUSY');
      }

      throw new AppError(
        'Failed to extract ID data',
        500,
        'EXTRACTION_ERROR',
        { error: error.message }
      );
    }
  }

  /**
   * Compare face in ID document with selfie using AWS Rekognition
   */
  async compareFaces(idS3Key: string, selfieS3Key: string): Promise<FaceComparisonResult> {
    try {
      logger.info('Comparing faces:', { idS3Key, selfieS3Key });

      const params: AWS.Rekognition.CompareFacesRequest = {
        SourceImage: {
          S3Object: {
            Bucket: config.aws.s3Bucket,
            Name: selfieS3Key,
          },
        },
        TargetImage: {
          S3Object: {
            Bucket: config.aws.s3Bucket,
            Name: idS3Key,
          },
        },
        SimilarityThreshold: 80, // Minimum 80% similarity
      };

      const result = await rekognition.compareFaces(params).promise();

      if (!result.FaceMatches || result.FaceMatches.length === 0) {
        logger.warn('No matching faces found');
        return {
          match: false,
          similarity: 0,
          confidence: 0,
          faces: {
            idFace: result.TargetImageOrientationCorrection,
            selfieFace: result.SourceImageOrientationCorrection,
          },
        };
      }

      const bestMatch = result.FaceMatches[0];
      const similarity = bestMatch.Similarity || 0;
      const confidence = bestMatch.Face?.Confidence || 0;

      logger.info('Face comparison complete:', {
        similarity,
        confidence,
        match: similarity >= 80,
      });

      return {
        match: similarity >= 80,
        similarity,
        confidence,
        faces: {
          idFace: bestMatch.Face,
          selfieFace: result.SourceImageFace,
        },
      };
    } catch (error: any) {
      logger.error('Error comparing faces:', error);

      if (error.code === 'InvalidParameterException') {
        throw new AppError('Invalid image format or no face detected', 400, 'INVALID_IMAGE');
      }

      throw new AppError(
        'Failed to compare faces',
        500,
        'COMPARISON_ERROR',
        { error: error.message }
      );
    }
  }

  /**
   * Detect faces in an image
   */
  async detectFaces(s3Key: string): Promise<any> {
    try {
      const params: AWS.Rekognition.DetectFacesRequest = {
        Image: {
          S3Object: {
            Bucket: config.aws.s3Bucket,
            Name: s3Key,
          },
        },
        Attributes: ['ALL'],
      };

      const result = await rekognition.detectFaces(params).promise();

      if (!result.FaceDetails || result.FaceDetails.length === 0) {
        throw new AppError('No face detected in image', 400, 'NO_FACE_DETECTED');
      }

      return result.FaceDetails[0];
    } catch (error: any) {
      logger.error('Error detecting faces:', error);
      throw error;
    }
  }

  /**
   * Verify document authenticity (check for tampering, quality, etc.)
   */
  async verifyDocumentQuality(s3Key: string): Promise<{
    isGoodQuality: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    try {
      // Detect text to check image quality
      const params: AWS.Textract.DetectDocumentTextRequest = {
        Document: {
          S3Object: {
            Bucket: config.aws.s3Bucket,
            Name: s3Key,
          },
        },
      };

      const result = await textract.detectDocumentText(params).promise();
      const blocks = result.Blocks || [];

      const issues: string[] = [];
      const recommendations: string[] = [];

      // Check for sufficient text detected
      const textBlocks = blocks.filter((b) => b.BlockType === 'LINE');
      if (textBlocks.length < 5) {
        issues.push('Insufficient text detected');
        recommendations.push('Ensure document is clearly visible and well-lit');
      }

      // Check confidence levels
      const avgConfidence =
        textBlocks.reduce((sum, b) => sum + (b.Confidence || 0), 0) / textBlocks.length;

      if (avgConfidence < 70) {
        issues.push('Low text clarity');
        recommendations.push('Take a clearer photo with better lighting');
      }

      return {
        isGoodQuality: issues.length === 0,
        issues,
        recommendations,
      };
    } catch (error: any) {
      logger.error('Error verifying document quality:', error);
      return {
        isGoodQuality: false,
        issues: ['Unable to verify document quality'],
        recommendations: ['Please upload a clearer image'],
      };
    }
  }

  /**
   * Helper: Get field value from Textract results
   */
  private getFieldValue(fields: any[], fieldType: string): string | undefined {
    const field = fields.find((f: any) => f.Type?.Text === fieldType);
    return field?.ValueDetection?.Text;
  }

  /**
   * Helper: Calculate average confidence from fields
   */
  private calculateAverageConfidence(fields: any[]): number {
    if (fields.length === 0) return 0;
    const sum = fields.reduce((acc: number, field: any) => {
      return acc + (field.ValueDetection?.Confidence || 0);
    }, 0);
    return Math.round(sum / fields.length);
  }

  /**
   * Full verification workflow
   */
  async performFullVerification(
    idS3Key: string,
    selfieS3Key: string
  ): Promise<{
    success: boolean;
    idData: ExtractedIDData;
    faceMatch: FaceComparisonResult;
    documentQuality: any;
    overallScore: number;
    issues: string[];
  }> {
    try {
      // Step 1: Check document quality
      const documentQuality = await this.verifyDocumentQuality(idS3Key);

      // Step 2: Extract ID data
      const idData = await this.extractIDData(idS3Key);

      // Step 3: Compare faces
      const faceMatch = await this.compareFaces(idS3Key, selfieS3Key);

      // Calculate overall score
      const qualityScore = documentQuality.isGoodQuality ? 30 : 10;
      const extractionScore = idData.confidence * 0.4; // 0-40 points
      const faceScore = faceMatch.match ? 30 : 0;
      const overallScore = Math.round(qualityScore + extractionScore + faceScore);

      const issues: string[] = [
        ...documentQuality.issues,
        ...(idData.confidence < 70 ? ['Low confidence in extracted data'] : []),
        ...(!faceMatch.match ? ['Face verification failed'] : []),
      ];

      return {
        success: overallScore >= 70 && faceMatch.match,
        idData,
        faceMatch,
        documentQuality,
        overallScore,
        issues,
      };
    } catch (error: any) {
      logger.error('Error in full verification:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const documentVerificationService = new DocumentVerificationService();
