/**
 * Multi-LLM Arbiter Service
 * Implements multi-LLM evaluation with arbitration logic
 * Supports parallel evaluation using multiple LLM providers (GPT-4o, Claude)
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import config from '../../config';
import logger from '../../config/logger';
import { safeJsonParse } from '../../utils/security';

// Initialize LLM clients
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

const anthropic = new Anthropic({
  apiKey: config.anthropic.apiKey,
});

export type LLMProvider = 'gpt-4o' | 'claude-3-5-sonnet';

export interface LLMEvaluationResult {
  provider: LLMProvider;
  score: number; // 0-100
  categoryScores: {
    technicalAccuracy: number;
    problemSolving: number;
    communication: number;
    codeQuality: number;
  };
  strengths: string[];
  improvements: string[];
  recommendation: 'strong_hire' | 'hire' | 'maybe' | 'no_hire';
  rationale: string;
  confidence: number; // 0-1
}

export interface ArbitratedResult {
  finalScore: number;
  categoryScores: {
    technicalAccuracy: number;
    problemSolving: number;
    communication: number;
    codeQuality: number;
  };
  strengths: string[];
  improvements: string[];
  recommendation: 'strong_hire' | 'hire' | 'maybe' | 'no_hire';
  rationale: string;
  providerResults: LLMEvaluationResult[];
  arbitrationMethod: 'consensus' | 'weighted_average' | 'highest_confidence';
}

/**
 * Evaluate interview using GPT-4o
 */
async function evaluateWithGPT4o(
  interviewData: {
    voiceAnswers?: Array<{ question: string; answer: string; score?: number }>;
    mcqAnswers?: Array<{ question: string; correct: boolean; score?: number }>;
    codeAnswers?: Array<{ challenge: string; code: string; score?: number }>;
    candidateProfile: string;
  }
): Promise<LLMEvaluationResult> {
  try {
    logger.info('Evaluating interview with GPT-4o');

    const systemPrompt = buildEvaluationPrompt();
    const userPrompt = buildInterviewDataPrompt(interviewData);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from GPT-4o');
    }

    const evaluation = safeJsonParse<any>(content);
    if (!evaluation) {
      throw new Error('Failed to parse GPT-4o response');
    }

    return {
      provider: 'gpt-4o',
      score: normalizeScore(evaluation.overallScore),
      categoryScores: {
        technicalAccuracy: normalizeScore(evaluation.categoryScores?.technicalAccuracy),
        problemSolving: normalizeScore(evaluation.categoryScores?.problemSolving),
        communication: normalizeScore(evaluation.categoryScores?.communication),
        codeQuality: normalizeScore(evaluation.categoryScores?.codeQuality),
      },
      strengths: Array.isArray(evaluation.strengths) ? evaluation.strengths : [],
      improvements: Array.isArray(evaluation.improvements) ? evaluation.improvements : [],
      recommendation: normalizeRecommendation(evaluation.recommendation),
      rationale: evaluation.rationale || 'Evaluation completed',
      confidence: normalizeConfidence(evaluation.confidence),
    };
  } catch (error) {
    logger.error('Error evaluating with GPT-4o:', error);
    throw error;
  }
}

/**
 * Evaluate interview using Claude 3.5 Sonnet
 */
async function evaluateWithClaude(
  interviewData: {
    voiceAnswers?: Array<{ question: string; answer: string; score?: number }>;
    mcqAnswers?: Array<{ question: string; correct: boolean; score?: number }>;
    codeAnswers?: Array<{ challenge: string; code: string; score?: number }>;
    candidateProfile: string;
  }
): Promise<LLMEvaluationResult> {
  try {
    logger.info('Evaluating interview with Claude 3.5 Sonnet');

    const systemPrompt = buildEvaluationPrompt();
    const userPrompt = buildInterviewDataPrompt(interviewData);

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.3,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const evaluation = safeJsonParse<any>(content.text);
    if (!evaluation) {
      throw new Error('Failed to parse Claude response');
    }

    return {
      provider: 'claude-3-5-sonnet',
      score: normalizeScore(evaluation.overallScore),
      categoryScores: {
        technicalAccuracy: normalizeScore(evaluation.categoryScores?.technicalAccuracy),
        problemSolving: normalizeScore(evaluation.categoryScores?.problemSolving),
        communication: normalizeScore(evaluation.categoryScores?.communication),
        codeQuality: normalizeScore(evaluation.categoryScores?.codeQuality),
      },
      strengths: Array.isArray(evaluation.strengths) ? evaluation.strengths : [],
      improvements: Array.isArray(evaluation.improvements) ? evaluation.improvements : [],
      recommendation: normalizeRecommendation(evaluation.recommendation),
      rationale: evaluation.rationale || 'Evaluation completed',
      confidence: normalizeConfidence(evaluation.confidence),
    };
  } catch (error) {
    logger.error('Error evaluating with Claude:', error);
    throw error;
  }
}

