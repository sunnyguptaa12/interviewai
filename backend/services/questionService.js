import mongoose from 'mongoose';
import Question from '../models/Question.js';
import Answer from '../models/Answer.js';
import JobDescription from '../models/JobDescription.js';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import { ApiError } from '../utils/ApiError.js';
import { normalizeQuestion } from '../utils/text.js';
import { getPagination, paginated } from '../utils/pagination.js';
import * as ai from './ai/aiService.js';
import { notify } from './notificationService.js';

const oid = (id) => new mongoose.Types.ObjectId(id);
const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

// Folders are derived from the candidate's own analysis, never from a fixed software list.
export function buildCategoryPlan(data, jd) {
  const plan = [{ name: 'HR', type: 'hr' }];
  (data.domainAreas || []).slice(0, 4).forEach((name) => plan.push({ name, type: 'domain' }));
  const skills = (data.technicalSkills?.length ? data.technicalSkills : data.skills || []).slice(0, 6);
  skills.forEach((name) => plan.push({ name, type: 'skill' }));
  (jd?.missingSkills || []).slice(0, 2).forEach((name) => plan.push({ name, type: 'skill' }));
  plan.push({ name: 'Project-Based', type: 'project' }, { name: 'Resume-Based', type: 'resume' }, { name: 'Behavioral', type: 'behavioral' });
  const seen = new Set();
  return plan.filter((c) => {
    const k = c.name.trim().toLowerCase();
    if (!k || seen.has(k)) return false;
    seen.add(k); return true;
  }).slice(0, 14);
}

export async function generate(userId, { resumeId, jobDescriptionId, category, count = 4 }) {
  const analysisDoc = await ResumeAnalysis.findOne({ resume: resumeId, user: userId });
  if (!analysisDoc) throw new ApiError(400, 'Analyze the resume before generating questions');
  const data = analysisDoc.data;
  let jd = null;
  if (jobDescriptionId) {
    const jdDoc = await JobDescription.findOne({ _id: jobDescriptionId, user: userId });
    if (!jdDoc) throw new ApiError(404, 'Job description not found');
    jd = { ...jdDoc.match, _id: jdDoc._id };
  }

  let plan = buildCategoryPlan(data, jd);
  if (category) {
    const found = plan.find((c) => c.name.toLowerCase() === category.toLowerCase());
    const existingType = await Question.findOne({ user: userId, resume: resumeId, category }).select('categoryType');
    plan = [found || { name: category, type: existingType?.categoryType || 'skill' }];
  }

  const existing = await Question.find({ user: userId, resume: resumeId }).sort('-createdAt').limit(80).select('question category');
  const batches = await Promise.allSettled(chunk(plan, 4).map((cats) =>
    ai.generateQuestions({
      analysis: data, categories: cats, perCategory: count, jd,
      existing: existing.filter((q) => cats.some((c) => c.name === q.category)).slice(0, 20).map((q) => q.question),
    })));
  const ok = batches.filter((b) => b.status === 'fulfilled');
  if (!ok.length) throw batches[0].reason;

  const known = new Set((await Question.find({ user: userId, resume: resumeId }).select('normalized')).map((q) => q.normalized));
  const docs = [];
  for (const b of ok) {
    for (const cat of b.value.categories) {
      const planned = plan.find((c) => c.name.toLowerCase() === cat.name.trim().toLowerCase());
      if (!planned) continue; // ignore categories the model invented
      for (const q of cat.questions) {
        const normalized = normalizeQuestion(q.question);
        if (!normalized || known.has(normalized)) continue;
        known.add(normalized);
        docs.push({
          user: userId, resume: resumeId, jobDescription: jd?._id, category: planned.name, categoryType: planned.type,
          domain: data.domain, skill: q.skill || (planned.type === 'skill' ? planned.name : planned.name),
          difficulty: q.difficulty, question: q.question.trim(), normalized, hint: q.hint, idealConcepts: q.idealConcepts,
        });
      }
    }
  }
  if (!docs.length) throw new ApiError(502, 'AI did not produce any new questions. Please try again.');
  await Question.insertMany(docs);
  await notify(userId, 'questions_generated', 'Questions generated', `${docs.length} new questions are ready`, '/questions');
  return { created: docs.length, failedBatches: batches.length - ok.length, categories: [...new Set(docs.map((d) => d.category))] };
}

