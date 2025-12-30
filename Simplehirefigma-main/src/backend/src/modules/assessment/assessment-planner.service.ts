/**
 * Assessment Planner Service
 * Ported from elevenlabsgitcopilot/unified-assessment-service.js lines 234-342
 * Implements decision rules for voice, MCQ, and code components
 */

import logger from '../../config/logger';
import { ProfileClassification, RoleCategory } from './profile-classifier.service';

export type AssessmentComponent = 'VOICE' | 'MCQ' | 'CODE';

export interface QuestionCounts {
  voice: number;
  mcq: number;
  code: number;
}

export interface AssessmentPlan {
  components: AssessmentComponent[];
  questionCounts: QuestionCounts;
  duration: number; // in minutes
  difficulty: 'entry' | 'mid' | 'senior' | 'executive';
  rationale: string;
}

/**
 * Determine which assessment components to enable based on profile
 * CRITICAL BUSINESS RULES from elevenlabsgitcopilot
 */
function determineComponents(classification: ProfileClassification): AssessmentComponent[] {
  const components: AssessmentComponent[] = [];
  const { roleCategory, codingExpected, recentCoding, yearsExperience, primaryLanguages } =
    classification;

  // VOICE: Always enabled
  components.push('VOICE');

  // MCQ enabled for these categories
  const mcqEnabledCategories: RoleCategory[] = [
    'software_dev',
    'qa_manual',
    'qa_automation_sdet',
    'data_ml',
    'devops_sre',
    'analytics_bi',
    'product_manager',
    'business_analyst',
  ];

  if (mcqEnabledCategories.includes(roleCategory)) {
    components.push('MCQ');
  }

  // CODE enabled: software_dev, qa_automation_sdet, data_ml
  // AND codingExpected=true AND recentCoding=true AND yearsExperience>=0.5
  const codeCategories: RoleCategory[] = ['software_dev', 'qa_automation_sdet', 'data_ml'];

  if (codeCategories.includes(roleCategory)) {
    if (codingExpected && recentCoding && yearsExperience >= 0.5) {
      components.push('CODE');
    } else {
      logger.info(
        `CODE not enabled for ${roleCategory}: codingExpected=${codingExpected}, recentCoding=${recentCoding}, yearsExperience=${yearsExperience}`
      );
    }
  }

  // Special case: devops_sre - CODE only if has programming languages
  if (roleCategory === 'devops_sre') {
    if (
      primaryLanguages &&
      primaryLanguages.length > 0 &&
      codingExpected &&
      recentCoding &&
      yearsExperience >= 0.5
    ) {
      components.push('CODE');
      logger.info(
        `CODE enabled for devops_sre with programming languages: ${primaryLanguages.join(', ')}`
      );
    }
  }

  return components;
}

/**
 * Determine question counts based on experience level
 * Voice: 8 (entry), 10 (mid), 12 (senior)
 * MCQ: 20 if enabled, 0 otherwise
 * Code: 2 (entry), 3 (mid/senior) if enabled, 0 otherwise
 */
function determineQuestionCounts(
  components: AssessmentComponent[],
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive'
): QuestionCounts {
  const counts: QuestionCounts = {
    voice: 0,
    mcq: 0,
    code: 0,
  };

  // Voice questions based on experience level
  if (components.includes('VOICE')) {
    switch (experienceLevel) {
      case 'entry':
        counts.voice = 8;
        break;
      case 'mid':
        counts.voice = 10;
        break;
      case 'senior':
      case 'executive':
        counts.voice = 12;
        break;
    }
  }

  // MCQ: 20 if enabled
  if (components.includes('MCQ')) {
    counts.mcq = 20;
  }

  // Code: 2 (entry), 3 (mid/senior) if enabled
  if (components.includes('CODE')) {
    counts.code = experienceLevel === 'entry' ? 2 : 3;
  }

  return counts;
}

/**
 * Calculate estimated duration in minutes
 */
function calculateDuration(questionCounts: QuestionCounts): number {
  let duration = 0;

  // Voice: ~2 minutes per question
  duration += questionCounts.voice * 2;

  // MCQ: ~1 minute per question
  duration += questionCounts.mcq * 1;

  // Code: ~20 minutes per challenge
  duration += questionCounts.code * 20;

  // Add buffer time
  duration = Math.ceil(duration * 1.1); // 10% buffer

  return duration;
}

/**
 * Map years of experience to difficulty level
 */
function mapExperienceToLevel(yearsExperience: number): 'entry' | 'mid' | 'senior' | 'executive' {
  if (yearsExperience < 2) return 'entry';
  if (yearsExperience < 5) return 'mid';
  if (yearsExperience < 10) return 'senior';
  return 'executive';
}

/**
 * Plan assessment based on profile classification
 */
export function planAssessment(classification: ProfileClassification): AssessmentPlan {
  try {
    // Determine experience level
    const difficulty = mapExperienceToLevel(classification.yearsExperience);

    // Determine which components to include
    const components = determineComponents(classification);

    // Determine question counts
    const questionCounts = determineQuestionCounts(components, difficulty);

    // Calculate duration
    const duration = calculateDuration(questionCounts);

    // Generate rationale
    const rationale = generateRationale(classification, components, questionCounts, difficulty);

    const plan: AssessmentPlan = {
      components,
      questionCounts,
      duration,
      difficulty,
      rationale,
    };

    logger.info(
      `Assessment plan created: ${components.join('+')} | Voice:${questionCounts.voice} MCQ:${questionCounts.mcq} Code:${questionCounts.code} | ${duration}min`
    );

    return plan;
  } catch (error) {
    logger.error('Error planning assessment:', error);
    throw error;
  }
}

/**
 * Generate human-readable rationale for the assessment plan
 */
function generateRationale(
  classification: ProfileClassification,
  components: AssessmentComponent[],
  questionCounts: QuestionCounts,
  difficulty: string
): string {
  const parts: string[] = [];

  parts.push(
    `Role classified as ${classification.roleCategory} with ${classification.yearsExperience} years of experience (${difficulty} level).`
  );

  parts.push(`Assessment includes: ${components.join(', ')}.`);

  if (components.includes('VOICE')) {
    parts.push(`Voice interview: ${questionCounts.voice} questions.`);
  }

  if (components.includes('MCQ')) {
    parts.push(`MCQ test: ${questionCounts.mcq} questions.`);
  }

  if (components.includes('CODE')) {
    parts.push(`Coding challenge: ${questionCounts.code} problems.`);
  } else if (
    ['software_dev', 'qa_automation_sdet', 'data_ml'].includes(classification.roleCategory)
  ) {
    if (!classification.codingExpected) {
      parts.push('Coding challenge excluded: no coding expected in this role.');
    } else if (!classification.recentCoding) {
      parts.push('Coding challenge excluded: no recent coding activity detected.');
    } else if (classification.yearsExperience < 0.5) {
      parts.push('Coding challenge excluded: insufficient experience (<6 months).');
    }
  }

  return parts.join(' ');
}

export const assessmentPlannerService = {
  planAssessment,
};