/**
 * Build system prompt for evaluation
 */
function buildEvaluationPrompt(): string {
  return `You are an expert technical interviewer evaluating a candidate's interview performance.

Analyze the candidate's responses across all assessment components (voice, MCQ, code) and provide a comprehensive evaluation.

Rate the candidate on these dimensions (0-100):
1. Technical Accuracy: Correctness of answers, understanding of concepts
2. Problem Solving: Approach to problems, logical thinking, algorithm choice
3. Communication: Clarity of explanation, articulation of ideas
4. Code Quality: Clean code, best practices, maintainability (if applicable)

Provide:
- Overall score (0-100)
- Category-specific scores
- 3-5 key strengths
- 3-5 areas for improvement
- Hiring recommendation: strong_hire, hire, maybe, no_hire
- Detailed rationale for your recommendation
- Confidence level (0-1) in your assessment

Return ONLY valid JSON:
{
  "overallScore": 0-100,
  "categoryScores": {
    "technicalAccuracy": 0-100,
    "problemSolving": 0-100,
    "communication": 0-100,
    "codeQuality": 0-100
  },
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2", "improvement3"],
  "recommendation": "strong_hire|hire|maybe|no_hire",
  "rationale": "Detailed explanation of recommendation",
  "confidence": 0-1
}`;
}

/**
 * Build interview data prompt
 */
function buildInterviewDataPrompt(interviewData: {
  voiceAnswers?: Array<{ question: string; answer: string; score?: number }>;
  mcqAnswers?: Array<{ question: string; correct: boolean; score?: number }>;
  codeAnswers?: Array<{ challenge: string; code: string; score?: number }>;
  candidateProfile: string;
}): string {
  let prompt = `Candidate Profile:\n${interviewData.candidateProfile}\n\n`;

  if (interviewData.voiceAnswers && interviewData.voiceAnswers.length > 0) {
    prompt += `Voice Interview Responses (${interviewData.voiceAnswers.length} questions):\n`;
    interviewData.voiceAnswers.forEach((qa, idx) => {
      prompt += `\nQ${idx + 1}: ${qa.question}\n`;
      prompt += `A${idx + 1}: ${qa.answer}\n`;
      if (qa.score !== undefined) {
        prompt += `Score: ${qa.score}/100\n`;
      }
    });
    prompt += '\n';
  }

  if (interviewData.mcqAnswers && interviewData.mcqAnswers.length > 0) {
    const correct = interviewData.mcqAnswers.filter(a => a.correct).length;
    const total = interviewData.mcqAnswers.length;
    prompt += `MCQ Test Results: ${correct}/${total} correct (${Math.round((correct / total) * 100)}%)\n\n`;
  }

  if (interviewData.codeAnswers && interviewData.codeAnswers.length > 0) {
    prompt += `Coding Challenges (${interviewData.codeAnswers.length} problems):\n`;
    interviewData.codeAnswers.forEach((challenge, idx) => {
      prompt += `\nChallenge ${idx + 1}: ${challenge.challenge}\n`;
      prompt += `Solution:\n\`\`\`\n${challenge.code}\n\`\`\`\n`;
      if (challenge.score !== undefined) {
        prompt += `Score: ${challenge.score}/100\n`;
      }
    });
    prompt += '\n';
  }

  prompt += 'Evaluate this candidate now.';
  return prompt;
}

/**
 * Arbitrate results from multiple LLM evaluations
 */
