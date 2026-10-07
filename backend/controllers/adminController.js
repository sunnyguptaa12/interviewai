import * as svc from '../services/adminService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';

const ok = (fn, msg) => asyncHandler(async (req, res) => sendSuccess(res, await fn(req), msg));
export const statistics = ok(async () => ({ statistics: await svc.statistics(), categories: await svc.categorySummary() }));
export const users = ok((r) => svc.listUsers(r.query));
export const updateUser = ok(async (r) => ({ user: await svc.updateUser(r.user._id, r.params.id, r.body) }), 'User updated');
export const deleteUser = ok(async (r) => { await svc.deleteUser(r.user._id, r.params.id); return {}; }, 'User deleted');
export const questions = ok((r) => svc.listQuestions(r.query));
export const deleteQuestion = ok(async (r) => { await svc.deleteQuestion(r.params.id); return {}; }, 'Question deleted');
export const dismissReport = ok(async (r) => ({ question: await svc.dismissReport(r.params.id) }), 'Report dismissed');
