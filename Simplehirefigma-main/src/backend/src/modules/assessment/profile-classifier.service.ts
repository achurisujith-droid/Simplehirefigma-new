/**
 * Profile Classifier Service
 * Ported from elevenlabsgitcopilot/src/services/planner/profileClassifier.ts
 * Classifies candidate profiles into 11 role categories
 */

import OpenAI from 'openai';
import config from '../../config';
import logger from '../../config/logger';
import { safeJsonParse } from '../../utils/security';
import { ResumeAnalysis } from '../ai/openai.service';

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

export type RoleCategory =
  | 'software_dev'
  | 'qa_manual'
  | 'qa_automation_sdet'
  | 'data_ml'
  | 'devops_sre'
  | 'analytics_bi'
  | 'product_manager'
  | 'business_analyst'
  | 'support_infra'
  | 'non_tech'
  | 'mixed_unclear';

export type EvidenceStrength = 'strong' | 'moderate' | 'weak';

export interface ProfileClassification {
  roleCategory: RoleCategory;
  codingExpected: boolean;
  yearsExperience: number;
  recentCoding: boolean;
  evidenceStrength: EvidenceStrength;
  primaryLanguages: string[];
  primaryFrameworks: string[];
  keySkills: string[];
  rationale: string;
}

/**
 * Classify candidate profile based on resume analysis
 * EXACT system prompt from elevenlabsgitcopilot/profileClassifier.ts lines 38-82
 */
export async function classifyProfile(
  analysis: ResumeAnalysis
): Promise<ProfileClassification> {
  try {
    const { candidateProfile, workExperience, coreSkills, extractedEntities } = analysis;

    // Build context from resume analysis
    const experienceText = workExperience
      .map((exp) => `${exp.role} at ${exp.company} (${exp.duration})`)
      .join('\n');

    const technicalSkills = coreSkills.technical.join(', ');
    const technologies = extractedEntities.technologies.join(', ');

    // EXACT prompt from source lines 38-82
    const systemPrompt = `You are an expert technical recruiter specializing in role classification.

Analyze the candidate's profile and classify them into ONE of these categories:
1. software_dev - Software developers, engineers (frontend, backend, fullstack)
2. qa_manual - Manual QA testers, non-technical testers
3. qa_automation_sdet - QA automation engineers, SDET roles
4. data_ml - Data scientists, ML engineers, data engineers
5. devops_sre - DevOps, SRE, infrastructure engineers
6. analytics_bi - Business intelligence, data analysts
7. product_manager - Product managers, technical PMs
8. business_analyst - Business analysts
9. support_infra - IT support, infrastructure support
10. non_tech - Sales, marketing, HR, business development
11. mixed_unclear - Cannot clearly determine primary role

Determine:
- codingExpected: true if role typically requires writing code
- recentCoding: true if evidence of coding in last 2 years
- yearsExperience: total years in this field (extract from experience)
- evidenceStrength: how clear the evidence is (strong/moderate/weak)
- primaryLanguages: main programming languages (if applicable)
- primaryFrameworks: main frameworks/tools
- keySkills: top 5 most relevant skills

Return ONLY valid JSON:
{
  "roleCategory": "one of the 11 categories",
  "codingExpected": true/false,
  "yearsExperience": number,
  "recentCoding": true/false,
  "evidenceStrength": "strong|moderate|weak",
  "primaryLanguages": ["lang1", "lang2"],
  "primaryFrameworks": ["framework1", "framework2"],
  "keySkills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "rationale": "Brief explanation of classification"
}`;

    const userPrompt = `Candidate Profile:
Name: ${candidateProfile.name}
Current Role: ${candidateProfile.currentRole}
Total Experience: ${candidateProfile.totalExperience}
Job Category: ${candidateProfile.jobCategory}

Work Experience:
${experienceText}

Technical Skills: ${technicalSkills}

Technologies Used: ${technologies}

Classify this candidate.`;

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
      temperature: 0.2,
      max_tokens: 800,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const classification = safeJsonParse<ProfileClassification>(content);
    if (!classification || !classification.roleCategory) {
      throw new Error('Failed to parse profile classification');
    }

    logger.info(
      `Profile classified as: ${classification.roleCategory}, coding: ${classification.codingExpected}, recent: ${classification.recentCoding}`
    );
    return classification;
  } catch (error) {
    logger.error('Error classifying profile:', error);
    throw error;
  }
}

export const profileClassifierService = {
  classifyProfile,
};
