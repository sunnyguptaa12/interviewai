import * as resumeSvc from '../services/resume/resumeService.js';
import * as questionSvc from '../services/questionService.js';
import * as answerSvc from '../services/answerService.js';
import * as interviewSvc from '../services/interviewService.js';
import * as jobSvc from '../services/job/jobMatchService.js';
import * as planSvc from '../services/learningPlanService.js';
import * as analyticsSvc from '../services/analyticsService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';

const uid = (req) => req.user._id;
export const analyzeResume = asyncHandler(async (req, res) =>
  sendSuccess(res, { analysis: await resumeSvc.analyze(uid(req), req.body.resumeId) }, 'Resume analyzed'));
export const resumeImprovement = asyncHandler(async (req, res) =>
  sendSuccess(res, { improvements: await resumeSvc.improvements(uid(req), req.body.resumeId) }));
export const generateQuestions = asyncHandler(async (req, res) =>
  sendSuccess(res, await questionSvc.generate(uid(req), req.body), 'Questions generated', 201));
export const evaluateAnswer = asyncHandler(async (req, res) =>
  sendSuccess(res, { answer: await answerSvc.submit(uid(req), req.body) }, 'Answer saved', 201));
export const startMockInterview = asyncHandler(async (req, res) =>
  sendSuccess(res, { interview: await interviewSvc.start(uid(req), req.body) }, 'Interview started', 201));
export const jobMatch = asyncHandler(async (req, res) =>
  sendSuccess(res, { jobDescription: await jobSvc.match(uid(req), req.body, req.file) }, 'Job match completed', 201));
export const learningPlan = asyncHandler(async (req, res) =>
  sendSuccess(res, { plan: await planSvc.generate(uid(req), req.body) }, 'Learning plan generated', 201));
export const recommendations = asyncHandler(async (req, res) =>
  sendSuccess(res, { recommendations: await analyticsSvc.recommend(uid(req)) }));
