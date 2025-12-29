/**
 * Code Generator Service
 * Ported from elevenlabsgitcopilot/src/services/generators/codeGenerator.ts
 * Generates coding challenges based on profile classification
 */

import OpenAI from 'openai';
import config from '../../config';
import logger from '../../config/logger';
import { safeJsonParse } from '../../utils/security';
import { ProfileClassification } from './profile-classifier.service';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

export type CodeDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type TaskStyle = 'implement_function' | 'debug_code' | 'code_review';

export interface CodingChallenge {
  id: string;
  questionText: string;
  difficulty: CodeDifficulty;
  language: string;
  evaluationCriteria: string[];
  taskStyle: TaskStyle;
  starterCode?: string;
  testCases?: any[];
}

/**
 * Determine task style based on experience level
 */
function determineTaskStyle(yearsExperience: number): TaskStyle {
  if (yearsExperience < 2) return 'implement_function';
  if (yearsExperience < 5) return 'debug_code';
  return 'code_review';
}

/**
 * Determine coding difficulty based on years of experience
 */
function determineCodeDifficulty(yearsExperience: number): CodeDifficulty {
  if (yearsExperience <= 2) return 'EASY';
  if (yearsExperience <= 5) return 'MEDIUM';
  return 'HARD';
}

/**
 * Get primary language for coding challenges
 */
function getPrimaryLanguage(classification: ProfileClassification): string {
  if (classification.primaryLanguages && classification.primaryLanguages.length > 0) {
    return classification.primaryLanguages[0];
  }
  
  // Default based on role
  const roleDefaults: Record<string, string> = {
    software_dev: 'JavaScript',
    qa_automation_sdet: 'Python',
    data_ml: 'Python',
    devops_sre: 'Python',
  };
  
  return roleDefaults[classification.roleCategory] || 'JavaScript';
}

/**
 * Generate fallback coding challenge
 */
function getFallbackChallenge(
  language: string,
  difficulty: CodeDifficulty,
  taskStyle: TaskStyle
): CodingChallenge {
  const challenges: Record<TaskStyle, CodingChallenge> = {
    implement_function: {
      id: uuidv4(),
      questionText: `Write a function in ${language} that reverses a string without using built-in reverse methods.

Example:
Input: "hello"
Output: "olleh"

Requirements:
- Handle empty strings
- Preserve spaces and special characters
- Time complexity should be O(n)`,
      difficulty,
      language,
      evaluationCriteria: [
        'Correct implementation',
        'Edge case handling',
        'Code clarity and style',
        'Efficiency',
      ],
      taskStyle,
    },
    debug_code: {
      id: uuidv4(),
      questionText: `Debug the following ${language} code that is supposed to find the maximum value in an array but has bugs:

\`\`\`${language}
function findMax(arr) {
  let max = 0;
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > max) {
      max = arr[i];
    }
  }
  return max;
}
\`\`\`

Identify all bugs and provide the corrected code with explanation.`,
      difficulty,
      language,
      evaluationCriteria: [
        'Identified all bugs',
        'Provided working solution',
        'Clear explanation',
        'Understanding of edge cases',
      ],
      taskStyle,
    },
    code_review: {
      id: uuidv4(),
      questionText: `Review the following ${language} code and provide feedback on potential issues, improvements, and best practices:

\`\`\`${language}
function processUserData(data) {
  var result = [];
  for (var i = 0; i < data.length; i++) {
    if (data[i].age > 18) {
      result.push({
        name: data[i].firstName + ' ' + data[i].lastName,
        age: data[i].age,
        email: data[i].email
      });
    }
  }
  return result;
}
\`\`\`

Provide your code review covering:
- Potential bugs or issues
- Performance considerations
- Best practices violations
- Suggested improvements`,
      difficulty,
      language,
      evaluationCriteria: [
        'Identified key issues',
        'Suggested practical improvements',
        'Demonstrated knowledge of best practices',
        'Code quality awareness',
      ],
      taskStyle,
    },
  };
  
  return challenges[taskStyle];
}

/**
 * Generate coding challenges using GPT-4o
 */
