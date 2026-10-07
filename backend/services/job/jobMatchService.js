import fs from 'fs/promises';
import JobDescription from '../../models/JobDescription.js';
import ResumeAnalysis from '../../models/ResumeAnalysis.js';
import { ApiError } from '../../utils/ApiError.js';
import { cleanText, prepareForAI } from '../../utils/text.js';
import { extractText } from '../resume/extractor.js';
import { summarizeAnalysis } from '../ai/prompts.js';
import * as ai from '../ai/aiService.js';

export async function match(userId, { resumeId, title, jobDescriptionText }, file) {
  let jdText = jobDescriptionText ? cleanText(jobDescriptionText) : '';
  if (file) {
    try { jdText = await extractText(file.path); } finally { await fs.unlink(file.path).catch(() => {}); }
  }
  if (jdText.length < 50) throw new ApiError(400, 'Provide a job description (paste text or upload PDF/DOCX), at least 50 characters');
  const analysis = await ResumeAnalysis.findOne({ resume: resumeId, user: userId });
  if (!analysis) throw new ApiError(400, 'Analyze the resume before matching it with a job');

  const result = await ai.matchJob({ resumeSummary: summarizeAnalysis(analysis.data), jdText: prepareForAI(jdText) });
  return JobDescription.create({
    user: userId, resume: resumeId, title: title || result.roleTitle || 'Untitled role',
    text: jdText, match: result, matchPercentage: result.matchPercentage,
  });
}

export const list = (userId) => JobDescription.find({ user: userId }).sort('-createdAt').limit(30);
export async function getOne(userId, id) {
  const jd = await JobDescription.findOne({ _id: id, user: userId });
  if (!jd) throw new ApiError(404, 'Job description not found');
  return jd;
}
export async function remove(userId, id) { await (await getOne(userId, id)).deleteOne(); }
