import { z } from 'zod';

const url = z.string().trim().url('Enter a valid URL').or(z.literal(''));
export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short'),
  phone: z.string().max(20).optional(),
  domain: z.string().max(100).optional(),
  targetRole: z.string().max(100).optional(),
  preferredIndustry: z.string().max(100).optional(),
  skills: z.string().optional(), // comma separated in the form
  education: z.array(z.object({ degree: z.string().optional(), institution: z.string().optional(), year: z.string().optional() })),
  experience: z.array(z.object({ title: z.string().optional(), company: z.string().optional(), duration: z.string().optional() })),
  linkedinUrl: url, githubUrl: url, portfolioUrl: url,
});
