import MockInterview from '../models/MockInterview.js';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import { ApiError } from '../utils/ApiError.js';
import { summarizeAnalysis } from './ai/prompts.js';
import * as ai from './ai/aiService.js';
import { notify } from './notificationService.js';

const transcriptOf = (turns) => turns.map((t) => `${t.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${t.content}`).join('\n');
const setupOf = (iv) => ({ domain: iv.domain, role: iv.role, difficulty: iv.difficulty, type: iv.type });

async function contextFor(userId, resumeId) {
  const analysis = resumeId
    ? await ResumeAnalysis.findOne({ resume: resumeId, user: userId })
    : await ResumeAnalysis.findOne({ user: userId }).sort('-createdAt');
  return { analysis, context: analysis ? summarizeAnalysis(analysis.data) : 'No resume available.' };
}

export async function start(userId, input) {
  const { analysis, context } = await contextFor(userId, input.resumeId);
  const setup = { domain: input.domain, role: input.role, difficulty: input.difficulty, type: input.type };
  const first = await ai.nextInterviewTurn({ setup, context, transcript: '', index: 1, total: input.totalQuestions });
  return MockInterview.create({
    user: userId, resume: analysis?.resume, ...setup, totalQuestions: input.totalQuestions,
    turns: [{ role: 'interviewer', content: first.question }],
  });
}

async function finalize(iv, context) {
  iv.result = await ai.interviewReport({ setup: setupOf(iv), context, transcript: transcriptOf(iv.turns) });
  iv.status = 'completed';
  await iv.save();
  await notify(iv.user, 'interview_completed', 'Mock interview completed', `Overall score: ${iv.result.overallScore}%`, `/mock-interview/${iv._id}`);
  return iv;
}

export async function answer(userId, id, text) {
  const iv = await MockInterview.findOne({ _id: id, user: userId });
  if (!iv) throw new ApiError(404, 'Interview not found');
  if (iv.status !== 'in_progress') throw new ApiError(400, 'This interview is already completed');
  const { context } = await contextFor(userId, iv.resume);
  const turns = [...iv.turns.map((t) => t.toObject()), { role: 'candidate', content: text }];
  const answered = turns.filter((t) => t.role === 'candidate').length;
  // Compute AI output before mutating, so an AI failure leaves the interview untouched.
  if (answered >= iv.totalQuestions) {
    iv.turns.push({ role: 'candidate', content: text });
    return finalize(iv, context);
  }
  const next = await ai.nextInterviewTurn({ setup: setupOf(iv), context, transcript: transcriptOf(turns), index: answered + 1, total: iv.totalQuestions });
  iv.turns.push({ role: 'candidate', content: text }, { role: 'interviewer', content: next.question, reaction: next.reaction });
  await iv.save();
  return iv;
}

export async function finish(userId, id) {
  const iv = await MockInterview.findOne({ _id: id, user: userId });
  if (!iv) throw new ApiError(404, 'Interview not found');
  if (iv.status === 'completed') return iv;
  if (!iv.turns.some((t) => t.role === 'candidate')) throw new ApiError(400, 'Answer at least one question before finishing');
  const { context } = await contextFor(userId, iv.resume);
  return finalize(iv, context);
}

export const list = (userId) => MockInterview.find({ user: userId }).sort('-createdAt').limit(50).select('-turns');
export async function getOne(userId, id) {
  const iv = await MockInterview.findOne({ _id: id, user: userId });
  if (!iv) throw new ApiError(404, 'Interview not found');
  return iv;
}
