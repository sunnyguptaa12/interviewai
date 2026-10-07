import mongoose from 'mongoose';
import Answer from '../models/Answer.js';
import Question from '../models/Question.js';
import MockInterview from '../models/MockInterview.js';
import LearningPlan from '../models/LearningPlan.js';
import JobDescription from '../models/JobDescription.js';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import { summarizeAnalysis } from './ai/prompts.js';
import * as ai from './ai/aiService.js';

const oid = (id) => new mongoose.Types.ObjectId(id);
const pct = (v) => (v == null ? null : Math.round(v * 10)); // 0-10 score -> percent
const avg = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
const group = (key, extra = {}) => [{ $group: { _id: key, avg: { $avg: '$score' }, count: { $sum: 1 }, ...extra } }];
const SATISFACTORY = 6;

export async function getAnalytics(userId) {
  const match = { user: oid(userId), skipped: false };
  const [facets] = await Answer.aggregate([{ $match: match }, { $facet: {
    overall: [{ $group: { _id: null, count: { $sum: 1 }, avg: { $avg: '$score' },
      correct: { $sum: { $cond: [{ $gte: ['$score', SATISFACTORY] }, 1, 0] } },
      technical: { $avg: '$evaluation.technicalAccuracy' }, communication: { $avg: '$evaluation.communication' },
      relevance: { $avg: '$evaluation.relevance' }, clarity: { $avg: '$evaluation.clarity' }, completeness: { $avg: '$evaluation.completeness' } } }],
    byCategory: group('$category', { type: { $first: '$categoryType' } }),
    byDifficulty: group('$difficulty'),
    byType: group('$categoryType'),
    daily: [...group({ $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }), { $sort: { _id: -1 } }, { $limit: 60 }],
    weekly: [...group({ y: { $isoWeekYear: '$createdAt' }, w: { $isoWeek: '$createdAt' } }), { $sort: { '_id.y': -1, '_id.w': -1 } }, { $limit: 8 }],
  } }]);

  const o = facets.overall[0] || { count: 0 };
  const categories = facets.byCategory.map((c) => ({ name: c._id, type: c.type, score: pct(c.avg), count: c.count }));
  const ranked = [...categories].sort((a, b) => b.score - a.score);
  const recent = (await Answer.find(match).sort('-createdAt').limit(20).select('score')).map((a) => a.score);
  const last10 = avg(recent.slice(0, 10));
  const prev10 = recent.length >= 20 ? avg(recent.slice(10)) : null;

  const interviews = await MockInterview.find({ user: userId, status: 'completed' }).sort('createdAt').select('type domain role result createdAt');
  const interviewTrend = interviews.map((i) => ({ id: i._id, date: i.createdAt, type: i.type, role: i.role, overall: i.result?.overallScore ?? 0,
    technical: i.result?.technicalScore ?? 0, communication: i.result?.communicationScore ?? 0, relevance: i.result?.relevanceScore ?? 0 }));

  return {
    totals: { attempted: o.count, skipped: await Answer.countDocuments({ user: userId, skipped: true }), correct: o.correct || 0,
      averageScore: pct(o.avg), mockInterviews: interviews.length },
    dimensions: o.count ? { technical: pct(o.technical), communication: pct(o.communication), relevance: pct(o.relevance), clarity: pct(o.clarity), completeness: pct(o.completeness) } : null,
    categories, strongest: ranked.slice(0, 3), weakest: [...ranked].reverse().slice(0, 3),
    difficulty: facets.byDifficulty.map((d) => ({ name: d._id, score: pct(d.avg), count: d.count })),
    types: facets.byType.map((d) => ({ name: d._id, score: pct(d.avg), count: d.count })),
    trend: facets.daily.reverse().map((d) => ({ date: d._id, score: pct(d.avg), count: d.count })),
    weekly: facets.weekly.reverse().map((w) => ({ week: `${w._id.y}-W${String(w._id.w).padStart(2, '0')}`, answered: w.count, score: pct(w.avg) })),
    improvement: last10 != null && prev10 != null ? pct(last10 - prev10) : null,
    interviews: interviewTrend,
    interviewAverage: interviewTrend.length ? Math.round(avg(interviewTrend.map((i) => i.overall))) : null,
  };
}

export async function getProgress(userId) {
  const attemptedIds = await Answer.distinct('question', { user: userId, skipped: false });
  const [total, byCat, attemptedByCat, plans, latestJd, analysis] = await Promise.all([
    Question.countDocuments({ user: userId }),
    Question.aggregate([{ $match: { user: oid(userId) } }, { $group: { _id: '$category', total: { $sum: 1 } } }]),
    Question.aggregate([{ $match: { user: oid(userId), _id: { $in: attemptedIds } } }, { $group: { _id: '$category', attempted: { $sum: 1 } } }]),
    LearningPlan.find({ user: userId }).sort('-createdAt').limit(1),
    JobDescription.findOne({ user: userId }).sort('-createdAt').select('title matchPercentage'),
    ResumeAnalysis.findOne({ user: userId }).sort('-createdAt').select('domain targetRole experienceLevel resumeScore data.technicalSkills data.skills data.missingSkills data.strengths'),
  ]);
  const att = Object.fromEntries(attemptedByCat.map((a) => [a._id, a.attempted]));
  return {
    questions: { total, attempted: attemptedIds.length, completion: total ? Math.round((attemptedIds.length / total) * 100) : 0 },
    categories: byCat.map((c) => ({ name: c._id, total: c.total, attempted: att[c._id] || 0, completion: Math.round(((att[c._id] || 0) / c.total) * 100) })),
    learningPlan: plans[0] ? { id: plans[0]._id, title: plans[0].title, completion: planCompletion(plans[0]) } : null,
    jobMatch: latestJd ? { title: latestJd.title, percentage: latestJd.matchPercentage } : null,
    resume: analysis ? { domain: analysis.domain, targetRole: analysis.targetRole, level: analysis.experienceLevel, score: analysis.resumeScore,
      skills: (analysis.data?.technicalSkills?.length ? analysis.data.technicalSkills : analysis.data?.skills || []).slice(0, 12),
      missingSkills: analysis.data?.missingSkills || [], strengths: analysis.data?.strengths || [] } : null,
  };
}

export function planCompletion(plan) {
  const topics = plan.weeks.flatMap((w) => w.topics);
  return topics.length ? Math.round((topics.filter((t) => t.done).length / topics.length) * 100) : 0;
}

export async function recommend(userId) {
  const [analytics, analysis] = await Promise.all([getAnalytics(userId), ResumeAnalysis.findOne({ user: userId }).sort('-createdAt')]);
  const context = [
    analysis ? `Candidate:\n${summarizeAnalysis(analysis.data)}\nResume weaknesses: ${(analysis.data.missingSkills || []).join(', ')}` : 'No resume analyzed.',
    `Answered: ${analytics.totals.attempted}, average ${analytics.totals.averageScore ?? 'n/a'}%`,
    `Dimensions: ${JSON.stringify(analytics.dimensions)}`,
    `Category scores: ${analytics.categories.map((c) => `${c.name} ${c.score}% (${c.count})`).join('; ') || 'none'}`,
    `Difficulty scores: ${analytics.difficulty.map((d) => `${d.name} ${d.score}%`).join('; ') || 'none'}`,
    `Mock interviews: ${analytics.interviews.map((i) => `${i.type} ${i.overall}%`).join('; ') || 'none'}`,
  ].join('\n');
  return ai.generateRecommendations({ context });
}