export async function categories(userId, resumeId) {
  const match = { user: oid(userId), ...(resumeId && { resume: oid(resumeId) }) };
  const [totals, attempted] = await Promise.all([
    Question.aggregate([{ $match: match }, { $group: { _id: { name: '$category', type: '$categoryType' },
      total: { $sum: 1 }, easy: { $sum: { $cond: [{ $eq: ['$difficulty', 'easy'] }, 1, 0] } },
      medium: { $sum: { $cond: [{ $eq: ['$difficulty', 'medium'] }, 1, 0] } }, hard: { $sum: { $cond: [{ $eq: ['$difficulty', 'hard'] }, 1, 0] } } } }]),
    Answer.aggregate([{ $match: { user: oid(userId), skipped: false } }, { $group: { _id: { category: '$category', question: '$question' } } },
      { $group: { _id: '$_id.category', attempted: { $sum: 1 } } }]),
  ]);
  const att = Object.fromEntries(attempted.map((a) => [a._id, a.attempted]));
  const order = { hr: 0, domain: 1, skill: 2, project: 3, resume: 4, behavioral: 5 };
  return totals.map((t) => ({ name: t._id.name, type: t._id.type, total: t.total, attempted: att[t._id.name] || 0,
    difficulty: { easy: t.easy, medium: t.medium, hard: t.hard } }))
    .sort((a, b) => order[a.type] - order[b.type] || a.name.localeCompare(b.name));
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function list(userId, query) {
  const pg = getPagination(query, 20, 100);
  const filter = { user: userId };
  ['category', 'domain', 'skill', 'difficulty'].forEach((k) => { if (query[k]) filter[k] = query[k]; });
  if (query.resumeId) filter.resume = query.resumeId;
  if (query.search) filter.question = { $regex: escapeRegex(String(query.search).slice(0, 100)), $options: 'i' };

  // attempted/unattempted/score filters use the latest answer per question
  const needsAnswers = query.status || query.minScore || query.maxScore;
  if (needsAnswers) {
    const latest = await Answer.aggregate([{ $match: { user: oid(userId), skipped: false } }, { $sort: { createdAt: -1 } },
      { $group: { _id: '$question', score: { $first: '$score' } } }]);
    const scoreOk = (s) => (query.minScore === undefined || s >= Number(query.minScore)) && (query.maxScore === undefined || s <= Number(query.maxScore));
    const ids = latest.filter((l) => scoreOk(l.score)).map((l) => l._id);
    if (query.minScore !== undefined || query.maxScore !== undefined) filter._id = { $in: ids };
    else if (query.status === 'attempted') filter._id = { $in: latest.map((l) => l._id) };
    else if (query.status === 'unattempted') filter._id = { $nin: latest.map((l) => l._id) };
  }
  const [items, total] = await Promise.all([
    Question.find(filter).sort({ createdAt: 1, _id: 1 }).skip(pg.skip).limit(pg.limit).select('-normalized').lean(),
    Question.countDocuments(filter),
  ]);
  const last = await Answer.aggregate([{ $match: { user: oid(userId), skipped: false, question: { $in: items.map((i) => i._id) } } },
    { $sort: { createdAt: -1 } }, { $group: { _id: '$question', score: { $first: '$score' }, attempts: { $sum: 1 } } }]);
  const byQ = Object.fromEntries(last.map((l) => [String(l._id), l]));
  items.forEach((i) => { i.lastScore = byQ[String(i._id)]?.score ?? null; i.attempts = byQ[String(i._id)]?.attempts ?? 0; });
  return paginated(items, total, pg);
}

export async function getOne(userId, id) {
  const q = await Question.findOne({ _id: id, user: userId });
  if (!q) throw new ApiError(404, 'Question not found');
  return q;
}

export async function report(userId, id, reason) {
  const q = await getOne(userId, id);
  q.reported = true; q.reportReason = String(reason || 'Reported by user').slice(0, 300);
  await q.save();
}
