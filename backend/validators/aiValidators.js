import { z } from 'zod';

const id = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
export const resumeIdSchema = z.object({ resumeId: id });

export const generateQuestionsSchema = z.object({
  resumeId: id, jobDescriptionId: id.optional(), category: z.string().trim().min(1).max(80).optional(),
  count: z.coerce.number().int().min(1).max(8).optional(),
});

export const answerSchema = z.object({
  questionId: id, answer: z.string().trim().min(1).max(5000).optional(), skipped: z.boolean().optional(),
}).refine((v) => v.skipped || v.answer, { message: 'Provide an answer or mark the question as skipped' });

export const mockStartSchema = z.object({
  resumeId: id.optional(), domain: z.string().trim().min(2).max(100), role: z.string().trim().min(2).max(100),
  difficulty: z.enum(['easy', 'medium', 'hard']), type: z.enum(['hr', 'technical', 'behavioral', 'project', 'mixed']),
  totalQuestions: z.coerce.number().int().min(3).max(15),
});

export const mockAnswerSchema = z.object({ answer: z.string().trim().min(1).max(5000) });

// multipart fields arrive as strings; the JD text itself is optional because a file may be uploaded instead
export const jobMatchSchema = z.object({
  resumeId: id, title: z.string().trim().max(120).optional(), jobDescriptionText: z.string().max(20000).optional(),
});

export const learningPlanSchema = z.object({ resumeId: id, jobDescriptionId: id.optional() });
export const topicSchema = z.object({ weekIndex: z.number().int().min(0), topicIndex: z.number().int().min(0), done: z.boolean() });
export const reportSchema = z.object({ reason: z.string().trim().max(300).optional() });
export const adminUserUpdateSchema = z.object({ isActive: z.boolean().optional(), role: z.enum(['candidate', 'admin']).optional() });
