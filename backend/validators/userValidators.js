import { z } from 'zod';

const optionalUrl = z.string().trim().url().or(z.literal('')).optional();
const text = (max = 100) => z.string().trim().max(max).optional();

// role/email/password are intentionally absent: z.object strips them.
export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: text(20),
  domain: text(),
  targetRole: text(),
  preferredIndustry: text(),
  skills: z.array(z.string().trim().min(1).max(50)).max(50).optional(),
  education: z.array(z.object({ degree: text(), institution: text(), year: text(10) })).max(10).optional(),
  experience: z.array(z.object({ title: text(), company: text(), duration: text(), description: text(500) })).max(15).optional(),
  linkedinUrl: optionalUrl,
  githubUrl: optionalUrl,
  portfolioUrl: optionalUrl,
});
