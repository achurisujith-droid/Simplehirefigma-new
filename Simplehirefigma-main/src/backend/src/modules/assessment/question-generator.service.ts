/**
 * Question Generator Service
 * Generates voice interview questions based on resume analysis
 */

import logger from '../../config/logger';
import {
  QuestionGenerationContext,
  ResumeAnalysis,
  openaiService,
} from '../ai/openai.service';
import { ProfileClassification } from './profile-classifier.service';
import { v4 as uuidv4 } from 'uuid';

export interface VoiceQuestion {
  id: string;
  text: string;
  topic: string;
  isFollowUp: boolean;
  level: string;
  timestamp: number;
}

/**
 * Generate voice interview questions based on resume and profile
 */
export async function generateVoiceQuestions(
  analysis: ResumeAnalysis,
  classification: ProfileClassification,
  questionCount: number
): Promise<VoiceQuestion[]> {
  try {
    const questions: VoiceQuestion[] = [];
    const previousQuestions: Array<{ question: string }> = [];

    // Build resume summary for context
    const resumeSummary = buildResumeSummary(analysis);

    // Determine primary skill from classification
    const primarySkill =
      classification.keySkills[0] ||
      classification.primaryFrameworks[0] ||
      classification.primaryLanguages[0] ||
      analysis.candidateProfile.currentRole;

    // Determine difficulty level
    const level = mapExperienceToLevel(classification.yearsExperience);

    logger.info(
      `Generating ${questionCount} voice questions for ${primarySkill} at ${level} level`
    );

    // Generate questions one by one
    for (let i = 0; i < questionCount; i++) {
      const context: QuestionGenerationContext = {
        resumeSummary,
        extractedEntities: analysis.extractedEntities,
        primarySkill,
        yearsOfExp: classification.yearsExperience,
        level,
        totalQuestionsAsked: i,
        maxQuestions: questionCount,
        previousQuestions,
      };

      try {
        const generatedQuestion = await openaiService.generateNextQuestion(context);

        const question: VoiceQuestion = {
          id: uuidv4(),
          text: generatedQuestion.text,
          topic: generatedQuestion.topic,
          isFollowUp: generatedQuestion.isFollowUp || false,
          level,
          timestamp: Date.now(),
        };

        questions.push(question);
        previousQuestions.push({ question: generatedQuestion.text });

        logger.info(
          `Generated question ${i + 1}/${questionCount}: ${generatedQuestion.topic}`
        );
      } catch (error) {
        logger.error(`Error generating question ${i + 1}:`, error);
        // Add a fallback generic question
        questions.push({
          id: uuidv4(),
          text: `Tell me about your experience with ${primarySkill}.`,
          topic: primarySkill,
          isFollowUp: false,
          level,
          timestamp: Date.now(),
        });
      }
    }

    logger.info(`Successfully generated ${questions.length} voice questions`);
    return questions;
  } catch (error) {
    logger.error('Error generating voice questions:', error);
    throw error;
  }
}

/**
 * Build a concise resume summary for question generation context
 */
function buildResumeSummary(analysis: ResumeAnalysis): string {
  const parts: string[] = [];

  // Add profile summary
  parts.push(
    `${analysis.candidateProfile.name} - ${analysis.candidateProfile.currentRole} with ${analysis.candidateProfile.totalExperience} experience.`
  );

  // Add professional summary
  if (analysis.professionalSummary) {
    parts.push(analysis.professionalSummary);
  }

  // Add recent work experience (top 2)
  const recentExperience = analysis.workExperience.slice(0, 2);
  if (recentExperience.length > 0) {
    parts.push('\nRecent Experience:');
    recentExperience.forEach((exp) => {
      parts.push(`- ${exp.role} at ${exp.company} (${exp.duration})`);
    });
  }

  // Add key skills
  if (analysis.coreSkills.technical.length > 0) {
    parts.push(`\nKey Technical Skills: ${analysis.coreSkills.technical.slice(0, 10).join(', ')}`);
  }

  return parts.join('\n');
}

/**
 * Map years of experience to difficulty level
 */
function mapExperienceToLevel(
  yearsExperience: number
): 'entry' | 'mid' | 'senior' | 'executive' {
  if (yearsExperience < 2) return 'entry';
  if (yearsExperience < 5) return 'mid';
  if (yearsExperience < 10) return 'senior';
  return 'executive';
}

export const questionGeneratorService = {
  generateVoiceQuestions,
};
