import fs from 'fs/promises';
import Resume from '../../models/Resume.js';
import ResumeAnalysis from '../../models/ResumeAnalysis.js';
import User from '../../models/User.js';
import { ApiError } from '../../utils/ApiError.js';
import { prepareForAI } from '../../utils/text.js';
import { extractText } from './extractor.js';
import * as ai from '../ai/aiService.js';
import { notify } from '../notificationService.js';

const safeUnlink = (p) => (p ? fs.unlink(p).catch(() => {}) : Promise.resolve());

export async function createFromUpload(userId, file) {
  if (!file) throw new ApiError(400, 'Resume file is required (field name: resume)');
  try {
    const text = await extractText(file.path);
    return await Resume.create({
      user: userId, originalName: file.originalname, storedName: file.filename, filePath: file.path,
      mimeType: file.mimetype, size: file.size, extractedText: text, textLength: text.length,
    });
  } catch (e) { await safeUnlink(file.path); throw e; }
}

export const list = (userId) => Resume.find({ user: userId }).sort('-createdAt').populate('analysis', 'domain targetRole experienceLevel resumeScore');

export async function getOwned(userId, id, { withText = false, withPath = false } = {}) {
  let q = Resume.findOne({ _id: id, user: userId });
  if (withText) q = q.select('+extractedText');
  if (withPath) q = q.select('+filePath');
  const resume = await q;
  if (!resume) throw new ApiError(404, 'Resume not found');
  return resume;
}

export async function remove(userId, id) {
  const resume = await getOwned(userId, id, { withPath: true });
  await safeUnlink(resume.filePath);
  await ResumeAnalysis.deleteOne({ resume: resume._id });
  await resume.deleteOne();
}

export async function analyze(userId, resumeId) {
  const resume = await getOwned(userId, resumeId, { withText: true });
  resume.status = 'analyzing'; resume.error = undefined; await resume.save();
  try {
    const text = prepareForAI(resume.extractedText);
    const [analysis, detection] = await Promise.all([ai.analyzeResume(text), ai.detectDomain(text)]);
    const domain = detection.confidence >= 0.5 ? detection.domain : analysis.domain;
    const data = { ...analysis, domain, subDomain: detection.subDomain, domainAreas: detection.suggestedQuestionAreas };
    const doc = await ResumeAnalysis.findOneAndUpdate(
      { resume: resume._id },
      { user: userId, resume: resume._id, domain, domainConfidence: detection.confidence, targetRole: analysis.targetRole,
        experienceLevel: analysis.experienceLevel, resumeScore: analysis.resumeScore, data },
      { upsert: true, new: true, setDefaultsOnInsert: true });
    resume.analysis = doc._id; resume.status = 'analyzed'; await resume.save();

    // Pre-fill (never overwrite) profile fields from the resume.
    const user = await User.findById(userId);
    if (!user.domain) user.domain = domain;
    if (!user.targetRole) user.targetRole = analysis.targetRole;
    if (!user.skills?.length) user.skills = analysis.skills.slice(0, 30);
    await user.save();

    await notify(userId, 'resume_analyzed', 'Resume analysis completed', `Detected domain: ${domain}`, '/resume');
    return doc;
  } catch (e) {
    resume.status = 'failed'; resume.error = e.message; await resume.save();
    throw e;
  }
}

export async function getAnalysis(userId, resumeId) {
  const doc = await ResumeAnalysis.findOne({ resume: resumeId, user: userId });
  if (!doc) throw new ApiError(404, 'Resume has not been analyzed yet');
  return doc;
}

export async function improvements(userId, resumeId) {
  const resume = await getOwned(userId, resumeId, { withText: true });
  const analysis = await getAnalysis(userId, resumeId);
  const result = await ai.improveResume({ text: prepareForAI(resume.extractedText), analysis: analysis.data });
  analysis.improvements = result; await analysis.save();
  return result;
}