function arbitrateResults(results: LLMEvaluationResult[]): ArbitratedResult {
  if (results.length === 0) {
    throw new Error('No evaluation results to arbitrate');
  }

  if (results.length === 1) {
    // Single result, no arbitration needed
    return {
      finalScore: results[0].score,
      categoryScores: results[0].categoryScores,
      strengths: results[0].strengths,
      improvements: results[0].improvements,
      recommendation: results[0].recommendation,
      rationale: results[0].rationale,
      providerResults: results,
      arbitrationMethod: 'consensus',
    };
  }

  // Multiple results - use weighted average based on confidence
  logger.info(`Arbitrating ${results.length} evaluation results`);

  const totalConfidence = results.reduce((sum, r) => sum + r.confidence, 0);
  
  // Calculate weighted average score
  const finalScore = Math.round(
    results.reduce((sum, r) => sum + r.score * r.confidence, 0) / totalConfidence
  );

  // Calculate weighted category scores
  const categoryScores = {
    technicalAccuracy: Math.round(
      results.reduce((sum, r) => sum + r.categoryScores.technicalAccuracy * r.confidence, 0) / totalConfidence
    ),
    problemSolving: Math.round(
      results.reduce((sum, r) => sum + r.categoryScores.problemSolving * r.confidence, 0) / totalConfidence
    ),
    communication: Math.round(
      results.reduce((sum, r) => sum + r.categoryScores.communication * r.confidence, 0) / totalConfidence
    ),
    codeQuality: Math.round(
      results.reduce((sum, r) => sum + r.categoryScores.codeQuality * r.confidence, 0) / totalConfidence
    ),
  };

  // Merge strengths and improvements (deduplicate)
  const allStrengths = results.flatMap(r => r.strengths);
  const strengths = [...new Set(allStrengths)].slice(0, 5);

  const allImprovements = results.flatMap(r => r.improvements);
  const improvements = [...new Set(allImprovements)].slice(0, 5);

  // Determine recommendation based on highest confidence result
  const highestConfidenceResult = results.reduce((prev, current) =>
    current.confidence > prev.confidence ? current : prev
  );

  // Build combined rationale
  const rationale = `Arbitrated evaluation from ${results.length} LLM providers. ${highestConfidenceResult.rationale}`;

  return {
    finalScore,
    categoryScores,
    strengths,
    improvements,
    recommendation: highestConfidenceResult.recommendation,
    rationale,
    providerResults: results,
    arbitrationMethod: 'weighted_average',
  };
}

/**
 * Evaluate interview using multiple LLMs with arbitration
 */
export async function evaluateWithMultiLLM(
  interviewData: {
    voiceAnswers?: Array<{ question: string; answer: string; score?: number }>;
    mcqAnswers?: Array<{ question: string; correct: boolean; score?: number }>;
    codeAnswers?: Array<{ challenge: string; code: string; score?: number }>;
    candidateProfile: string;
  },
  providers?: LLMProvider[]
): Promise<ArbitratedResult> {
  try {
    // Validate and filter providers
    const validProviders: LLMProvider[] = ['gpt-4o', 'claude-3-5-sonnet'];
    const configProviders = (config.multiLLM.providers || []) as string[];
    const selectedProviders = providers || configProviders
      .filter((p): p is LLMProvider => validProviders.includes(p as LLMProvider));
    
    if (selectedProviders.length === 0) {
      // Default to GPT-4o if no valid providers configured
      selectedProviders.push('gpt-4o');
    }

    logger.info(`Starting multi-LLM evaluation with providers: ${selectedProviders.join(', ')}`);

    // Run evaluations in parallel
    const evaluationPromises = selectedProviders.map(async (provider) => {
      try {
        if (provider === 'gpt-4o') {
          return await evaluateWithGPT4o(interviewData);
        } else if (provider === 'claude-3-5-sonnet') {
          return await evaluateWithClaude(interviewData);
        } else {
          logger.warn(`Unknown provider: ${provider}, skipping`);
          return null;
        }
      } catch (error) {
        logger.error(`Error evaluating with ${provider}:`, error);
        return null;
      }
    });

    const results = (await Promise.all(evaluationPromises)).filter(
      (r): r is LLMEvaluationResult => r !== null
    );

    if (results.length === 0) {
      throw new Error('All LLM evaluations failed');
    }

    // Arbitrate results
    const arbitratedResult = arbitrateResults(results);

    logger.info(
      `Multi-LLM evaluation complete. Final score: ${arbitratedResult.finalScore}, Recommendation: ${arbitratedResult.recommendation}`
    );

    return arbitratedResult;
  } catch (error) {
    logger.error('Error in multi-LLM evaluation:', error);
    throw error;
  }
}

/**
 * Normalize score to 0-100 range
 */
function normalizeScore(score: any): number {
  const num = typeof score === 'number' ? score : 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

/**
 * Normalize confidence to 0-1 range
 */
function normalizeConfidence(confidence: any): number {
  const num = typeof confidence === 'number' ? confidence : 0.8;
  return Math.max(0, Math.min(1, num));
}

/**
 * Normalize recommendation to valid values
 */
function normalizeRecommendation(recommendation: any): 'strong_hire' | 'hire' | 'maybe' | 'no_hire' {
  const rec = String(recommendation).toLowerCase();
  if (rec.includes('strong')) return 'strong_hire';
  if (rec.includes('hire') && !rec.includes('no')) return 'hire';
  if (rec.includes('no')) return 'no_hire';
  return 'maybe';
}

export const multiLLMArbiterService = {
  evaluateWithMultiLLM,
  evaluateWithGPT4o,
  evaluateWithClaude,
};
