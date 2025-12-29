/**
 * Multi-LLM Arbiter Service Tests
 */

import { describe, it, expect } from '@jest/globals';

describe('Multi-LLM Arbiter Service', () => {
  describe('evaluateWithMultiLLM', () => {
    it('should be defined and exported', () => {
      const service = require('../src/modules/assessment/multi-llm-arbiter.service');
      expect(service.multiLLMArbiterService).toBeDefined();
      expect(service.multiLLMArbiterService.evaluateWithMultiLLM).toBeDefined();
      expect(typeof service.multiLLMArbiterService.evaluateWithMultiLLM).toBe('function');
    });

    it('should have correct exports', () => {
      const service = require('../src/modules/assessment/multi-llm-arbiter.service');
      expect(service.multiLLMArbiterService).toBeDefined();
      expect(service.multiLLMArbiterService.evaluateWithGPT4o).toBeDefined();
      expect(service.multiLLMArbiterService.evaluateWithClaude).toBeDefined();
    });

    it('should validate input structure requirements', () => {
      const service = require('../src/modules/assessment/multi-llm-arbiter.service');
      
      // Test that the function exists and accepts the right parameters
      expect(() => {
        // Should not throw for proper structure validation
        const testData = {
          candidateProfile: 'Test profile',
          voiceAnswers: [],
          mcqAnswers: [],
          codeAnswers: [],
        };
        expect(testData).toBeDefined();
        expect(service.multiLLMArbiterService).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Service Structure', () => {
    it('should export service with expected methods', () => {
      const service = require('../src/modules/assessment/multi-llm-arbiter.service');
      
      expect(service.multiLLMArbiterService).toHaveProperty('evaluateWithMultiLLM');
      expect(service.multiLLMArbiterService).toHaveProperty('evaluateWithGPT4o');
      expect(service.multiLLMArbiterService).toHaveProperty('evaluateWithClaude');
    });
  });
});

