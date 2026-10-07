import fs from 'fs/promises';
import User from '../models/User.js';
import Resume from '../models/Resume.js';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import JobDescription from '../models/JobDescription.js';
import Question from '../models/Question.js';
import Answer from '../models/Answer.js';
import MockInterview from '../models/MockInterview.js';
import LearningPlan from '../models/LearningPlan.js';
import Notification from '../models/Notification.js';
import { ApiError } from '../utils/ApiError.js';
import { cached } from '../utils/cache.js';
import { getPagination, paginated } from '../utils/pagination.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const statistics = () => cached('admin:stats', 30_000, async () => {
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const [users, active, resumes, interviews, questions, reported, avg] = await Promise.all([
    User.countDocuments(), User.countDocuments({ lastLoginAt: { $gte: since } }), Resume.countDocuments(),
    MockInterview.countDocuments(), Question.countDocuments(), Question.countDocuments({ reported: true }),
    Answer.aggregate([{ $match: { skipped: false } }, { $group: { _id: null, avg: { $avg: '$score' } } }]),
  ]);
  return { totalUsers: users, activeUsers: active, totalResumes: resumes, totalInterviews: interviews, totalQuestions: questions,
    reportedQuestions: reported, averageScore: avg[0] ? Math.round(avg[0].avg * 10) : null };
});

export async function listUsers(query) {
  const pg = getPagination(query, 20);
  const filter = {};
  if (query.role) filter.role = query.role;
  if (query.search) { const r = new RegExp(escapeRegex(String(query.search).slice(0, 80)), 'i'); filter.$or = [{ name: r }, { email: r }]; }
  const [items, total] = await Promise.all([User.find(filter).sort('-createdAt').skip(pg.skip).limit(pg.limit), User.countDocuments(filter)]);
  return paginated(items, total, pg);
}

export async function updateUser(adminId, id, { isActive, role }) {
  if (String(adminId) === String(id)) throw new ApiError(400, 'You cannot modify your own account here');
  const updates = {};
  if (typeof isActive === 'boolean') updates.isActive = isActive;
  if (['candidate', 'admin'].includes(role)) updates.role = role;
  const user = await User.findByIdAndUpdate(id, updates, { new: true });
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

export async function deleteUser(adminId, id) {
  if (String(adminId) === String(id)) throw new ApiError(400, 'You cannot delete your own account');
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, 'User not found');
  const resumes = await Resume.find({ user: id }).select('+filePath');
  await Promise.all(resumes.map((r) => (r.filePath ? fs.unlink(r.filePath).catch(() => {}) : null)));
  await Promise.all([Resume, ResumeAnalysis, JobDescription, Question, Answer, MockInterview, LearningPlan, Notification]
    .map((M) => M.deleteMany({ user: id })));
  await user.deleteOne();
}

export async function listQuestions(query) {
  const pg = getPagination(query, 20);
  const filter = {};
  if (query.reported === 'true') filter.reported = true;
  if (query.category) filter.category = query.category;
  if (query.search) filter.question = { $regex: escapeRegex(String(query.search).slice(0, 100)), $options: 'i' };
  const [items, total] = await Promise.all([
    Question.find(filter).sort('-createdAt').skip(pg.skip).limit(pg.limit).populate('user', 'name email').select('-normalized'),
    Question.countDocuments(filter),
  ]);
  return paginated(items, total, pg);
}

export async function categorySummary() {
  return Question.aggregate([{ $group: { _id: { name: '$category', domain: '$domain' }, count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 100 },
    { $project: { _id: 0, name: '$_id.name', domain: '$_id.domain', count: 1 } }]);
}

export async function deleteQuestion(id) {
  const q = await Question.findByIdAndDelete(id);
  if (!q) throw new ApiError(404, 'Question not found');
  await Answer.deleteMany({ question: id });
}

export async function dismissReport(id) {
  const q = await Question.findByIdAndUpdate(id, { reported: false, reportReason: undefined }, { new: true });
  if (!q) throw new ApiError(404, 'Question not found');
  return q;
}
