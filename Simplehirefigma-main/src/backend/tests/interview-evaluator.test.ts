/**
 * Interview Evaluator Service Tests
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { interviewEvaluatorService } from '../src/modules/assessment/interview-evaluator.service';

// Mock dependencies
jest.mock('../src/modules/assessment/multi-llm-arbiter.service');
jest.mock('../src/modules/assessment/score-aggregator.service');

describe('Interview Evaluator Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('evaluateInterview', () => {
    it('should evaluate interview with multi-LLM when enabled', async () => {
      const mockInput = {
        voiceAnswers: [
          {
            questionId: 'q1',
            question: 'Tell me about your React experience',
            answer: 'I have 4 years of React experience...',
            transcription: 'I have 4 years of React experience...',
          },
        ],
        mcqAnswers: [
          {
            questionId: 'mcq1',
            questionText: 'What is a closure?',
            selectedAnswer: 'A function with access to outer scope',
            correctAnswer: 'A function with access to outer scope',
            isCorrect: true,
          },
        ],
        codingAnswers: [
          {
            challengeId: 'code1',
            challengeDescription: 'Reverse a linked list',
            code: 'function reverse(head) { /* solution */ }',
            language: 'JavaScript',
          },
        ],
        candidateProfile: {
          role: 'Software Engineer',
          experience: '5 years',
          skills: ['React', 'Node.js', 'TypeScript'],
        },
      };

      // Mock multi-LLM arbiter
      const { multiLLMArbiterService } = require('../src/modules/assessment/multi-llm-arbiter.service');
      multiLLMArbiterService.evaluateWithMultiLLM = jest.fn().mockResolvedValue({
        finalScore: 85,
        categoryScores: {
          technicalAccuracy: 88,
          problemSolving: 85,
          communication: 82,
          codeQuality: 86,
        },
        strengths: ['Strong technical skills', 'Good communication'],
        improvements: ['Consider edge cases', 'Improve time complexity'],
        recommendation: 'hire',
        rationale: 'Solid candidate with strong fundamentals',
        providerResults: [
          { provider: 'gpt-4o', score: 85, confidence: 0.85 },
          { provider: 'claude-3-5-sonnet', score: 87, confidence: 0.88 },
        ],
        arbitrationMethod: 'weighted_average',
      });

      const result = await interviewEvaluatorService.evaluateInterview(mockInput, true);

      expect(result).toBeDefined();
      expect(result.overallScore).toBe(85);
      expect(result.skillLevel).toBeDefined();
      expect(result.categoryScores).toBeDefined();
      expect(result.categoryScores.technicalAccuracy).toBe(88);
      expect(result.strengths).toBeInstanceOf(Array);
      expect(result.improvements).toBeInstanceOf(Array);
      expect(result.recommendation).toBe('hire');
      expect(result.multiLLMEnabled).toBe(true);
      expect(result.providersUsed).toBeDefined();
      expect(multiLLMArbiterService.evaluateWithMultiLLM).toHaveBeenCalled();
    });

    it('should fall back to traditional scoring when multi-LLM fails', async () => {
      const mockInput = {
        mcqAnswers: [
          {
            questionId: 'mcq1',
            questionText: 'What is a closure?',
            selectedAnswer: 'A function with access to outer scope',
            correctAnswer: 'A function with access to outer scope',
            isCorrect: true,
          },
          {
            questionId: 'mcq2',
            questionText: 'What is async/await?',
            selectedAnswer: 'Promise syntax',
            correctAnswer: 'Promise syntax',
            isCorrect: true,
          },
        ],
        candidateProfile: {
          role: 'Software Engineer',
          experience: '3 years',
          skills: ['JavaScript', 'React'],
        },
        componentScores: {
          voice: 75,
          mcq: 100,
          code: 80,
        },
      };

      // Mock multi-LLM arbiter to fail
      const { multiLLMArbiterService } = require('../src/modules/assessment/multi-llm-arbiter.service');
      multiLLMArbiterService.evaluateWithMultiLLM = jest.fn().mockRejectedValue(new Error('API error'));

      // Mock score aggregator
      const { scoreAggregatorService } = require('../src/modules/assessment/score-aggregator.service');
      scoreAggregatorService.aggregateScores = jest.fn().mockReturnValue({
        overallScore: 82,
        level: 'SENIOR',
        componentScores: [
          { component: 'VOICE', score: 75, weight: 0.3 },
          { component: 'MCQ', score: 100, weight: 0.35 },
          { component: 'CODE', score: 80, weight: 0.35 },
        ],
        strengths: ['Strong technical knowledge', 'Strong coding abilities'],
        areasForImprovement: [],
      });

      scoreAggregatorService.determineLevel = jest.fn().mockReturnValue('SENIOR');

      const result = await interviewEvaluatorService.evaluateInterview(mockInput, true);

      expect(result).toBeDefined();
      expect(result.overallScore).toBe(82);
      expect(result.skillLevel).toBe('SENIOR');
      expect(result.multiLLMEnabled).toBe(false);
      expect(result.recommendation).toBe('hire');
      expect(scoreAggregatorService.aggregateScores).toHaveBeenCalledWith(75, 100, 80);
    });

    it('should calculate MCQ score from answers', async () => {
      const mockInput = {
        mcqAnswers: [
          {
            questionId: 'mcq1',
            questionText: 'Question 1',
            selectedAnswer: 'A',
            correctAnswer: 'A',
            isCorrect: true,
          },
          {
            questionId: 'mcq2',
            questionText: 'Question 2',
            selectedAnswer: 'B',
            correctAnswer: 'A',
            isCorrect: false,
          },
          {
            questionId: 'mcq3',
            questionText: 'Question 3',
            selectedAnswer: 'C',
            correctAnswer: 'C',
            isCorrect: true,
          },
        ],
        candidateProfile: {
          role: 'Developer',
          experience: '2 years',
          skills: ['JavaScript'],
        },
      };

      const { scoreAggregatorService } = require('../src/modules/assessment/score-aggregator.service');
      scoreAggregatorService.aggregateScores = jest.fn().mockReturnValue({
        overallScore: 67,
        level: 'INTERMEDIATE',
        componentScores: [],
        strengths: ['Adequate technical knowledge'],
        areasForImprovement: [],
      });

      scoreAggregatorService.determineLevel = jest.fn().mockReturnValue('INTERMEDIATE');

      const result = await interviewEvaluatorService.evaluateInterview(mockInput, false);

      expect(result).toBeDefined();
      // 2 correct out of 3 = 67% (rounded)
      expect(result.componentScores.mcq).toBe(67);
    });
  });

  describe('reEvaluateInterview', () => {
    it('should force multi-LLM evaluation on re-evaluation', async () => {
      const mockInput = {
        voiceAnswers: [
          {
            questionId: 'q1',
            question: 'Tell me about yourself',
            answer: 'I am a software engineer...',
          },
        ],
        candidateProfile: {
          role: 'Engineer',
          experience: '4 years',
          skills: ['Python', 'Django'],
        },
      };

      const { multiLLMArbiterService } = require('../src/modules/assessment/multi-llm-arbiter.service');
      multiLLMArbiterService.evaluateWithMultiLLM = jest.fn().mockResolvedValue({
        finalScore: 78,
        categoryScores: {
          technicalAccuracy: 80,
          problemSolving: 78,
          communication: 75,
          codeQuality: 79,
        },
        strengths: ['Good technical knowledge'],
        improvements: ['Improve communication'],
        recommendation: 'maybe',
        rationale: 'Candidate needs improvement',
        providerResults: [],
        arbitrationMethod: 'consensus',
      });

      const result = await interviewEvaluatorService.reEvaluateInterview(mockInput);

      expect(result).toBeDefined();
      expect(multiLLMArbiterService.evaluateWithMultiLLM).toHaveBeenCalledWith(
        expect.any(Object),
        true
      );
    });
  });
});