export async function generateCodingChallenges(
  classification: ProfileClassification,
  challengeCount: number,
  taskStyle?: TaskStyle,
  language?: string
): Promise<CodingChallenge[]> {
  try {
    const primaryLanguage = language || getPrimaryLanguage(classification);
    const difficulty = determineCodeDifficulty(classification.yearsExperience);
    const style = taskStyle || determineTaskStyle(classification.yearsExperience);
    
    logger.info(
      `Generating ${challengeCount} coding challenges in ${primaryLanguage} at ${difficulty} level, style: ${style}`
    );
    
    // Build system prompt for code generation
    const systemPrompt = `You are an expert technical interviewer creating coding challenges.

Generate ${challengeCount} coding challenge(s) for a ${classification.roleCategory} candidate with ${classification.yearsExperience} years of experience.

Language: ${primaryLanguage}
Difficulty: ${difficulty}
Task Style: ${style}

Task Style Guidelines:
- implement_function: Ask candidate to write a function from scratch
- debug_code: Provide buggy code for them to fix
- code_review: Provide code for them to review and suggest improvements

Requirements:
- ${difficulty === 'EASY' ? 'Focus on basic algorithms and data structures' : difficulty === 'MEDIUM' ? 'Include practical problems with moderate complexity' : 'Advanced algorithms, system design, or optimization problems'}
- Relevant to ${classification.keySkills.join(', ')}
- Clear problem statement
- Include example inputs/outputs
- Specify evaluation criteria

Return ONLY valid JSON array:
[
  {
    "questionText": "Complete problem description with examples",
    "language": "${primaryLanguage}",
    "taskStyle": "${style}",
    "evaluationCriteria": ["criterion1", "criterion2", "criterion3", "criterion4"]
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
          content: `Generate ${challengeCount} coding challenge(s) now.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      logger.warn('No response from OpenAI for coding challenge generation, using fallback');
      const challenges: CodingChallenge[] = [];
      for (let i = 0; i < challengeCount; i++) {
        challenges.push(getFallbackChallenge(primaryLanguage, difficulty, style));
      }
      return challenges;
    }

    // Parse the response
    const challengesData = safeJsonParse<any[]>(content);
    if (!challengesData || !Array.isArray(challengesData)) {
      logger.warn('Failed to parse coding challenge response, using fallback');
      const challenges: CodingChallenge[] = [];
      for (let i = 0; i < challengeCount; i++) {
        challenges.push(getFallbackChallenge(primaryLanguage, difficulty, style));
      }
      return challenges;
    }

    // Transform and validate challenges
    const challenges: CodingChallenge[] = challengesData.map((c) => ({
      id: uuidv4(),
      questionText: c.questionText || 'Write a function to solve this problem.',
      difficulty,
      language: c.language || primaryLanguage,
      evaluationCriteria: Array.isArray(c.evaluationCriteria) && c.evaluationCriteria.length > 0
        ? c.evaluationCriteria
        : ['Correctness', 'Code quality', 'Problem solving', 'Completeness'],
      taskStyle: c.taskStyle || style,
      starterCode: c.starterCode,
      testCases: c.testCases,
    }));

    // Ensure we have the right number of challenges
    if (challenges.length < challengeCount) {
      const additionalCount = challengeCount - challenges.length;
      for (let i = 0; i < additionalCount; i++) {
        challenges.push(getFallbackChallenge(primaryLanguage, difficulty, style));
      }
    }

    logger.info(`Successfully generated ${challenges.length} coding challenges`);
    return challenges.slice(0, challengeCount);
  } catch (error) {
    logger.error('Error generating coding challenges:', error);
    const primaryLanguage = language || getPrimaryLanguage(classification);
    const difficulty = determineCodeDifficulty(classification.yearsExperience);
    const style = taskStyle || determineTaskStyle(classification.yearsExperience);
    const challenges: CodingChallenge[] = [];
    for (let i = 0; i < challengeCount; i++) {
      challenges.push(getFallbackChallenge(primaryLanguage, difficulty, style));
    }
    return challenges;
  }
}

export const codeGeneratorService = {
  generateCodingChallenges,
  determineCodeDifficulty,
  determineTaskStyle,
};
