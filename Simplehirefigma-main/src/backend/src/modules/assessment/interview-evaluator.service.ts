/**
 * Interview Evaluator Service
 * Provides comprehensive post-interview evaluation using multi-LLM arbiter
 * Integrates with existing score aggregator for backward compatibility
 */

import logger from '../../config/logger';
import config from '../../config';
import { multiLLMArbiterService, ArbitratedResult, LLMProvider } from './multi-llm-arbiter.service';
import { scoreAggregatorService } from './score-aggregator.service';

export interface InterviewEvaluationInput {
  // Voice interview data
  voiceAnswers?: Array<{
    questionId: string;
    question: string;
    answer: string;
    transcription?: string;
    duration?: number;
  }>;

  // MCQ test data
  mcqAnswers?: Array<{
    questionId: string;
    questionText: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>;

  // Coding challenge data
  codingAnswers?: Array<{
    challengeId: string;
    challengeDescription: string;
    code: string;
    language: string;
    testsPassed?: number;
    totalTests?: number;
  }>;

  // Candidate information
  candidateProfile: {
    name?: string;
    role: string;
    experience: string;
    skills: string[];
  };

  // Component scores (for aggregation)
  componentScores?: {
    voice?: number;
    mcq?: number;
    code?: number;
  };
}

export interface ComprehensiveEvaluation {
  // Overall assessment
  overallScore: number; // 0-100
  skillLevel: 'BEGINNER' | 'JUNIOR' | 'INTERMEDIATE' | 'SENIOR' | 'EXPERT';
  
  // Category-specific scores
  categoryScores: {
    technicalAccuracy: number;
    problemSolving: number;
    communication: number;
    codeQuality: number;
  };

  // Component scores (for backward compatibility)
  componentScores: {
    voice?: number;
    mcq?: number;
    code?: number;
  };

  // Insights
  strengths: string[];
  improvements: string[];
  
  // Hiring recommendation
  recommendation: 'strong_hire' | 'hire' | 'maybe' | 'no_hire';
  rationale: string;
  
  // Multi-LLM metadata
  multiLLMEnabled: boolean;
  providersUsed?: LLMProvider[];
  arbitrationMethod?: string;
  
