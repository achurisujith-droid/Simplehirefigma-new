/**
 * MCQ Generator Service
 * Ported from elevenlabsgitcopilot/src/services/generators/mcqGenerator.ts
 * Generates multiple choice questions based on profile classification
 */

import OpenAI from 'openai';
import config from '../../config';
import logger from '../../config/logger';
import { safeJsonParse } from '../../utils/security';
import { ProfileClassification, RoleCategory } from './profile-classifier.service';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

export type MCQDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface MCQQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  skillCategory: string;
  difficulty: MCQDifficulty;
  explanation?: string;
}

/**
 * Determine MCQ difficulty based on years of experience
 */
function determineMCQDifficulty(yearsExperience: number): MCQDifficulty {
  if (yearsExperience <= 2) return 'EASY';
  if (yearsExperience <= 6) return 'MEDIUM';
  return 'HARD';
}

/**
 * Get topic list based on role category and skills
 */
function getTopicsForRole(
  classification: ProfileClassification
): string[] {
  const { roleCategory, keySkills, primaryLanguages, primaryFrameworks } = classification;
  
  const topics: string[] = [];
  
  // Add primary skills
  topics.push(...keySkills.slice(0, 3));
  
  // Add languages and frameworks
  if (primaryLanguages.length > 0) {
    topics.push(...primaryLanguages.slice(0, 2));
  }
  if (primaryFrameworks.length > 0) {
    topics.push(...primaryFrameworks.slice(0, 2));
  }
  
  // Add role-specific topics
  const roleTopics: Record<RoleCategory, string[]> = {
    software_dev: ['algorithms', 'data structures', 'software design patterns', 'web development'],
    qa_manual: ['testing methodologies', 'test planning', 'bug tracking', 'QA best practices'],
    qa_automation_sdet: ['test automation', 'selenium', 'API testing', 'CI/CD pipelines'],
    data_ml: ['machine learning', 'data analysis', 'SQL', 'statistics', 'data visualization'],
    devops_sre: ['containerization', 'kubernetes', 'CI/CD', 'monitoring', 'cloud platforms'],
    analytics_bi: ['SQL', 'data modeling', 'business intelligence tools', 'reporting'],
    product_manager: ['product strategy', 'agile methodologies', 'user research', 'roadmap planning'],
    business_analyst: ['requirements gathering', 'process analysis', 'data analysis', 'documentation'],
    support_infra: ['troubleshooting', 'system administration', 'networking', 'customer support'],
    non_tech: ['communication', 'project management', 'stakeholder management'],
    mixed_unclear: ['problem solving', 'teamwork', 'analytical thinking'],
  };
  
  const categoryTopics = roleTopics[roleCategory] || [];
  topics.push(...categoryTopics);
  
  // Return unique topics, limit to 8
  return [...new Set(topics)].slice(0, 8);
}

/**
 * Generate fallback questions if LLM fails
 */
function getFallbackQuestions(
  topics: string[],
  difficulty: MCQDifficulty,
  count: number
): MCQQuestion[] {
  const fallbackQuestions: MCQQuestion[] = [];
  
  for (let i = 0; i < count; i++) {
    const topic = topics[i % topics.length];
    fallbackQuestions.push({
      id: uuidv4(),
      questionText: `What is your experience level with ${topic}?`,
      options: [
        'No experience',
        'Basic knowledge',
        'Intermediate level',
        'Expert level'
      ],
      correctAnswerIndex: 2,
      skillCategory: topic,
      difficulty,
    });
  }
  
  return fallbackQuestions;
}

/**
 * Generate MCQ questions using GPT-4o
 */
export async function generateMCQQuestions(
  classification: ProfileClassification,
  questionCount: number,
  difficulty?: MCQDifficulty,
  customTopics?: string[]
): Promise<MCQQuestion[]> {
  try {
    const mcqDifficulty = difficulty || determineMCQDifficulty(classification.yearsExperience);
    const topics = customTopics || getTopicsForRole(classification);
    
    logger.info(
      `Generating ${questionCount} MCQ questions at ${mcqDifficulty} level for topics: ${topics.join(', ')}`
    );
    
    // Build system prompt for MCQ generation
    const systemPrompt = `You are an expert technical interviewer creating multiple choice questions.

Generate ${questionCount} multiple choice questions for a ${classification.roleCategory} candidate with ${classification.yearsExperience} years of experience.

Difficulty level: ${mcqDifficulty}
Topics to cover: ${topics.join(', ')}

Requirements:
- Each question must have exactly 4 options
- One option must be clearly correct
- Other options should be plausible but incorrect
- Questions should test practical knowledge, not just definitions
- ${mcqDifficulty === 'EASY' ? 'Focus on fundamental concepts' : mcqDifficulty === 'MEDIUM' ? 'Include practical scenarios and common patterns' : 'Include advanced concepts, edge cases, and architecture decisions'}
- Vary the topics across questions

Return ONLY valid JSON array:
[
  {
    "questionText": "The question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswerIndex": 0-3,
    "skillCategory": "The specific skill being tested",
    "explanation": "Brief explanation of why the correct answer is right"
  }
]`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Generate ${questionCount} MCQ questions now.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      logger.warn('No response from OpenAI for MCQ generation, using fallback');
      return getFallbackQuestions(topics, mcqDifficulty, questionCount);
    }

    // Parse the response
    const questionsData = safeJsonParse<any[]>(content);
    if (!questionsData || !Array.isArray(questionsData)) {
      logger.warn('Failed to parse MCQ response, using fallback');
      return getFallbackQuestions(topics, mcqDifficulty, questionCount);
    }

    // Transform and validate questions
    const questions: MCQQuestion[] = questionsData.map((q, index) => ({
      id: uuidv4(),
      questionText: q.questionText || `Question ${index + 1}`,
      options: Array.isArray(q.options) && q.options.length === 4 
        ? q.options 
        : ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswerIndex: typeof q.correctAnswerIndex === 'number' && q.correctAnswerIndex >= 0 && q.correctAnswerIndex <= 3
        ? q.correctAnswerIndex
        : 0,
      skillCategory: q.skillCategory || topics[index % topics.length],
      difficulty: mcqDifficulty,
      explanation: q.explanation,
    }));

    // Ensure we have the right number of questions
    if (questions.length < questionCount) {
      const additionalQuestions = getFallbackQuestions(
        topics,
        mcqDifficulty,
        questionCount - questions.length
      );
      questions.push(...additionalQuestions);
    }

    logger.info(`Successfully generated ${questions.length} MCQ questions`);
    return questions.slice(0, questionCount);
  } catch (error) {
    logger.error('Error generating MCQ questions:', error);
    const topics = customTopics || getTopicsForRole(classification);
    const mcqDifficulty = difficulty || determineMCQDifficulty(classification.yearsExperience);
    return getFallbackQuestions(topics, mcqDifficulty, questionCount);
  }
}

export const mcqGeneratorService = {
  generateMCQQuestions,
  determineMCQDifficulty,
};
