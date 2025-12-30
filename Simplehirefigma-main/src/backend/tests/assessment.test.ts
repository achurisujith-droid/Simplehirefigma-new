/**
 * Assessment Module Tests
 */

import { describe, it, expect } from '@jest/globals';
import { ResumeAnalysis, openaiService } from '../src/modules/ai/openai.service';
import { assessmentPlannerService } from '../src/modules/assessment/assessment-planner.service';
import { questionGeneratorService } from '../src/modules/assessment/question-generator.service';

// Mock OpenAI responses
jest.mock('../src/modules/ai/openai.service', () => ({
  openaiService: {
    analyzeResumeDeep: jest.fn(),
    generateNextQuestion: jest.fn(),
  },
}));

describe('Assessment Planning', () => {
  const mockResumeAnalysis: ResumeAnalysis = {
    candidateProfile: {
      name: 'John Doe',
      currentRole: 'Software Engineer',
      totalExperience: '5 years',
      jobCategory: 'Software Development',
    },
    professionalSummary: 'Experienced software engineer with 5 years of experience.',
    workExperience: [
      {
        company: 'Tech Corp',
        role: 'Senior Software Engineer',
        duration: '2020-2023',
        responsibilities: ['Developed React applications', 'Led team of 3 engineers'],
      },
    ],
    coreSkills: {
      technical: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
      business: ['Agile', 'Project Management'],
      soft: ['Communication', 'Leadership'],
    },
    education: [
      {
        degree: 'BS Computer Science',
        institution: 'University',
        year: '2018',
      },
    ],
    keyAchievements: ['Built scalable platform handling 1M users'],
    interviewFocus: {
      primaryAreas: ['React', 'Node.js', 'System Design'],
      suggestedQuestionTopics: ['Component Architecture', 'API Design'],
      experienceLevel: 'mid',
    },
    extractedEntities: {
      companies: ['Tech Corp', 'Startup Inc'],
      clients: ['Enterprise Client A'],
      projects: ['E-commerce Platform', 'Admin Dashboard'],
      technologies: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS'],
      domains: ['E-commerce', 'SaaS'],
      certifications: ['AWS Certified'],
    },
  };

  describe('Assessment Planner', () => {
    it('should enable voice, MCQ, and code for software_dev with recent coding', () => {
      const classification = {
        roleCategory: 'software_dev' as const,
        codingExpected: true,
        yearsExperience: 5,
        recentCoding: true,
        evidenceStrength: 'strong' as const,
        primaryLanguages: ['TypeScript', 'JavaScript'],
        primaryFrameworks: ['React', 'Node.js'],
        keySkills: ['React', 'Node.js', 'TypeScript'],
        rationale: 'Strong software development experience',
      };

      const plan = assessmentPlannerService.planAssessment(classification);

      expect(plan.components).toContain('VOICE');
      expect(plan.components).toContain('MCQ');
      expect(plan.components).toContain('CODE');
      expect(plan.questionCounts.voice).toBe(12); // senior-level (5 years)
      expect(plan.questionCounts.mcq).toBe(20);
      expect(plan.questionCounts.code).toBe(3); // senior-level
    });

    it('should enable only voice and MCQ for business_analyst', () => {
      const classification = {
        roleCategory: 'business_analyst' as const,
        codingExpected: false,
        yearsExperience: 3,
        recentCoding: false,
        evidenceStrength: 'strong' as const,
        primaryLanguages: [],
        primaryFrameworks: ['Excel', 'Tableau'],
        keySkills: ['Data Analysis', 'SQL', 'Business Intelligence'],
        rationale: 'Business analyst with data skills',
      };

      const plan = assessmentPlannerService.planAssessment(classification);

      expect(plan.components).toContain('VOICE');
      expect(plan.components).toContain('MCQ');
      expect(plan.components).not.toContain('CODE');
      expect(plan.questionCounts.voice).toBe(10);
      expect(plan.questionCounts.mcq).toBe(20);
      expect(plan.questionCounts.code).toBe(0);
    });

    it('should enable only voice for non_tech roles', () => {
      const classification = {
        roleCategory: 'non_tech' as const,
        codingExpected: false,
        yearsExperience: 4,
        recentCoding: false,
        evidenceStrength: 'strong' as const,
        primaryLanguages: [],
        primaryFrameworks: [],
        keySkills: ['Sales', 'Marketing', 'Communication'],
        rationale: 'Sales professional',
      };

      const plan = assessmentPlannerService.planAssessment(classification);

      expect(plan.components).toContain('VOICE');
      expect(plan.components).not.toContain('MCQ');
      expect(plan.components).not.toContain('CODE');
      expect(plan.questionCounts.voice).toBe(10);
      expect(plan.questionCounts.mcq).toBe(0);
      expect(plan.questionCounts.code).toBe(0);
    });

    it('should not enable code for software_dev without recent coding', () => {
      const classification = {
        roleCategory: 'software_dev' as const,
        codingExpected: true,
        yearsExperience: 5,
        recentCoding: false, // No recent coding
        evidenceStrength: 'moderate' as const,
        primaryLanguages: ['Java'],
        primaryFrameworks: ['Spring'],
        keySkills: ['Java', 'Spring', 'SQL'],
        rationale: 'Software developer with no recent coding activity',
      };

      const plan = assessmentPlannerService.planAssessment(classification);

      expect(plan.components).toContain('VOICE');
      expect(plan.components).toContain('MCQ');
      expect(plan.components).not.toContain('CODE');
    });

    it('should calculate correct question counts for entry level', () => {
      const classification = {
        roleCategory: 'software_dev' as const,
        codingExpected: true,
        yearsExperience: 1,
        recentCoding: true,
        evidenceStrength: 'strong' as const,
        primaryLanguages: ['Python'],
        primaryFrameworks: ['Django'],
        keySkills: ['Python', 'Django', 'REST APIs'],
        rationale: 'Junior software developer',
      };

      const plan = assessmentPlannerService.planAssessment(classification);

      expect(plan.difficulty).toBe('entry');
      expect(plan.questionCounts.voice).toBe(8); // entry level
      expect(plan.questionCounts.code).toBe(2); // entry level
    });

    it('should calculate correct question counts for senior level', () => {
      const classification = {
        roleCategory: 'software_dev' as const,
        codingExpected: true,
        yearsExperience: 8,
        recentCoding: true,
        evidenceStrength: 'strong' as const,
        primaryLanguages: ['TypeScript', 'Go'],
        primaryFrameworks: ['React', 'Node.js'],
        keySkills: ['System Design', 'Architecture', 'Leadership'],
        rationale: 'Senior software engineer',
      };

      const plan = assessmentPlannerService.planAssessment(classification);

      expect(plan.difficulty).toBe('senior');
      expect(plan.questionCounts.voice).toBe(12); // senior level
      expect(plan.questionCounts.code).toBe(3); // senior level
    });

    it('should enable code for devops_sre with programming languages', () => {
      const classification = {
        roleCategory: 'devops_sre' as const,
        codingExpected: true,
        yearsExperience: 4,
        recentCoding: true,
        evidenceStrength: 'strong' as const,
        primaryLanguages: ['Python', 'Go'],
        primaryFrameworks: ['Kubernetes', 'Terraform'],
        keySkills: ['DevOps', 'Python', 'Kubernetes'],
        rationale: 'DevOps engineer with coding skills',
      };

      const plan = assessmentPlannerService.planAssessment(classification);

      expect(plan.components).toContain('CODE');
    });

    it('should not enable code for devops_sre without programming languages', () => {
      const classification = {
        roleCategory: 'devops_sre' as const,
        codingExpected: false,
        yearsExperience: 4,
        recentCoding: false,
        evidenceStrength: 'moderate' as const,
        primaryLanguages: [],
        primaryFrameworks: ['Jenkins', 'Docker'],
        keySkills: ['CI/CD', 'Docker', 'Jenkins'],
        rationale: 'DevOps engineer focusing on tools',
      };

      const plan = assessmentPlannerService.planAssessment(classification);

      expect(plan.components).not.toContain('CODE');
    });
  });

  describe('Question Generator', () => {
    it('should generate voice questions referencing resume entities', async () => {
      const mockQuestion = {
        text: 'Tell me about your experience with React at Tech Corp',
        topic: 'React Experience',
        isFollowUp: false,
      };

      (openaiService.generateNextQuestion as jest.Mock).mockResolvedValue(mockQuestion);

      const classification = {
        roleCategory: 'software_dev' as const,
        codingExpected: true,
        yearsExperience: 5,
        recentCoding: true,
        evidenceStrength: 'strong' as const,
        primaryLanguages: ['TypeScript'],
        primaryFrameworks: ['React'],
        keySkills: ['React', 'Node.js'],
        rationale: 'Software engineer',
      };

      const questions = await questionGeneratorService.generateVoiceQuestions(
        mockResumeAnalysis,
        classification,
        3
      );

      expect(questions).toHaveLength(3);
      expect(questions[0]).toHaveProperty('id');
      expect(questions[0]).toHaveProperty('text');
      expect(questions[0]).toHaveProperty('topic');
    });
  });
});
