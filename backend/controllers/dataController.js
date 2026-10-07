import * as questionSvc from '../services/questionService.js';
import * as answerSvc from '../services/answerService.js';
import * as interviewSvc from '../services/interviewService.js';
import * as jobSvc from '../services/job/jobMatchService.js';
import * as planSvc from '../services/learningPlanService.js';
import * as analyticsSvc from '../services/analyticsService.js';
import * as notifSvc from '../services/notificationService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';

const uid = (req) => req.user._id;
const ok = (fn, msg) => asyncHandler(async (req, res) => sendSuccess(res, await fn(req), msg));

export const questions = {
  list: ok((r) => questionSvc.list(uid(r), r.query)),
  categories: ok(async (r) => ({ categories: await questionSvc.categories(uid(r), r.query.resumeId) })),
  getOne: ok(async (r) => ({ question: await questionSvc.getOne(uid(r), r.params.id) })),
  report: ok(async (r) => { await questionSvc.report(uid(r), r.params.id, r.body.reason); return {}; }, 'Question reported'),
};
export const answers = { history: ok((r) => answerSvc.history(uid(r), r.query)) };
export const interviews = {
  list: ok(async (r) => ({ interviews: await interviewSvc.list(uid(r)) })),
  getOne: ok(async (r) => ({ interview: await interviewSvc.getOne(uid(r), r.params.id) })),
  answer: ok(async (r) => ({ interview: await interviewSvc.answer(uid(r), r.params.id, r.body.answer) })),
  finish: ok(async (r) => ({ interview: await interviewSvc.finish(uid(r), r.params.id) })),
};
export const jobs = {
  list: ok(async (r) => ({ jobDescriptions: await jobSvc.list(uid(r)) })),
  getOne: ok(async (r) => ({ jobDescription: await jobSvc.getOne(uid(r), r.params.id) })),
  remove: ok(async (r) => { await jobSvc.remove(uid(r), r.params.id); return {}; }, 'Deleted'),
};
export const plans = {
  list: ok(async (r) => ({ plans: await planSvc.list(uid(r)) })),
  setTopic: ok(async (r) => ({ plan: await planSvc.setTopic(uid(r), r.params.id, r.body) })),
  remove: ok(async (r) => { await planSvc.remove(uid(r), r.params.id); return {}; }, 'Deleted'),
};
export const analytics = ok((r) => analyticsSvc.getAnalytics(uid(r)));
export const progress = ok((r) => analyticsSvc.getProgress(uid(r)));
export const notifications = {
  list: ok(async (r) => ({ notifications: await notifSvc.list(uid(r)), unread: await notifSvc.unreadCount(uid(r)) })),
  unread: ok(async (r) => ({ unread: await notifSvc.unreadCount(uid(r)) })),
  read: ok(async (r) => { await notifSvc.markRead(uid(r), r.params.id); return {}; }),
  readAll: ok(async (r) => { await notifSvc.markAllRead(uid(r)); return {}; }),
};
