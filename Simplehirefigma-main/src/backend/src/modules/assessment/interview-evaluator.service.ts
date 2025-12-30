/**
 * Interview Evaluator Service
 * Uses Multi-LLM Arbiter for comprehensive interview evaluation
 */

import logger from '../../config/logger';
import { evaluateWithMultiLLM, InterviewData, ArbitratedResult } from './multi-llm-arbiter.service';

export interface VoiceAnswer {
  questionId: string;
  question: string;
  answer: string;
  transcript?: string;
}

export interface MCQAnswer {
  questionId: string;
  question: string;
  selectedOption: string;
  correctOption: string;
  isCorrect: boolean;
}

export interface CodeAnswer {
  questionId: string;
  question: string;
  language: string;
  code: string;
}

export interface InterviewEvaluationInput {
  candidateName: string;
  candidateEmail: string;
  resumeText: string;
  voiceAnswers?: VoiceAnswer[];
  mcqAnswers?: MCQAnswer[];
  codeAnswers?: CodeAnswer[];
}

export interface InterviewEvaluationResult extends ArbitratedResult {
  candidateName: string;
  candidateEmail: string;
  evaluatedAt: Date;
}

/**
 * Evaluate complete interview using multi-LLM arbiter
 */
export async function evaluateInterview(
  input: InterviewEvaluationInput
): Promise<InterviewEvaluationResult> {
  try {
    logger.info(`Evaluating interview for ${input.candidateName}`);

    // Transform input to InterviewData format
    const interviewData: InterviewData = {
      candidateProfile: `Name: ${input.candidateName}
Email: ${input.candidateEmail}

Resume:
${input.resumeText}`,
      voiceAnswers: input.voiceAnswers?.map(va => ({
        question: va.question,
        answer: va.transcript || va.answer,
      })),
      mcqAnswers: input.mcqAnswers?.map(mcq => ({
        question: mcq.question,
        selected: mcq.selectedOption,
        correct: mcq.isCorrect,
      })),
      codeAnswers: input.codeAnswers?.map(ca => ({
        question: ca.question,
        code: ca.code,
        language: ca.language,
      })),
    };

    // Run multi-LLM evaluation with arbiter
    const result = await evaluateWithMultiLLM(interviewData);

    // Return enriched result
    return {
      ...result,
      candidateName: input.candidateName,
      candidateEmail: input.candidateEmail,
      evaluatedAt: new Date(),
    };
  } catch (error) {
    logger.error('Error evaluating interview:', error);
    throw error;
  }
}

/**
 * Calculate weighted overall score from category scores
 * Uses weights from llm_config.json
 */
export function calculateWeightedScore(categoryScores: {
  technicalAccuracy: number;
  communicationClarity: number;
  problemSolving: number;
  experienceAlignment: number;
}): number {
  // Weights from llm_config.json
  const weights = {
    technicalAccuracy: 0.35,
    communicationClarity: 0.2,
    problemSolving: 0.25,
    experienceAlignment: 0.2,
  };

  const weightedScore =
    categoryScores.technicalAccuracy * weights.technicalAccuracy * 10 +
    categoryScores.communicationClarity * weights.communicationClarity * 10 +
    categoryScores.problemSolving * weights.problemSolving * 10 +
    categoryScores.experienceAlignment * weights.experienceAlignment * 10;

  return Math.round(weightedScore);
}

export const interviewEvaluatorService = {
  evaluateInterview,
  calculateWeightedScore,
};
