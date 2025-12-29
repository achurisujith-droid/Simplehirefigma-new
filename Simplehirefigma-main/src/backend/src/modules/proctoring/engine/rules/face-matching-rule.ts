/**
 * Face Matching Rule
 * Implements face verification against reference image (ID card)
 */

import logger from '../../../../config/logger';
import { faceMatchingService } from '../../services/face-matching.service';
import { BaseRule, RuleContext, RuleViolation } from './base-rule';

/**
 * Face Matching Verification Rule
 * Compares live face capture with reference ID card photo
 * Similarity threshold: 80%
 */
export class FaceMatchingRule extends BaseRule {
  private readonly similarityThreshold: number;

  constructor(enabled: boolean = true, similarityThreshold: number = 80) {
    super('face-matching', 'Face Matching Verification', enabled);
    this.similarityThreshold = similarityThreshold;
  }

  async check(context: RuleContext): Promise<RuleViolation | null> {
    try {
      const { referenceImageBase64, liveImageBase64 } = context;

      // Validate required inputs
      if (!referenceImageBase64 || !liveImageBase64) {
        logger.warn('Face matching rule: missing required images');
        return {
          ruleId: this.id,
          severity: 'high',
          message: 'Missing reference or live image for face verification',
          timestamp: Date.now(),
          data: {
            hasReference: !!referenceImageBase64,
            hasLive: !!liveImageBase64,
          },
        };
      }

      // Compare faces using AWS Rekognition
      const result = await faceMatchingService.compareFaces(
        referenceImageBase64,
        liveImageBase64
      );

      logger.info(
        `Face matching result: match=${result.match}, similarity=${result.similarity.toFixed(2)}%`
      );

      // Check if similarity meets threshold
      if (!result.match || result.similarity < this.similarityThreshold) {
        return {
          ruleId: this.id,
          severity: 'high',
          message: `Face verification failed. Similarity ${result.similarity.toFixed(2)}% is below threshold ${this.similarityThreshold}%`,
          timestamp: Date.now(),
          data: {
            similarity: result.similarity,
            confidence: result.confidence,
            threshold: this.similarityThreshold,
            match: result.match,
          },
        };
      }

      // Face match successful
      logger.info('Face matching verification passed');
      return null;
    } catch (error: any) {
      logger.error('Error in face matching rule:', error);
      return {
        ruleId: this.id,
        severity: 'high',
        message: `Face verification error: ${error.message || 'Unknown error'}`,
        timestamp: Date.now(),
        data: {
          error: error.message,
        },
      };
    }
  }
}
