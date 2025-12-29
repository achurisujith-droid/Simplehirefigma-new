/**
 * Component Evaluator Service
 * Ported from elevenlabsgitcopilot/src/services/evaluation/componentEvaluator.ts
 * Evaluates MCQ answers and coding challenge submissions
 */

import OpenAI from 'openai';
import config from '../../config';
import logger from '../../config/logger';
import { safeJsonParse } from '../../utils/security';

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

export interface MCQEvaluation {
  isCorrect: boolean;
  feedback: string;
  rawScore: number;
}

export interface CodeEvaluationDimensions {
  correctness: number; // 0-10
  problemSolving: number; // 0-10
  codeQuality: number; // 0-10
  completeness: number; // 0-10
}

export interface CodeEvaluation {
  dimensions: CodeEvaluationDimensions;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

/**
 * Evaluate MCQ answer
 */
export async function evaluateMCQAnswer(
  questionText: string,
  options: string[],
  correctAnswerIndex: number,
  selectedAnswerIndex: number
): Promise<MCQEvaluation> {
  try {
    const isCorrect = selectedAnswerIndex === correctAnswerIndex;
    
    // Generate feedback
    const correctOption = options[correctAnswerIndex];
    const selectedOption = options[selectedAnswerIndex];
    
    let feedback: string;
    if (isCorrect) {
      feedback = `Correct! ${correctOption} is the right answer.`;
    } else {
      feedback = `Incorrect. You selected: ${selectedOption}. The correct answer is: ${correctOption}.`;
    }
    
    // Log for analytics (questionText is used here for future enhancements)
    logger.debug(`MCQ evaluation for question: ${questionText.substring(0, 50)}...`);
    
    return {
      isCorrect,
      feedback,
      rawScore: isCorrect ? 1 : 0,
    };
  } catch (error) {
    logger.error('Error evaluating MCQ answer:', error);
    return {
      isCorrect: false,
      feedback: 'Error evaluating answer',
      rawScore: 0,
    };
  }
}

/**
 * Evaluate code submission using LLM
 */
export async function evaluateCodeAnswer(
  questionText: string,
  language: string,
  evaluationCriteria: string[],
  codeSubmission: string
): Promise<CodeEvaluation> {
  try {
    logger.info(`Evaluating code submission for language: ${language}`);
    
    // Build evaluation prompt
    const systemPrompt = `You are an expert code reviewer evaluating a candidate's coding challenge submission.

Question:
${questionText}

Language: ${language}

Evaluation Criteria:
${evaluationCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Evaluate the submission on these dimensions (rate each 0-10):
1. Correctness: Does the code solve the problem correctly? Does it handle edge cases?
2. Problem Solving: Is the approach logical and efficient? Good algorithm choice?
3. Code Quality: Is the code clean, readable, and well-structured? Good naming?
4. Completeness: Is the solution complete? Are all requirements met?

Return ONLY valid JSON:
{
  "dimensions": {
    "correctness": 0-10,
    "problemSolving": 0-10,
    "codeQuality": 0-10,
    "completeness": 0-10
  },
  "feedback": "Overall assessment in 2-3 sentences",
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"]
}`;

    const userPrompt = `Candidate's Code Submission:
\`\`\`${language}
${codeSubmission}
\`\`\`

Evaluate this code now.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      logger.warn('No response from OpenAI for code evaluation');
      return getDefaultCodeEvaluation();
    }

    // Parse the response
    const evaluation = safeJsonParse<any>(content);
    if (!evaluation || !evaluation.dimensions) {
      logger.warn('Failed to parse code evaluation response');
      return getDefaultCodeEvaluation();
    }

    // Validate and normalize dimensions
    const dimensions: CodeEvaluationDimensions = {
      correctness: normalizeScore(evaluation.dimensions.correctness),
      problemSolving: normalizeScore(evaluation.dimensions.problemSolving),
      codeQuality: normalizeScore(evaluation.dimensions.codeQuality),
      completeness: normalizeScore(evaluation.dimensions.completeness),
    };

    return {
      dimensions,
      feedback: evaluation.feedback || 'Code evaluated successfully.',
      strengths: Array.isArray(evaluation.strengths) ? evaluation.strengths : [],
      improvements: Array.isArray(evaluation.improvements) ? evaluation.improvements : [],
    };
  } catch (error) {
    logger.error('Error evaluating code submission:', error);
    return getDefaultCodeEvaluation();
  }
}

/**
 * Calculate weighted code score from dimensions
 * Weights: 40% correctness + 30% problemSolving + 20% codeQuality + 10% completeness
 */
export function calculateCodeScore(evaluation: CodeEvaluation): number {
  const { correctness, problemSolving, codeQuality, completeness } = evaluation.dimensions;
  
  const weightedScore =
    correctness * 0.4 +
    problemSolving * 0.3 +
    codeQuality * 0.2 +
    completeness * 0.1;
  
  // Convert to 0-100 scale
  return Math.round((weightedScore / 10) * 100);
}

/**
 * Normalize score to 0-10 range
 */
function normalizeScore(score: any): number {
  const num = typeof score === 'number' ? score : 0;
  return Math.max(0, Math.min(10, num));
}

/**
 * Get default code evaluation in case of errors
 */
function getDefaultCodeEvaluation(): CodeEvaluation {
  return {
    dimensions: {
      correctness: 5,
      problemSolving: 5,
      codeQuality: 5,
      completeness: 5,
    },
    feedback: 'Code submission received and reviewed.',
    strengths: ['Submitted code'],
    improvements: ['Consider edge cases', 'Improve code documentation'],
  };
}

export const componentEvaluatorService = {
  evaluateMCQAnswer,
  evaluateCodeAnswer,
  calculateCodeScore,
};
