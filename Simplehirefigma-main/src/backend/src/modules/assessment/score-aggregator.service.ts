/**
 * Score Aggregator Service
 * Ported from elevenlabsgitcopilot/src/services/evaluation/scoreAggregator.ts
 * Aggregates scores from different assessment components
 */

import logger from '../../config/logger';

export type SkillLevel = 'BEGINNER' | 'JUNIOR' | 'INTERMEDIATE' | 'SENIOR' | 'EXPERT';

export interface ComponentScore {
  component: 'VOICE' | 'MCQ' | 'CODE';
  score: number; // 0-100
  weight: number; // 0-1
}

export interface AggregatedScore {
  overallScore: number; // 0-100
  level: SkillLevel;
  componentScores: ComponentScore[];
  strengths: string[];
  areasForImprovement: string[];
}

/**
 * Determine skill level based on overall score
 * EXPERT: ≥85, SENIOR: 75-85, INTERMEDIATE: 65-75, JUNIOR: 50-65, BEGINNER: <50
 */
function determineLevel(score: number): SkillLevel {
  if (score >= 85) return 'EXPERT';
  if (score >= 75) return 'SENIOR';
  if (score >= 65) return 'INTERMEDIATE';
  if (score >= 50) return 'JUNIOR';
  return 'BEGINNER';
}

/**
 * Identify strengths based on component scores
 */
function identifyStrengths(componentScores: ComponentScore[]): string[] {
  const strengths: string[] = [];
  
  for (const component of componentScores) {
    if (component.score >= 80) {
      const componentName = component.component === 'VOICE' 
        ? 'Communication skills'
        : component.component === 'MCQ'
        ? 'Technical knowledge'
        : 'Coding abilities';
      strengths.push(`Strong ${componentName.toLowerCase()}`);
    }
  }
  
  // If no strong components, find the best one
  if (strengths.length === 0) {
    const best = componentScores.reduce((prev, current) => 
      current.score > prev.score ? current : prev
    );
    const componentName = best.component === 'VOICE' 
      ? 'communication'
      : best.component === 'MCQ'
      ? 'technical knowledge'
      : 'coding';
    strengths.push(`Adequate ${componentName}`);
  }
  
  return strengths;
}

/**
 * Identify areas for improvement based on component scores
 */
function identifyAreasForImprovement(componentScores: ComponentScore[]): string[] {
  const improvements: string[] = [];
  
  for (const component of componentScores) {
    if (component.score < 65) {
      const componentName = component.component === 'VOICE' 
        ? 'Communication and articulation'
        : component.component === 'MCQ'
        ? 'Theoretical knowledge'
        : 'Practical coding skills';
      improvements.push(componentName);
    }
  }
  
  // If no weak components, suggest general improvements
  if (improvements.length === 0) {
    const weakest = componentScores.reduce((prev, current) => 
      current.score < prev.score ? current : prev
    );
    const componentName = weakest.component === 'VOICE' 
      ? 'communication skills'
      : weakest.component === 'MCQ'
      ? 'technical knowledge breadth'
      : 'coding efficiency';
    improvements.push(`Further enhance ${componentName}`);
  }
  
  return improvements;
}

/**
 * Calculate score weights based on components present
 * Default weights: VOICE=30%, MCQ=35%, CODE=35%
 * If only VOICE+MCQ: VOICE=40%, MCQ=60%
 * If only VOICE+CODE: VOICE=40%, CODE=60%
 * If only VOICE: VOICE=100%
 */
function calculateWeights(components: Array<'VOICE' | 'MCQ' | 'CODE'>): Record<string, number> {
  const weights: Record<string, number> = {};
  
  const hasVoice = components.includes('VOICE');
  const hasMCQ = components.includes('MCQ');
  const hasCode = components.includes('CODE');
  
  if (hasVoice && hasMCQ && hasCode) {
    // All three components
    weights.VOICE = 0.3;
    weights.MCQ = 0.35;
    weights.CODE = 0.35;
  } else if (hasVoice && hasMCQ) {
    // Voice + MCQ only
    weights.VOICE = 0.4;
    weights.MCQ = 0.6;
  } else if (hasVoice && hasCode) {
    // Voice + Code only
    weights.VOICE = 0.4;
    weights.CODE = 0.6;
  } else if (hasVoice) {
    // Voice only
    weights.VOICE = 1.0;
  } else if (hasMCQ && hasCode) {
    // MCQ + Code (unusual but handle it)
    weights.MCQ = 0.5;
    weights.CODE = 0.5;
  } else if (hasMCQ) {
    // MCQ only
    weights.MCQ = 1.0;
  } else if (hasCode) {
    // Code only
    weights.CODE = 1.0;
  }
  
  return weights;
}

/**
 * Aggregate scores from multiple assessment components
 */
export function aggregateScores(
  voiceScore?: number,
  mcqScore?: number,
  codeScore?: number
): AggregatedScore {
  try {
    // Collect available scores
    const availableComponents: Array<'VOICE' | 'MCQ' | 'CODE'> = [];
    if (voiceScore !== undefined) availableComponents.push('VOICE');
    if (mcqScore !== undefined) availableComponents.push('MCQ');
    if (codeScore !== undefined) availableComponents.push('CODE');
    
    if (availableComponents.length === 0) {
      throw new Error('No component scores provided');
    }
    
    // Calculate weights
    const weights = calculateWeights(availableComponents);
    
    // Build component scores array
    const componentScores: ComponentScore[] = [];
    
    if (voiceScore !== undefined) {
      componentScores.push({
        component: 'VOICE',
        score: voiceScore,
        weight: weights.VOICE || 0,
      });
    }
    
    if (mcqScore !== undefined) {
      componentScores.push({
        component: 'MCQ',
        score: mcqScore,
        weight: weights.MCQ || 0,
      });
    }
    
    if (codeScore !== undefined) {
      componentScores.push({
        component: 'CODE',
        score: codeScore,
        weight: weights.CODE || 0,
      });
    }
    
    // Calculate overall weighted score
    const overallScore = componentScores.reduce(
      (sum, component) => sum + component.score * component.weight,
      0
    );
    
    // Determine level
    const level = determineLevel(overallScore);
    
    // Identify strengths and improvements
    const strengths = identifyStrengths(componentScores);
    const areasForImprovement = identifyAreasForImprovement(componentScores);
    
    logger.info(
      `Aggregated scores: Overall=${overallScore.toFixed(1)}, Level=${level}, Components=${availableComponents.join(',')}`
    );
    
    return {
      overallScore: Math.round(overallScore),
      level,
      componentScores,
      strengths,
      areasForImprovement,
    };
  } catch (error) {
    logger.error('Error aggregating scores:', error);
    throw error;
  }
}

export const scoreAggregatorService = {
  aggregateScores,
  determineLevel,
};
