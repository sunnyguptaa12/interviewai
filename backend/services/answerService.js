import Answer from '../models/Answer.js';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import { getOne } from './questionService.js';
import { getPagination, paginated } from '../utils/pagination.js';
import { summarizeAnalysis } from './ai/prompts.js';
import * as ai from './ai/aiService.js';
import { notify } from './notificationService.js';

const MILESTONES = [10, 50, 100, 250, 500];

export async function submit(userId, { questionId, answer, skipped }) {
  const q = await getOne(userId, questionId);
  const base = { user: userId, question: q._id, resume: q.resume, category: q.category, categoryType: q.categoryType,
    difficulty: q.difficulty, skill: q.skill, domain: q.domain };
  if (skipped || !answer) return Answer.create({ ...base, skipped: true });

  const analysis = await ResumeAnalysis.findOne({ resume: q.resume });
  const evaluation = await ai.evaluateAnswer({
    question: q.question, idealConcepts: q.idealConcepts, domain: q.domain,
    context: summarizeAnalysis(analysis?.data), answer,
  });
  const saved = await Answer.create({ ...base, answerText: answer, score: evaluation.score, evaluation });
  const count = await Answer.countDocuments({ user: userId, skipped: false });
  if (MILESTONES.includes(count)) await notify(userId, 'milestone', 'Milestone reached', `You have answered ${count} questions. Keep going!`, '/analytics');
  return saved;
}

export async function history(userId, query) {
  const pg = getPagination(query, 20);
  const filter = { user: userId, ...(query.questionId && { question: query.questionId }), ...(query.category && { category: query.category }) };
  const [items, total] = await Promise.all([
    Answer.find(filter).sort('-createdAt').skip(pg.skip).limit(pg.limit).populate('question', 'question category difficulty'),
    Answer.countDocuments(filter),
  ]);
  return paginated(items, total, pg);
}
