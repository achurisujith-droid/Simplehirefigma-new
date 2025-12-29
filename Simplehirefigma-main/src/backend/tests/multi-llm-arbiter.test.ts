/**
 * Multi-LLM Arbiter Service Tests
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { multiLLMArbiterService } from '../src/modules/assessment/multi-llm-arbiter.service';

// Mock OpenAI and Anthropic
jest.mock('openai');
jest.mock('@anthropic-ai/sdk');

describe('Multi-LLM Arbiter Service', () => {
  const mockInterviewData = {
    candidateProfile: 'Software Engineer with 5 years experience in React and Node.js',
    voiceAnswers: [
      {
        question: 'Tell me about your experience with React',
        answer: 'I have been working with React for 4 years, building scalable applications...',
      },
    ],
    mcqAnswers: [
      {
        question: 'What is a closure in JavaScript?',
        correct: true,
      },
    ],
    codeAnswers: [
      {
        challenge: 'Implement a function to reverse a linked list',
        code: 'function reverseList(head) { /* implementation */ }',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('evaluateWithMultiLLM', () => {
    it('should handle evaluation with multiple providers', async () => {
      // Mock OpenAI response
      const OpenAI = require('openai');
      OpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      overallScore: 85,
                      categoryScores: {
                        technicalAccuracy: 88,
                        problemSolving: 85,
                        communication: 82,
                        codeQuality: 86,
                      },
                      strengths: ['Strong React knowledge', 'Good problem solving'],
                      improvements: ['Improve algorithm complexity awareness'],
                      recommendation: 'hire',
                      rationale: 'Solid candidate with good technical skills',
                      confidence: 0.85,
                    }),
                  },
                },
              ],
            }),
          },
        },
      }));

      // Mock Anthropic response
      const Anthropic = require('@anthropic-ai/sdk');
      Anthropic.mockImplementation(() => ({
        messages: {
          create: jest.fn().mockResolvedValue({
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  overallScore: 87,
                  categoryScores: {
                    technicalAccuracy: 90,
                    problemSolving: 86,
                    communication: 84,
                    codeQuality: 88,
                  },
                  strengths: ['Excellent technical depth', 'Clear communication'],
                  improvements: ['Consider edge cases more thoroughly'],
                  recommendation: 'hire',
                  rationale: 'Strong candidate with excellent fundamentals',
                  confidence: 0.88,
                }),
              },
            ],
          }),
        },
      }));

      const result = await multiLLMArbiterService.evaluateWithMultiLLM(
        mockInterviewData,
        ['gpt-4o', 'claude-3-5-sonnet']
      );

      expect(result).toBeDefined();
      expect(result.finalScore).toBeGreaterThan(0);
      expect(result.finalScore).toBeLessThanOrEqual(100);
      expect(result.categoryScores).toBeDefined();
      expect(result.strengths).toBeInstanceOf(Array);
      expect(result.improvements).toBeInstanceOf(Array);
      expect(['strong_hire', 'hire', 'maybe', 'no_hire']).toContain(result.recommendation);
      expect(result.providerResults).toHaveLength(2);
    });

    it('should handle single provider gracefully', async () => {
      const OpenAI = require('openai');
      OpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      overallScore: 75,
                      categoryScores: {
                        technicalAccuracy: 78,
                        problemSolving: 75,
                        communication: 72,
                        codeQuality: 76,
                      },
                      strengths: ['Good technical foundation'],
                      improvements: ['Improve communication clarity'],
                      recommendation: 'maybe',
                      rationale: 'Candidate shows potential',
                      confidence: 0.75,
                    }),
                  },
                },
              ],
            }),
          },
        },
      }));

      const result = await multiLLMArbiterService.evaluateWithMultiLLM(
        mockInterviewData,
        ['gpt-4o']
      );

      expect(result).toBeDefined();
      expect(result.providerResults).toHaveLength(1);
      expect(result.arbitrationMethod).toBe('consensus');
    });

    it('should handle provider failures gracefully', async () => {
      const OpenAI = require('openai');
      OpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      overallScore: 80,
                      categoryScores: {
                        technicalAccuracy: 82,
                        problemSolving: 80,
                        communication: 78,
                        codeQuality: 81,
                      },
                      strengths: ['Solid skills'],
                      improvements: ['Practice more'],
                      recommendation: 'hire',
                      rationale: 'Good candidate',
                      confidence: 0.8,
                    }),
                  },
                },
              ],
            }),
          },
        },
      }));

      // Claude fails
      const Anthropic = require('@anthropic-ai/sdk');
      Anthropic.mockImplementation(() => ({
        messages: {
          create: jest.fn().mockRejectedValue(new Error('API error')),
        },
      }));

      const result = await multiLLMArbiterService.evaluateWithMultiLLM(
        mockInterviewData,
        ['gpt-4o', 'claude-3-5-sonnet']
      );

      // Should still work with one successful provider
      expect(result).toBeDefined();
      expect(result.providerResults).toHaveLength(1);
      expect(result.providerResults[0].provider).toBe('gpt-4o');
    });
  });
});
