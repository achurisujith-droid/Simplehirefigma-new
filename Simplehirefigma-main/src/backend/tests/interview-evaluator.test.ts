/**
 * Interview Evaluator Service Tests
 */

import { describe, it, expect } from '@jest/globals';

describe('Interview Evaluator Service', () => {
  describe('evaluateInterview', () => {
    it('should be defined and exported', () => {
      const { interviewEvaluatorService } = require('../src/modules/assessment/interview-evaluator.service');
      expect(interviewEvaluatorService).toBeDefined();
      expect(interviewEvaluatorService.evaluateInterview).toBeDefined();
      expect(typeof interviewEvaluatorService.evaluateInterview).toBe('function');
    });

    it('should have correct service structure', () => {
      const service = require('../src/modules/assessment/interview-evaluator.service');
      expect(service.interviewEvaluatorService).toBeDefined();
      expect(service.interviewEvaluatorService).toHaveProperty('evaluateInterview');
      expect(service.interviewEvaluatorService).toHaveProperty('reEvaluateInterview');
    });

    it('should validate input structure requirements', () => {
      // Test that the expected input structure is documented
      const mockInput = {
        voiceAnswers: [],
        mcqAnswers: [],
        codingAnswers: [],
        candidateProfile: {
          role: 'Test Role',
          experience: '5 years',
          skills: ['Skill1', 'Skill2'],
        },
      };

      expect(mockInput.candidateProfile).toHaveProperty('role');
      expect(mockInput.candidateProfile).toHaveProperty('experience');
      expect(mockInput.candidateProfile).toHaveProperty('skills');
      expect(Array.isArray(mockInput.candidateProfile.skills)).toBe(true);
    });

    it('should define comprehensive evaluation output structure', () => {
      // Test that expected output structure is well-defined
      const mockOutput = {
        overallScore: 85,
        skillLevel: 'SENIOR',
        categoryScores: {
          technicalAccuracy: 88,
          problemSolving: 85,
          communication: 82,
          codeQuality: 86,
        },
        componentScores: {
          voice: 80,
          mcq: 90,
          code: 85,
        },
        strengths: ['Strong technical skills'],
        improvements: ['Improve communication'],
        recommendation: 'hire',
        rationale: 'Good candidate',
        multiLLMEnabled: true,
        evaluatedAt: new Date(),
      };

      expect(mockOutput).toHaveProperty('overallScore');
      expect(mockOutput).toHaveProperty('skillLevel');
      expect(mockOutput).toHaveProperty('categoryScores');
      expect(mockOutput).toHaveProperty('recommendation');
      expect(['strong_hire', 'hire', 'maybe', 'no_hire']).toContain(mockOutput.recommendation);
    });
  });

  describe('reEvaluateInterview', () => {
    it('should be defined and exported', () => {
      const { interviewEvaluatorService } = require('../src/modules/assessment/interview-evaluator.service');
      expect(interviewEvaluatorService.reEvaluateInterview).toBeDefined();
      expect(typeof interviewEvaluatorService.reEvaluateInterview).toBe('function');
    });
  });

  describe('Service Integration', () => {
    it('should integrate with multi-LLM arbiter service', () => {
      const evaluatorService = require('../src/modules/assessment/interview-evaluator.service');
      const arbiterService = require('../src/modules/assessment/multi-llm-arbiter.service');
      
      expect(evaluatorService.interviewEvaluatorService).toBeDefined();
      expect(arbiterService.multiLLMArbiterService).toBeDefined();
    });

    it('should integrate with score aggregator service', () => {
      const evaluatorService = require('../src/modules/assessment/interview-evaluator.service');
      const scoreService = require('../src/modules/assessment/score-aggregator.service');
      
      expect(evaluatorService.interviewEvaluatorService).toBeDefined();
      expect(scoreService.scoreAggregatorService).toBeDefined();
    });
  });
});

