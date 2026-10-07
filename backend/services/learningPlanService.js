import LearningPlan from '../models/LearningPlan.js';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import JobDescription from '../models/JobDescription.js';
import MockInterview from '../models/MockInterview.js';
import { ApiError } from '../utils/ApiError.js';
import { summarizeAnalysis } from './ai/prompts.js';
import * as ai from './ai/aiService.js';
import { getAnalytics, planCompletion } from './analyticsService.js';
import { notify } from './notificationService.js';

const withCompletion = (p) => ({ ...p.toJSON(), completion: planCompletion(p) });

export async function generate(userId, { resumeId, jobDescriptionId }) {
  const analysis = await ResumeAnalysis.findOne({ resume: resumeId, user: userId });
  if (!analysis) throw new ApiError(400, 'Analyze the resume before generating a plan');
  const jd = jobDescriptionId ? await JobDescription.findOne({ _id: jobDescriptionId, user: userId }) : null;
  const [analytics, interviews] = await Promise.all([
    getAnalytics(userId), MockInterview.find({ user: userId, status: 'completed' }).sort('-createdAt').limit(3).select('result'),
  ]);
  const context = [
    `Candidate:\n${summarizeAnalysis(analysis.data)}`, `Resume gaps: ${(analysis.data.missingSkills || []).join(', ') || 'n/a'}`,
    jd ? `Target job "${jd.title}" - missing skills: ${jd.match.missingSkills.join(', ')}; gaps: ${jd.match.skillGaps.join('; ')}` : '',
    `Weakest practice categories: ${analytics.weakest.map((c) => `${c.name} ${c.score}%`).join(', ') || 'no practice data yet'}`,
    `Mock interview weak areas: ${interviews.flatMap((i) => i.result?.weakAreas || []).join(', ') || 'none yet'}`,
  ].filter(Boolean).join('\n');
  const result = await ai.generateLearningPlan({ context });
  const plan = await LearningPlan.create({
    user: userId, resume: resumeId, jobDescription: jd?._id, title: result.title || 'Interview preparation plan',
    weeks: result.weeks.map((w, i) => ({ week: w.week || i + 1, focus: w.focus, topics: w.topics.map((t) => ({ ...t, done: false })) })),
  });
  await notify(userId, 'plan_generated', 'Learning plan ready', plan.title, '/learning-plan');
  return withCompletion(plan);
}

export async function list(userId) {
  return (await LearningPlan.find({ user: userId }).sort('-createdAt').limit(10)).map(withCompletion);
}

export async function setTopic(userId, id, { weekIndex, topicIndex, done }) {
  const plan = await LearningPlan.findOne({ _id: id, user: userId });
  const topic = plan?.weeks[weekIndex]?.topics[topicIndex];
  if (!topic) throw new ApiError(404, 'Plan topic not found');
  topic.done = !!done;
  plan.markModified('weeks');
  await plan.save();
  return withCompletion(plan);
}

export async function remove(userId, id) {
  const res = await LearningPlan.deleteOne({ _id: id, user: userId });
  if (!res.deletedCount) throw new ApiError(404, 'Plan not found');
}
