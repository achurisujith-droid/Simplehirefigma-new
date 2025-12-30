/**
 * Multi-LLM Arbiter Service
 * Implements exact arbiter logic from elevenlabsgitcopilot
 * 
 * Three LLM calls:
 * 1. GPT-4o evaluation
 * 2. Claude Opus 4.5 evaluation
 * 3. GPT-4o arbiter (selects best evaluation)
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import config from '../../config';
import logger from '../../config/logger';
import { safeJsonParse } from '../../utils/security';
import * as fs from 'fs';
import * as path from 'path';

// Initialize clients
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

const anthropic = new Anthropic({
  apiKey: config.anthropic.apiKey,
});

// Load LLM configuration (cached at module load time)
let llmConfig: any;

// Default LLM configuration (fallback)
const DEFAULT_LLM_CONFIG = {
  version: '1.0.0',
  providers: {
    openai: {
      enabled: true,
      models: {
        'gpt-4o': {
          id: 'gpt-4o',
          name: 'GPT-4o',
          maxTokens: 4096,
          temperature: 0.3,
        },
      },
    },
    anthropic: {
      enabled: true,
      models: {
        'claude-opus-4-5-20251101': {
          id: 'claude-opus-4-5-20251101',
          name: 'Claude Opus 4.5',
          maxTokens: 4096,
          temperature: 0.3,
        },
      },
    },
  },
  evaluation: {
    parallelEvaluation: true,
    arbiterEnabled: true,
    arbiterProvider: 'openai',
    arbiterModel: 'gpt-4o',
    evaluationModels: [
      { provider: 'openai', model: 'gpt-4o' },
      { provider: 'anthropic', model: 'claude-opus-4-5-20251101' },
    ],
  },
  prompts: {
    evaluationSystem: 'You are an expert interviewer. Evaluate the candidate\'s interview performance based on the provided transcript and resume. Provide detailed scoring and feedback.',
    arbiterSystem: 'You are a senior hiring manager reviewing evaluations from multiple AI systems. Analyze both evaluations, select the most accurate and fair assessment, provide your rationale, and synthesize the best insights from both.',
  },
  scoringRubric: {
    categories: {
      technicalAccuracy: {
        weight: 0.35,
        description: 'Correctness and depth of technical knowledge',
        scale: { min: 0, max: 10 },
      },
      communicationClarity: {
        weight: 0.20,
        description: 'Clarity and articulation of responses',
        scale: { min: 0, max: 10 },
      },
      problemSolving: {
        weight: 0.25,
        description: 'Analytical thinking and approach to problems',
        scale: { min: 0, max: 10 },
      },
      experienceAlignment: {
        weight: 0.20,
        description: 'Alignment between resume and demonstrated knowledge',
        scale: { min: 0, max: 10 },
      },
    },
  },
};

function loadLLMConfig() {
  if (!llmConfig) {
    try {
      const configPath = path.join(__dirname, '../../../config/llm_config.json');
      llmConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      logger.info('LLM configuration loaded successfully from file');
    } catch (error) {
      logger.warn('Failed to load LLM config from file, using default configuration:', error);
      llmConfig = DEFAULT_LLM_CONFIG;
      logger.info('LLM configuration loaded from defaults');
    }
  }
  return llmConfig;
}

// Initialize config on module load
llmConfig = loadLLMConfig();

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface InterviewData {
  candidateProfile: string;
  voiceAnswers?: Array<{ question: string; answer: string; }>;
  mcqAnswers?: Array<{ question: string; selected: string; correct: boolean; }>;
  codeAnswers?: Array<{ question: string; code: string; language: string; }>;
}

export interface CategoryScores {
  [key: string]: number;
  technicalAccuracy: number;
  communicationClarity: number;
  problemSolving: number;
  experienceAlignment: number;
}

export interface LLMEvaluationResult {
  provider: string;
  model: string;
  score: number;
  categoryScores: CategoryScores;
  strengths: string[];
  areasForImprovement: string[];
  summary: string;
  recommendation: 'strong_hire' | 'hire' | 'maybe_hire' | 'no_hire';
  content: string; // Raw response content
  latencyMs: number;
}

export interface ArbiterDecision {
  selectedEvaluationIndex: number;
  selectedProvider: string;
  rationale: string;
  finalScore: number;
  finalCategoryScores: CategoryScores;
  finalStrengths: string[];
  finalAreasForImprovement: string[];
  finalSummary: string;
  finalRecommendation: 'strong_hire' | 'hire' | 'maybe_hire' | 'no_hire';
  confidenceLevel: 'high' | 'medium' | 'low';
  evaluationAgreement: string;
}

export interface ArbitratedResult {
  selectedEvaluationIndex: number;
  selectedProvider: string;
  rationale: string;
  
  finalScore: number;
  categoryScores: CategoryScores;
  
  strengths: string[];
  improvements: string[];
  summary: string;
  recommendation: 'strong_hire' | 'hire' | 'maybe_hire' | 'no_hire';
  
  confidenceLevel: 'high' | 'medium' | 'low';
  evaluationAgreement: string;
  
  providerResults: LLMEvaluationResult[];
  arbiterSkipped: boolean;
  arbitrationMethod: 'consensus' | 'arbiter_selection';
  
  arbiterProvider?: string;
  arbiterModel?: string;
  arbiterLatencyMs?: number;
}

// ============================================================================
// Prompt Building Functions
// ============================================================================

function buildEvaluationPrompt(interviewData: InterviewData): Array<{ role: string; content: string }> {
  const voiceText = interviewData.voiceAnswers
    ?.map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`)
    .join('\n\n') || 'No voice interview data';

  const mcqText = interviewData.mcqAnswers
    ?.map((qa, i) => `Q${i + 1}: ${qa.question}\nSelected: ${qa.selected} ${qa.correct ? '✓' : '✗'}`)
    .join('\n\n') || 'No MCQ data';

  const codeText = interviewData.codeAnswers
    ?.map((qa, i) => `Challenge ${i + 1}: ${qa.question}\nLanguage: ${qa.language}\nCode:\n${qa.code}`)
    .join('\n\n') || 'No coding challenge data';

  return [
    {
      role: 'system',
      content: llmConfig.prompts.evaluationSystem,
    },
    {
      role: 'user',
      content: `Candidate Profile:
${interviewData.candidateProfile}

Voice Interview Responses:
${voiceText}

MCQ Test Results:
${mcqText}

Coding Challenges:
${codeText}

Scoring Rubric:
${JSON.stringify(llmConfig.scoringRubric, null, 2)}

Please evaluate this interview and provide your assessment as JSON:
{
  "score": <number 0-100>,
  "categoryScores": {
    "technicalAccuracy": <number 0-10>,
    "communicationClarity": <number 0-10>,
    "problemSolving": <number 0-10>,
    "experienceAlignment": <number 0-10>
  },
  "strengths": ["strength1", "strength2", ...],
  "areasForImprovement": ["area1", "area2", ...],
  "summary": "<detailed feedback paragraph>",
  "recommendation": "strong_hire|hire|maybe_hire|no_hire"
}`,
    },
  ];
}

function buildArbiterPrompt(
  evaluations: LLMEvaluationResult[],
  originalData: InterviewData
): Array<{ role: string; content: string }> {
  const evaluationsText = evaluations
    .map((evaluation, idx) => {
      return `=== Evaluation ${idx + 1} (${evaluation.provider} - ${evaluation.model}) ===
Response:
${evaluation.content}

Latency: ${evaluation.latencyMs}ms
`;
    })
    .join('\n\n');

  const voiceText = originalData.voiceAnswers
    ?.map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`)
    .join('\n\n') || 'No voice interview data';

  const mcqText = originalData.mcqAnswers
    ?.map((qa, i) => `Q${i + 1}: ${qa.question}\nSelected: ${qa.selected} ${qa.correct ? '✓' : '✗'}`)
    .join('\n\n') || 'No MCQ data';

  const codeText = originalData.codeAnswers
    ?.map((qa, i) => `Challenge ${i + 1}: ${qa.question}\nLanguage: ${qa.language}\nCode:\n${qa.code}`)
    .join('\n\n') || 'No coding challenge data';

  return [
    {
      role: 'system',
      content: llmConfig.prompts.arbiterSystem,
    },
    {
      role: 'user',
      content: `You are reviewing interview evaluations from multiple AI systems.

ORIGINAL INTERVIEW DATA:
Candidate: ${originalData.candidateProfile}

Interview Responses:
Voice Answers: ${voiceText}
MCQ Answers: ${mcqText}
Code Answers: ${codeText}

EVALUATIONS FROM AI SYSTEMS:
${evaluationsText}

SCORING RUBRIC USED:
${JSON.stringify(llmConfig.scoringRubric, null, 2)}

Please analyze both evaluations and provide your arbiter decision as JSON:
{
  "selectedEvaluationIndex": <0 or 1 - which evaluation is better>,
  "selectedProvider": "<provider name of selected evaluation>",
  "rationale": "<detailed explanation of why this evaluation was selected, noting any discrepancies or concerns with the other>",
  "finalScore": <number 0-100>,
  "finalCategoryScores": {
    "technicalAccuracy": <number 0-10>,
    "communicationClarity": <number 0-10>,
    "problemSolving": <number 0-10>,
    "experienceAlignment": <number 0-10>
  },
  "finalStrengths": ["strength1", "strength2", ...],
  "finalAreasForImprovement": ["area1", "area2", ...],
  "finalSummary": "<synthesized feedback combining insights from both evaluations>",
  "finalRecommendation": "strong_hire|hire|maybe_hire|no_hire",
  "confidenceLevel": "high|medium|low",
  "evaluationAgreement": "<description of how much the evaluations agreed or disagreed>"
}`,
    },
  ];
}

// ============================================================================
// LLM Evaluation Functions
// ============================================================================

async function evaluateWithGPT4o(
  interviewData: InterviewData
): Promise<LLMEvaluationResult> {
  const startTime = Date.now();
  
  try {
    logger.info('Starting GPT-4o evaluation');
    
    const messages = buildEvaluationPrompt(interviewData);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages as any,
      temperature: llmConfig.providers.openai.models['gpt-4o'].temperature,
      max_tokens: llmConfig.providers.openai.models['gpt-4o'].maxTokens,
    });

    const latencyMs = Date.now() - startTime;
    const content = response.choices[0]?.message?.content || '';
    
    logger.info(`GPT-4o evaluation completed in ${latencyMs}ms`);

    // Parse the JSON response
    const evaluation = safeJsonParse<any>(content);
    
    if (!evaluation || !evaluation.categoryScores) {
      throw new Error('Invalid evaluation format from GPT-4o');
    }

    return {
      provider: 'openai',
      model: 'gpt-4o',
      score: evaluation.score || 0,
      categoryScores: evaluation.categoryScores,
      strengths: evaluation.strengths || [],
      areasForImprovement: evaluation.areasForImprovement || [],
      summary: evaluation.summary || '',
      recommendation: evaluation.recommendation || 'maybe_hire',
      content,
      latencyMs,
    };
  } catch (error) {
    logger.error('Error in GPT-4o evaluation:', error);
    throw error;
  }
}

async function evaluateWithClaudeOpus(
  interviewData: InterviewData
): Promise<LLMEvaluationResult> {
  const startTime = Date.now();
  
  try {
    logger.info('Starting Claude Opus 4.5 evaluation');
    
    const messages = buildEvaluationPrompt(interviewData);
    
    // Claude expects messages without system in the array
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const userMessages = messages.filter(m => m.role !== 'system');
    
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: llmConfig.providers.anthropic.models['claude-opus-4-5-20251101'].maxTokens,
      temperature: llmConfig.providers.anthropic.models['claude-opus-4-5-20251101'].temperature,
      system: systemMessage,
      messages: userMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const latencyMs = Date.now() - startTime;
    const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
    
    logger.info(`Claude Opus evaluation completed in ${latencyMs}ms`);

    // Parse the JSON response
    const evaluation = safeJsonParse<any>(content);
    
    if (!evaluation || !evaluation.categoryScores) {
      throw new Error('Invalid evaluation format from Claude Opus');
    }

    return {
      provider: 'anthropic',
      model: 'claude-opus-4-5-20251101',
      score: evaluation.score || 0,
      categoryScores: evaluation.categoryScores,
      strengths: evaluation.strengths || [],
      areasForImprovement: evaluation.areasForImprovement || [],
      summary: evaluation.summary || '',
      recommendation: evaluation.recommendation || 'maybe_hire',
      content,
      latencyMs,
    };
  } catch (error) {
    logger.error('Error in Claude Opus evaluation:', error);
    throw error;
  }
}

// ============================================================================
// Arbiter Function
// ============================================================================

async function runArbiter(
  evaluations: LLMEvaluationResult[],
  originalData: InterviewData
): Promise<ArbitratedResult> {
  // If only one evaluation, skip arbiter
  if (evaluations.length === 1) {
    logger.info('Single evaluation available - skipping arbiter');
    return {
      selectedEvaluationIndex: 0,
      selectedProvider: evaluations[0].provider,
      rationale: 'Single evaluation available - used directly',
      arbiterSkipped: true,
      arbitrationMethod: 'consensus',
      
      finalScore: evaluations[0].score,
      categoryScores: evaluations[0].categoryScores,
      strengths: evaluations[0].strengths,
      improvements: evaluations[0].areasForImprovement,
      summary: evaluations[0].summary,
      recommendation: evaluations[0].recommendation,
      
      confidenceLevel: 'medium',
      evaluationAgreement: 'N/A - single evaluation',
      
      providerResults: evaluations,
    };
  }

  const startTime = Date.now();
  
  try {
    logger.info('Starting arbiter evaluation');
    
    // Build arbiter prompt comparing both evaluations
    const arbiterPrompt = buildArbiterPrompt(evaluations, originalData);
    
    // Make THIRD LLM call to GPT-4o arbiter
    const arbiterResult = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: arbiterPrompt as any,
      temperature: 0.3,
      max_tokens: 2000,
    });

    const latencyMs = Date.now() - startTime;
    const content = arbiterResult.choices[0]?.message?.content || '';
    
    logger.info(`Arbiter evaluation completed in ${latencyMs}ms`);

    // Parse arbiter decision
    const arbiterDecision = safeJsonParse<ArbiterDecision>(content);

    if (!arbiterDecision || arbiterDecision.selectedEvaluationIndex === undefined) {
      throw new Error('Invalid arbiter decision format');
    }

    // Return arbiter's selected evaluation
    return {
      selectedEvaluationIndex: arbiterDecision.selectedEvaluationIndex,
      selectedProvider: arbiterDecision.selectedProvider,
      rationale: arbiterDecision.rationale,
      
      finalScore: arbiterDecision.finalScore,
      categoryScores: arbiterDecision.finalCategoryScores,
      strengths: arbiterDecision.finalStrengths,
      improvements: arbiterDecision.finalAreasForImprovement,
      summary: arbiterDecision.finalSummary,
      recommendation: arbiterDecision.finalRecommendation,
      
      confidenceLevel: arbiterDecision.confidenceLevel,
      evaluationAgreement: arbiterDecision.evaluationAgreement,
      
      providerResults: evaluations,
      arbiterSkipped: false,
      arbitrationMethod: 'arbiter_selection',
      
      arbiterProvider: 'openai',
      arbiterModel: 'gpt-4o',
      arbiterLatencyMs: latencyMs,
    };
  } catch (error) {
    logger.error('Error in arbiter evaluation:', error);
    
    // Fallback: use first evaluation
    logger.warn('Arbiter failed, falling back to first evaluation');
    return {
      selectedEvaluationIndex: 0,
      selectedProvider: evaluations[0].provider,
      rationale: 'Arbiter failed - using first evaluation as fallback',
      arbiterSkipped: true,
      arbitrationMethod: 'consensus',
      
      finalScore: evaluations[0].score,
      categoryScores: evaluations[0].categoryScores,
      strengths: evaluations[0].strengths,
      improvements: evaluations[0].areasForImprovement,
      summary: evaluations[0].summary,
      recommendation: evaluations[0].recommendation,
      
      confidenceLevel: 'low',
      evaluationAgreement: 'Unknown - arbiter failed',
      
      providerResults: evaluations,
    };
  }
}

// ============================================================================
// Main Multi-LLM Evaluation Function
// ============================================================================

export async function evaluateWithMultiLLM(
  interviewData: InterviewData
): Promise<ArbitratedResult> {
  try {
    logger.info('Starting multi-LLM evaluation with arbiter');

    // Check if multi-LLM is enabled
    if (!config.multiLLM.enabled) {
      logger.info('Multi-LLM disabled, using single GPT-4o evaluation');
      const evaluation = await evaluateWithGPT4o(interviewData);
      return runArbiter([evaluation], interviewData);
    }

    // Run evaluations in parallel with graceful error handling
    const evaluationPromises: Promise<LLMEvaluationResult>[] = [];
    
    // Always run GPT-4o
    evaluationPromises.push(evaluateWithGPT4o(interviewData));
    
    // Run Claude Opus if configured
    if (config.multiLLM.providers.includes('claude-opus-4-5-20251101')) {
      evaluationPromises.push(evaluateWithClaudeOpus(interviewData));
    }

    // Wait for all evaluations to complete, handling partial failures
    const results = await Promise.allSettled(evaluationPromises);
    
    // Filter successful evaluations
    const evaluations = results
      .filter((result): result is PromiseFulfilledResult<LLMEvaluationResult> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);
    
    // Log any failures
    const failures = results.filter(result => result.status === 'rejected');
    if (failures.length > 0) {
      logger.warn(`${failures.length} evaluation(s) failed:`, failures);
    }
    
    // Ensure we have at least one successful evaluation
    if (evaluations.length === 0) {
      throw new Error('All LLM evaluations failed');
    }
    
    logger.info(`Completed ${evaluations.length} evaluations, running arbiter`);

    // Run arbiter to select best evaluation
    const result = await runArbiter(evaluations, interviewData);
    
    logger.info(
      `Multi-LLM evaluation complete. Selected: ${result.selectedProvider}, Score: ${result.finalScore}`
    );

    return result;
  } catch (error) {
    logger.error('Error in multi-LLM evaluation:', error);
    throw error;
  }
}

export const multiLLMArbiterService = {
  evaluateWithMultiLLM,
  evaluateWithGPT4o,
  evaluateWithClaudeOpus,
};
