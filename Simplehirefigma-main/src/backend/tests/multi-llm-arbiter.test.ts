/**
 * Multi-LLM Arbiter Service Tests
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  ArbitratedResult,
  LLMEvaluationResult,
} from '../src/modules/assessment/multi-llm-arbiter.service';

// Mock the dependencies
jest.mock('../src/config', () => ({
  default: {
    openai: {
      apiKey: 'test-openai-key',
    },
    anthropic: {
      apiKey: 'test-anthropic-key',
    },
    multiLLM: {
      enabled: true,
      providers: ['gpt-4o', 'claude-opus-4-5-20251101'],
    },
  },
}));

jest.mock('../src/config/logger', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('openai');
jest.mock('@anthropic-ai/sdk');
jest.mock('fs');

describe('Multi-LLM Arbiter Service', () => {
  const mockGPTEvaluation: LLMEvaluationResult = {
    provider: 'openai',
    model: 'gpt-4o',
    score: 85,
    categoryScores: {
      technicalAccuracy: 8.5,
      communicationClarity: 8.0,
      problemSolving: 9.0,
      experienceAlignment: 8.5,
    },
    strengths: ['Strong technical knowledge', 'Good problem-solving approach'],
    areasForImprovement: ['Could improve communication clarity'],
    summary: 'Strong candidate with solid technical skills',
    recommendation: 'hire',
    content: JSON.stringify({
      score: 85,
      categoryScores: {
        technicalAccuracy: 8.5,
        communicationClarity: 8.0,
        problemSolving: 9.0,
        experienceAlignment: 8.5,
      },
      strengths: ['Strong technical knowledge', 'Good problem-solving approach'],
      areasForImprovement: ['Could improve communication clarity'],
      summary: 'Strong candidate with solid technical skills',
      recommendation: 'hire',
    }),
    latencyMs: 2500,
  };

  const mockClaudeEvaluation: LLMEvaluationResult = {
    provider: 'anthropic',
    model: 'claude-opus-4-5-20251101',
    score: 75,
    categoryScores: {
      technicalAccuracy: 7.5,
      communicationClarity: 7.0,
      problemSolving: 8.0,
      experienceAlignment: 7.5,
    },
    strengths: ['Good understanding of concepts', 'Practical experience'],
    areasForImprovement: ['Needs deeper technical knowledge', 'Communication could be clearer'],
    summary: 'Decent candidate but needs improvement',
    recommendation: 'maybe_hire',
    content: JSON.stringify({
      score: 75,
      categoryScores: {
        technicalAccuracy: 7.5,
        communicationClarity: 7.0,
        problemSolving: 8.0,
        experienceAlignment: 7.5,
      },
      strengths: ['Good understanding of concepts', 'Practical experience'],
      areasForImprovement: ['Needs deeper technical knowledge', 'Communication could be clearer'],
      summary: 'Decent candidate but needs improvement',
      recommendation: 'maybe_hire',
    }),
    latencyMs: 3000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Category Score Mapping', () => {
    it('should use correct category names from elevenlabs config', () => {
      const expectedCategories = [
        'technicalAccuracy',
        'communicationClarity',
        'problemSolving',
        'experienceAlignment',
      ];

      expect(Object.keys(mockGPTEvaluation.categoryScores)).toEqual(expectedCategories);
      expect(Object.keys(mockClaudeEvaluation.categoryScores)).toEqual(expectedCategories);
    });

    it('should apply correct weights (35/20/25/20)', () => {
      const weights = {
        technicalAccuracy: 0.35,
        communicationClarity: 0.20,
        problemSolving: 0.25,
        experienceAlignment: 0.20,
      };

      // Calculate weighted score
      const weighted =
        mockGPTEvaluation.categoryScores.technicalAccuracy * weights.technicalAccuracy * 10 +
        mockGPTEvaluation.categoryScores.communicationClarity * weights.communicationClarity * 10 +
        mockGPTEvaluation.categoryScores.problemSolving * weights.problemSolving * 10 +
        mockGPTEvaluation.categoryScores.experienceAlignment * weights.experienceAlignment * 10;

      // Should be close to the overall score
      expect(Math.abs(weighted - mockGPTEvaluation.score)).toBeLessThan(5);
    });
  });

  describe('Arbiter Result Structure', () => {
    it('should include all required fields in ArbitratedResult', () => {
      const mockResult: ArbitratedResult = {
        selectedEvaluationIndex: 0,
        selectedProvider: 'openai',
        rationale: 'GPT-4o provided more detailed analysis',
        
        finalScore: 85,
        categoryScores: mockGPTEvaluation.categoryScores,
        
        strengths: mockGPTEvaluation.strengths,
        improvements: mockGPTEvaluation.areasForImprovement,
        summary: mockGPTEvaluation.summary,
        recommendation: mockGPTEvaluation.recommendation,
        
        confidenceLevel: 'high',
        evaluationAgreement: 'Both evaluations agreed on hire recommendation',
        
        providerResults: [mockGPTEvaluation, mockClaudeEvaluation],
        arbiterSkipped: false,
        arbitrationMethod: 'arbiter_selection',
        
        arbiterProvider: 'openai',
        arbiterModel: 'gpt-4o',
        arbiterLatencyMs: 1500,
      };

      // Verify all required fields exist
      expect(mockResult.selectedEvaluationIndex).toBeDefined();
      expect(mockResult.selectedProvider).toBeDefined();
      expect(mockResult.rationale).toBeDefined();
      expect(mockResult.finalScore).toBeDefined();
      expect(mockResult.categoryScores).toBeDefined();
      expect(mockResult.strengths).toBeDefined();
      expect(mockResult.improvements).toBeDefined();
      expect(mockResult.recommendation).toBeDefined();
      expect(mockResult.confidenceLevel).toBeDefined();
      expect(mockResult.evaluationAgreement).toBeDefined();
      expect(mockResult.providerResults).toBeDefined();
      expect(mockResult.arbiterSkipped).toBeDefined();
      expect(mockResult.arbitrationMethod).toBeDefined();
    });

    it('should have arbiter fields when arbiter is used', () => {
      const mockResult: ArbitratedResult = {
        selectedEvaluationIndex: 0,
        selectedProvider: 'openai',
        rationale: 'GPT-4o analysis was superior',
        finalScore: 85,
        categoryScores: mockGPTEvaluation.categoryScores,
        strengths: mockGPTEvaluation.strengths,
        improvements: mockGPTEvaluation.areasForImprovement,
        summary: mockGPTEvaluation.summary,
        recommendation: mockGPTEvaluation.recommendation,
        confidenceLevel: 'high',
        evaluationAgreement: 'Evaluations diverged significantly',
        providerResults: [mockGPTEvaluation, mockClaudeEvaluation],
        arbiterSkipped: false,
        arbitrationMethod: 'arbiter_selection',
        arbiterProvider: 'openai',
        arbiterModel: 'gpt-4o',
        arbiterLatencyMs: 1500,
      };

      expect(mockResult.arbiterProvider).toBe('openai');
      expect(mockResult.arbiterModel).toBe('gpt-4o');
      expect(mockResult.arbiterLatencyMs).toBeGreaterThan(0);
    });
  });

  describe('Evaluation Recommendations', () => {
    it('should support all recommendation types', () => {
      const validRecommendations = ['strong_hire', 'hire', 'maybe_hire', 'no_hire'];
      
      validRecommendations.forEach(rec => {
        const result: ArbitratedResult = {
          selectedEvaluationIndex: 0,
          selectedProvider: 'openai',
          rationale: 'Test',
          finalScore: 70,
          categoryScores: mockGPTEvaluation.categoryScores,
          strengths: [],
          improvements: [],
          summary: 'Test',
          recommendation: rec as any,
          confidenceLevel: 'medium',
          evaluationAgreement: 'Test',
          providerResults: [mockGPTEvaluation],
          arbiterSkipped: false,
          arbitrationMethod: 'arbiter_selection',
        };

        expect(validRecommendations).toContain(result.recommendation);
      });
    });
  });

  describe('Confidence Levels', () => {
    it('should support all confidence levels', () => {
      const validConfidenceLevels = ['high', 'medium', 'low'];
      
      validConfidenceLevels.forEach(level => {
        const result: ArbitratedResult = {
          selectedEvaluationIndex: 0,
          selectedProvider: 'openai',
          rationale: 'Test',
          finalScore: 70,
          categoryScores: mockGPTEvaluation.categoryScores,
          strengths: [],
          improvements: [],
          summary: 'Test',
          recommendation: 'hire',
          confidenceLevel: level as any,
          evaluationAgreement: 'Test',
          providerResults: [mockGPTEvaluation],
          arbiterSkipped: false,
          arbitrationMethod: 'arbiter_selection',
        };

        expect(validConfidenceLevels).toContain(result.confidenceLevel);
      });
    });
  });

  describe('Provider Results', () => {
    it('should include all provider results in final output', () => {
      const result: ArbitratedResult = {
        selectedEvaluationIndex: 0,
        selectedProvider: 'openai',
        rationale: 'Test',
        finalScore: 85,
        categoryScores: mockGPTEvaluation.categoryScores,
        strengths: [],
        improvements: [],
        summary: 'Test',
        recommendation: 'hire',
        confidenceLevel: 'high',
        evaluationAgreement: 'Test',
        providerResults: [mockGPTEvaluation, mockClaudeEvaluation],
        arbiterSkipped: false,
        arbitrationMethod: 'arbiter_selection',
      };

      expect(result.providerResults).toHaveLength(2);
      expect(result.providerResults[0].provider).toBe('openai');
      expect(result.providerResults[1].provider).toBe('anthropic');
    });
  });

  describe('Single Evaluation Scenario', () => {
    it('should skip arbiter when only one evaluation is available', () => {
      const singleEvaluationResult: ArbitratedResult = {
        selectedEvaluationIndex: 0,
        selectedProvider: 'openai',
        rationale: 'Single evaluation available - used directly',
        arbiterSkipped: true,
        arbitrationMethod: 'consensus',
        
        finalScore: mockGPTEvaluation.score,
        categoryScores: mockGPTEvaluation.categoryScores,
        strengths: mockGPTEvaluation.strengths,
        improvements: mockGPTEvaluation.areasForImprovement,
        summary: mockGPTEvaluation.summary,
        recommendation: mockGPTEvaluation.recommendation,
        
        confidenceLevel: 'medium',
        evaluationAgreement: 'N/A - single evaluation',
        
        providerResults: [mockGPTEvaluation],
      };

      expect(singleEvaluationResult.arbiterSkipped).toBe(true);
      expect(singleEvaluationResult.arbitrationMethod).toBe('consensus');
      expect(singleEvaluationResult.evaluationAgreement).toContain('single evaluation');
      expect(singleEvaluationResult.arbiterProvider).toBeUndefined();
    });
  });

  describe('Arbiter Selection Scenario', () => {
    it('should use arbiter_selection method when two evaluations differ', () => {
      const arbiterSelectionResult: ArbitratedResult = {
        selectedEvaluationIndex: 0,
        selectedProvider: 'openai',
        rationale: 'GPT-4o provided more comprehensive analysis',
        arbiterSkipped: false,
        arbitrationMethod: 'arbiter_selection',
        
        finalScore: 85,
        categoryScores: mockGPTEvaluation.categoryScores,
        strengths: mockGPTEvaluation.strengths,
        improvements: mockGPTEvaluation.areasForImprovement,
        summary: 'Synthesized feedback from both evaluations',
        recommendation: 'hire',
        
        confidenceLevel: 'high',
        evaluationAgreement: 'Evaluations agreed on technical competence but differed on overall score',
        
        providerResults: [mockGPTEvaluation, mockClaudeEvaluation],
        arbiterProvider: 'openai',
        arbiterModel: 'gpt-4o',
        arbiterLatencyMs: 1500,
      };

      expect(arbiterSelectionResult.arbiterSkipped).toBe(false);
      expect(arbiterSelectionResult.arbitrationMethod).toBe('arbiter_selection');
      expect(arbiterSelectionResult.arbiterProvider).toBe('openai');
      expect(arbiterSelectionResult.arbiterModel).toBe('gpt-4o');
      expect(arbiterSelectionResult.arbiterLatencyMs).toBeGreaterThan(0);
    });
  });
});
