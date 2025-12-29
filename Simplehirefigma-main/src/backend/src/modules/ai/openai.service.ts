/**
 * OpenAI Service for Resume Analysis and Question Generation
 * Ported from elevenlabsgitcopilot/openai-service.js
 */

import OpenAI from 'openai';
import config from '../../config';
import logger from '../../config/logger';
import { sanitizePrompt, safeJsonParse } from '../../utils/security';
import { resumeCacheService } from '../resume/cache/resume-cache.service';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

export interface CandidateProfile {
  name: string;
  currentRole: string;
  totalExperience: string;
  jobCategory: string;
}

export interface WorkExperience {
  company: string;
  role: string;
  duration: string;
  responsibilities: string[];
}

export interface CoreSkills {
  technical: string[];
  business: string[];
  soft: string[];
}

export interface Education {
  degree: string;
  institution: string;
  year: string;
}

export interface InterviewFocus {
  primaryAreas: string[];
  suggestedQuestionTopics: string[];
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
}

export interface ExtractedEntities {
  companies: string[];
  clients: string[];
  projects: string[];
  technologies: string[];
  domains: string[];
  certifications: string[];
}

export interface ResumeAnalysis {
  candidateProfile: CandidateProfile;
  professionalSummary: string;
  workExperience: WorkExperience[];
  coreSkills: CoreSkills;
  education: Education[];
  keyAchievements: string[];
  interviewFocus: InterviewFocus;
  extractedEntities: ExtractedEntities;
}

export interface GeneratedQuestion {
  text: string;
  topic: string;
  isFollowUp: boolean;
  followUpCount?: number;
  level?: string;
}

export interface QuestionGenerationContext {
  resumeSummary: string;
  extractedEntities: ExtractedEntities;
  primarySkill: string;
  yearsOfExp: number;
  level: string;
  totalQuestionsAsked: number;
  maxQuestions: number;
  previousQuestions: Array<{ question: string; answer?: string; score?: number }>;
}

/**
 * Analyze resume and extract comprehensive structured information
 * Ported from elevenlabsgitcopilot/openai-service.js lines 380-486
 */
export async function analyzeResumeDeep(resumeText: string): Promise<ResumeAnalysis> {
  try {
    // Check cache first
    const cached = await resumeCacheService.getCached<ResumeAnalysis>(resumeText);
    if (cached) {
      logger.info('Returning cached resume analysis');
      return cached;
    }

    // Sanitize input
    const sanitizedResume = sanitizePrompt(resumeText);

    // EXACT prompt from elevenlabsgitcopilot/openai-service.js lines 390-449
    const prompt = `You are an expert resume analyst. Analyze the following resume and extract comprehensive, structured information.

Resume:
${sanitizedResume}

Analyze and return ONLY a valid JSON object with this structure:
{
  "candidateProfile": {
    "name": "candidate's name",
    "currentRole": "current/most recent job title",
    "totalExperience": "X years",
    "jobCategory": "one of: Business Development, Sales, Software Development, Data Science, Management, Marketing, HR/Recruitment, Operations, Finance, Other"
  },
  "professionalSummary": "2-3 sentence summary",
  "workExperience": [
    {
      "company": "company name",
      "role": "job title",
      "duration": "time period",
      "responsibilities": ["responsibility 1", "responsibility 2"]
    }
  ],
  "coreSkills": {
    "technical": ["skill1", "skill2"],
    "business": ["skill1", "skill2"],
    "soft": ["skill1", "skill2"]
  },
  "education": [
    {
      "degree": "degree name",
      "institution": "school name",
      "year": "graduation year"
    }
  ],
  "keyAchievements": ["achievement 1", "achievement 2"],
  "interviewFocus": {
    "primaryAreas": ["area1", "area2"],
    "suggestedQuestionTopics": ["topic1", "topic2"],
    "experienceLevel": "entry|mid|senior|executive"
  },
  "extractedEntities": {
    "companies": ["company1", "company2"],
    "clients": ["client1", "client2"],
    "projects": ["project1", "project2"],
    "technologies": ["tech1", "tech2"],
    "domains": ["domain1", "domain2"],
    "certifications": ["cert1", "cert2"]
  }
}

IMPORTANT: Accurately determine the jobCategory based on their work history.
CRITICAL: In "extractedEntities", extract ALL company names, client names, projects, technologies, domains, certifications.
IMPORTANT: Return ONLY valid JSON. Do not wrap in markdown code blocks.`;

    // Call OpenAI with gpt-4o and temperature 0.2
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 3000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse response
    const analysis = safeJsonParse<ResumeAnalysis>(content);
    if (!analysis) {
      throw new Error('Failed to parse resume analysis JSON');
    }

    // Validate required fields
    if (!analysis.candidateProfile || !analysis.extractedEntities) {
      throw new Error('Invalid resume analysis structure');
    }

    // Cache the result
    await resumeCacheService.setCached(resumeText, analysis);

    logger.info('Resume analysis completed successfully');
    return analysis;
  } catch (error) {
    logger.error('Error analyzing resume:', error);
    throw error;
  }
}

/**
 * Generate next interview question based on resume and context
 * Ported from elevenlabsgitcopilot/openai-service.js lines 166-284
 */
export async function generateNextQuestion(
  context: QuestionGenerationContext
): Promise<GeneratedQuestion> {
  try {
    const {
      resumeSummary,
      extractedEntities,
      primarySkill,
      yearsOfExp,
      level,
      totalQuestionsAsked,
      maxQuestions,
      previousQuestions,
    } = context;

    // Build previous questions list
    const previousQuestionsText = previousQuestions
      .map((q, idx) => {
        let text = `${idx + 1}. Q: ${q.question}`;
        if (q.answer) text += `\n   A: ${q.answer.substring(0, 200)}...`;
        if (q.score !== undefined) text += `\n   Score: ${q.score}/10`;
        return text;
      })
      .join('\n\n');

    // EXACT prompt structure from elevenlabsgitcopilot/openai-service.js lines 210-238
    const prompt = `You are an expert interviewer. Generate the next interview question.

Resume Summary:
${sanitizePrompt(resumeSummary)}

Extracted Resume Entities (USE THESE in questions):
- Companies: ${extractedEntities.companies.join(', ') || 'None'}
- Technologies: ${extractedEntities.technologies.join(', ') || 'None'}
- Projects: ${extractedEntities.projects.join(', ') || 'None'}

Interview Configuration:
- Primary Skill: ${primarySkill}
- Experience Level: ${yearsOfExp} years
- Current Difficulty Level: ${level}
- Questions Asked So Far: ${totalQuestionsAsked}/${maxQuestions}

Previous questions asked:
${previousQuestionsText || 'None yet'}

Instructions:
1. Choose a NEW topic from the resume that hasn't been covered yet
2. Match the difficulty to ${level} level
3. Make it specific to their experience in ${primarySkill}
4. **CRITICAL**: Reference specific companies, projects, or technologies from the extracted entities

IMPORTANT: Return ONLY valid JSON.
{
  "text": "The question to ask",
  "topic": "Topic name",
  "isFollowUp": false,
  "followUpCount": 0
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const question = safeJsonParse<GeneratedQuestion>(content);
    if (!question || !question.text) {
      throw new Error('Failed to parse generated question');
    }

    logger.info(`Generated question: ${question.text.substring(0, 100)}...`);
    return question;
  } catch (error) {
    logger.error('Error generating question:', error);
    throw error;
  }
}

export const openaiService = {
  analyzeResumeDeep,
  generateNextQuestion,
};
