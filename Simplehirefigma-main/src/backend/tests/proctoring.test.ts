/**
 * Proctoring Engine Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ProctoringEngine } from '../src/modules/proctoring/engine/proctoring-engine';
import { FaceMatchingRule } from '../src/modules/proctoring/engine/rules/face-matching-rule';
import { RuleContext } from '../src/modules/proctoring/engine/rules/base-rule';

// Mock face matching service
jest.mock('../src/modules/proctoring/services/face-matching.service', () => ({
  faceMatchingService: {
    compareFaces: jest.fn(),
  },
}));

import { faceMatchingService } from '../src/modules/proctoring/services/face-matching.service';

describe('Proctoring Engine', () => {
  let engine: ProctoringEngine;

  beforeEach(() => {
    engine = new ProctoringEngine();
    jest.clearAllMocks();
  });

  describe('Rule Management', () => {
    it('should initialize with default rules', () => {
      const rules = engine.getRules();
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0]).toBeInstanceOf(FaceMatchingRule);
    });

    it('should add custom rules', () => {
      const initialCount = engine.getRules().length;
      const customRule = new FaceMatchingRule(true, 90);
      engine.addRule(customRule);

      expect(engine.getRules().length).toBe(initialCount + 1);
    });

    it('should remove rules by ID', () => {
      const initialCount = engine.getRules().length;
      const removed = engine.removeRule('face-matching');

      expect(removed).toBe(true);
      expect(engine.getRules().length).toBe(initialCount - 1);
    });

    it('should enable and disable rules', () => {
      engine.disableRule('face-matching');
      const rules = engine.getRules();
      const rule = rules.find(r => r.id === 'face-matching');

      expect(rule?.enabled).toBe(false);

      engine.enableRule('face-matching');
      expect(rule?.enabled).toBe(true);
    });
  });

  describe('Face Matching Rule', () => {
    it('should pass when faces match above threshold', async () => {
      (faceMatchingService.compareFaces as jest.Mock).mockResolvedValue({
        match: true,
        similarity: 85,
        confidence: 90,
      });

      const context: RuleContext = {
        referenceImageBase64: 'base64_reference_image',
        liveImageBase64: 'base64_live_image',
      };

      const result = await engine.runChecks(context);

      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should fail when faces do not match', async () => {
      (faceMatchingService.compareFaces as jest.Mock).mockResolvedValue({
        match: false,
        similarity: 60,
        confidence: 80,
      });

      const context: RuleContext = {
        referenceImageBase64: 'base64_reference_image',
        liveImageBase64: 'base64_live_image',
      };

      const result = await engine.runChecks(context);

      expect(result.passed).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].ruleId).toBe('face-matching');
      expect(result.violations[0].severity).toBe('high');
    });

    it('should create violation when images are missing', async () => {
      const context: RuleContext = {
        referenceImageBase64: '',
        liveImageBase64: 'base64_live_image',
      };

      const result = await engine.runChecks(context);

      expect(result.passed).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].message).toContain('Missing');
    });

    it('should handle errors gracefully', async () => {
      (faceMatchingService.compareFaces as jest.Mock).mockRejectedValue(
        new Error('AWS Rekognition error')
      );

      const context: RuleContext = {
        referenceImageBase64: 'base64_reference_image',
        liveImageBase64: 'base64_live_image',
      };

      const result = await engine.runChecks(context);

      expect(result.passed).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].message).toContain('error');
    });
  });

  describe('Multiple Rules Execution', () => {
    it('should execute all enabled rules', async () => {
      (faceMatchingService.compareFaces as jest.Mock).mockResolvedValue({
        match: true,
        similarity: 85,
        confidence: 90,
      });

      // Verify the rule executed
      const context: RuleContext = {
        referenceImageBase64: 'base64_reference_image',
        liveImageBase64: 'base64_live_image',
      };

      await engine.runChecks(context);

      // Should have called compareFaces at least once
      expect(faceMatchingService.compareFaces).toHaveBeenCalled();
    });

    it('should skip disabled rules', async () => {
      engine.disableRule('face-matching');

      const context: RuleContext = {
        referenceImageBase64: 'base64_reference_image',
        liveImageBase64: 'base64_live_image',
      };

      await engine.runChecks(context);

      // Should not call face matching since rule is disabled
      expect(faceMatchingService.compareFaces).not.toHaveBeenCalled();
    });
  });

  describe('Violation Data', () => {
    it('should include similarity and confidence in violation data', async () => {
      (faceMatchingService.compareFaces as jest.Mock).mockResolvedValue({
        match: false,
        similarity: 65,
        confidence: 85,
      });

      const context: RuleContext = {
        referenceImageBase64: 'base64_reference_image',
        liveImageBase64: 'base64_live_image',
      };

      const result = await engine.runChecks(context);

      expect(result.violations[0].data).toHaveProperty('similarity');
      expect(result.violations[0].data).toHaveProperty('confidence');
      expect(result.violations[0].data.similarity).toBe(65);
    });

    it('should include timestamp in violations', async () => {
      (faceMatchingService.compareFaces as jest.Mock).mockResolvedValue({
        match: false,
        similarity: 60,
        confidence: 80,
      });

      const context: RuleContext = {
        referenceImageBase64: 'base64_reference_image',
        liveImageBase64: 'base64_live_image',
      };

      const beforeTime = Date.now();
      const result = await engine.runChecks(context);
      const afterTime = Date.now();

      expect(result.violations[0].timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(result.violations[0].timestamp).toBeLessThanOrEqual(afterTime);
    });
  });
});