  // Timestamps
  evaluatedAt: Date;
}

/**
 * Default category score used when multi-LLM evaluation is unavailable
 */
const DEFAULT_FALLBACK_CATEGORY_SCORE = 70;

/**
 * Calculate MCQ score from answers
 */
function calculateMCQScore(
  mcqAnswers: Array<{ isCorrect: boolean }>
): number {
  if (!mcqAnswers || mcqAnswers.length === 0) return 0;
  
  const correctCount = mcqAnswers.filter(a => a.isCorrect).length;
  return Math.round((correctCount / mcqAnswers.length) * 100);
}

/**
 * Prepare interview data for multi-LLM evaluation
 */
function prepareInterviewData(input: InterviewEvaluationInput) {
  const candidateProfile = `
Role: ${input.candidateProfile.role}
Experience: ${input.candidateProfile.experience}
Key Skills: ${input.candidateProfile.skills.join(', ')}
${input.candidateProfile.name ? `Name: ${input.candidateProfile.name}` : ''}
`.trim();

  return {
    candidateProfile,
    voiceAnswers: input.voiceAnswers?.map(va => ({
      question: va.question,
      answer: va.transcription || va.answer,
      score: undefined, // Will be evaluated by LLM
    })),
    mcqAnswers: input.mcqAnswers?.map(ma => ({
      question: ma.questionText,
      correct: ma.isCorrect,
      score: undefined,
    })),
    codeAnswers: input.codingAnswers?.map(ca => ({
      challenge: ca.challengeDescription,
      code: ca.code,
      score: undefined,
    })),
  };
}

/**
 * Evaluate interview comprehensively using multi-LLM arbiter
 */
export async function evaluateInterview(
  input: InterviewEvaluationInput,
  useMultiLLM: boolean = config.multiLLM.enableArbiter
): Promise<ComprehensiveEvaluation> {
  try {
    logger.info('Starting comprehensive interview evaluation');
    
    // Calculate component scores if not provided
    const componentScores = {
      voice: input.componentScores?.voice,
      mcq: input.componentScores?.mcq ?? (input.mcqAnswers ? calculateMCQScore(input.mcqAnswers) : undefined),
      code: input.componentScores?.code,
    };

    let multiLLMResult: ArbitratedResult | null = null;

    // Use multi-LLM arbiter if enabled
    if (useMultiLLM && (input.voiceAnswers || input.codingAnswers)) {
      try {
        const interviewData = prepareInterviewData(input);
        multiLLMResult = await multiLLMArbiterService.evaluateWithMultiLLM(interviewData);
        logger.info('Multi-LLM evaluation completed successfully');
      } catch (error) {
        logger.error('Multi-LLM evaluation failed, falling back to traditional scoring:', error);
        multiLLMResult = null;
      }
    }

    let overallScore: number;
    let categoryScores: {
      technicalAccuracy: number;
      problemSolving: number;
      communication: number;
      codeQuality: number;
    };
    let strengths: string[];
    let improvements: string[];
    let recommendation: 'strong_hire' | 'hire' | 'maybe' | 'no_hire';
    let rationale: string;

    if (multiLLMResult) {
      // Use multi-LLM arbiter results
      overallScore = multiLLMResult.finalScore;
      categoryScores = multiLLMResult.categoryScores;
      strengths = multiLLMResult.strengths;
      improvements = multiLLMResult.improvements;
      recommendation = multiLLMResult.recommendation;
      rationale = multiLLMResult.rationale;
    } else {
      // Fall back to traditional score aggregation
      const aggregated = scoreAggregatorService.aggregateScores(
        componentScores.voice,
        componentScores.mcq,
        componentScores.code
      );

      overallScore = aggregated.overallScore;
      
      // Derive category scores from component scores (approximate)
      categoryScores = {
        technicalAccuracy: componentScores.mcq || DEFAULT_FALLBACK_CATEGORY_SCORE,
        problemSolving: componentScores.code || DEFAULT_FALLBACK_CATEGORY_SCORE,
        communication: componentScores.voice || DEFAULT_FALLBACK_CATEGORY_SCORE,
        codeQuality: componentScores.code || DEFAULT_FALLBACK_CATEGORY_SCORE,
      };

      strengths = aggregated.strengths;
      improvements = aggregated.areasForImprovement;
      
      // Map aggregated level to recommendation
      recommendation = mapLevelToRecommendation(aggregated.level);
      rationale = `Based on ${aggregated.level} level performance across assessment components.`;
    }

    const skillLevel = scoreAggregatorService.determineLevel(overallScore);

    const evaluation: ComprehensiveEvaluation = {
      overallScore,
      skillLevel,
      categoryScores,
      componentScores,
      strengths,
      improvements,
      recommendation,
      rationale,
      multiLLMEnabled: multiLLMResult !== null,
      providersUsed: multiLLMResult?.providerResults.map(r => r.provider),
      arbitrationMethod: multiLLMResult?.arbitrationMethod,
      evaluatedAt: new Date(),
    };

    logger.info(
      `Interview evaluation complete: Score=${overallScore}, Level=${skillLevel}, Recommendation=${recommendation}`
    );

    return evaluation;
  } catch (error) {
    logger.error('Error evaluating interview:', error);
    throw error;
  }
}

/**
 * Map skill level to hiring recommendation
 */
function mapLevelToRecommendation(
  level: 'BEGINNER' | 'JUNIOR' | 'INTERMEDIATE' | 'SENIOR' | 'EXPERT'
): 'strong_hire' | 'hire' | 'maybe' | 'no_hire' {
  switch (level) {
    case 'EXPERT':
      return 'strong_hire';
    case 'SENIOR':
      return 'hire';
    case 'INTERMEDIATE':
      return 'hire';
    case 'JUNIOR':
      return 'maybe';
    case 'BEGINNER':
      return 'no_hire';
    default:
      return 'maybe';
  }
}

/**
 * Re-evaluate an existing interview with multi-LLM arbiter
 */
export async function reEvaluateInterview(
  input: InterviewEvaluationInput,
  forceMultiLLM: boolean = true
): Promise<ComprehensiveEvaluation> {
  logger.info('Re-evaluating interview with multi-LLM arbiter');
  return evaluateInterview(input, forceMultiLLM);
}

export const interviewEvaluatorService = {
  evaluateInterview,
  reEvaluateInterview,
};
