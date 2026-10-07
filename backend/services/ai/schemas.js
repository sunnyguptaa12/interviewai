import { z } from 'zod';

const str = z.string().nullish().transform((v) => v ?? '');
const strArr = z.array(z.string()).nullish().transform((v) => v ?? []);
const objArr = (shape) => z.array(z.object(shape)).nullish().transform((v) => v ?? []);
const num = (min, max, def = 0) => z.coerce.number().nullish().transform((v) => Math.min(max, Math.max(min, v ?? def)));
const difficulty = z.preprocess((v) => String(v ?? 'medium').toLowerCase().trim(), z.enum(['easy', 'medium', 'hard']).catch('medium'));

const job = { title: str, company: str, duration: str, summary: str };

export const resumeAnalysisSchema = z.object({
  candidateName: str, domain: str, targetRole: str, experienceLevel: str, resumeScore: num(0, 100),
  skills: strArr, technicalSkills: strArr, softSkills: strArr,
  education: objArr({ degree: str, institution: str, year: str }),
  certifications: strArr,
  experience: objArr(job), internships: objArr(job),
  projects: objArr({ name: str, description: str, technologies: strArr }),
  achievements: strArr, tools: strArr, technologies: strArr, keywords: strArr, possibleRoles: strArr,
  strengths: strArr, missingSkills: strArr, claimsToChallenge: strArr,
}).refine((a) => a.domain.trim().length > 0, { message: 'domain is required' });

export const domainDetectionSchema = z.object({
  domain: str, subDomain: str, confidence: num(0, 1, 0.5), suggestedQuestionAreas: strArr, reasoning: str,
}).refine((a) => a.domain.trim().length > 0, { message: 'domain is required' });

export const questionBatchSchema = z.object({
  categories: objArr({
    name: str,
    questions: objArr({ question: str, difficulty, skill: str, hint: str, idealConcepts: strArr }),
  }),
});

const score10 = num(0, 10);
export const evaluationSchema = z.object({
  score: score10, technicalAccuracy: score10, relevance: score10, completeness: score10, clarity: score10, communication: score10,
  missingConcepts: strArr, strengths: strArr, improvements: strArr, betterAnswer: str,
});

export const nextTurnSchema = z.object({ reaction: str, question: str })
  .refine((t) => t.question.trim().length > 0, { message: 'question is required' });

export const interviewReportSchema = z.object({
  overallScore: num(0, 100), technicalScore: num(0, 100), communicationScore: num(0, 100), relevanceScore: num(0, 100),
  strongAreas: strArr, weakAreas: strArr, recommendedTopics: strArr, finalFeedback: str,
});

export const jobMatchSchema = z.object({
  matchPercentage: num(0, 100), matchingSkills: strArr, missingSkills: strArr, requiredSkills: strArr,
  strengths: strArr, skillGaps: strArr, interviewFocusAreas: strArr, roleTitle: str,
});

export const learningPlanSchema = z.object({
  title: str,
  weeks: objArr({ week: num(1, 52, 1), focus: str, topics: objArr({ title: str, description: str }) }),
}).refine((p) => p.weeks.length > 0, { message: 'plan needs at least one week' });

export const recommendationsSchema = z.object({
  summary: str, topicsToStudy: strArr,
  questionsToPractice: objArr({ category: str, count: num(1, 50, 5), reason: str }),
  skillsToImprove: strArr, resumeImprovements: strArr, strategy: strArr,
});

export const resumeImprovementSchema = z.object({
  overallAssessment: str,
  improvements: objArr({ section: str, issue: str, suggestion: str }),
  rewrittenSummary: str, atsKeywords: strArr,
});
