import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as ctrl from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uploadSingle } from '../middleware/upload.js';
import * as v from '../validators/aiValidators.js';

// AI calls cost money: limit per user.
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, limit: 120, standardHeaders: true, legacyHeaders: false,
  keyGenerator: (req) => String(req.user?._id || req.ip),
  message: { success: false, message: 'AI usage limit reached. Please try again later.' },
});

const router = Router();
router.use(protect, aiLimiter);
router.post('/analyze-resume', validate(v.resumeIdSchema), ctrl.analyzeResume);
router.post('/resume-improvement', validate(v.resumeIdSchema), ctrl.resumeImprovement);
router.post('/generate-questions', validate(v.generateQuestionsSchema), ctrl.generateQuestions);
router.post('/evaluate-answer', validate(v.answerSchema), ctrl.evaluateAnswer);
router.post('/mock-interview', validate(v.mockStartSchema), ctrl.startMockInterview);
router.post('/job-match', uploadSingle('file'), validate(v.jobMatchSchema), ctrl.jobMatch);
router.post('/learning-plan', validate(v.learningPlanSchema), ctrl.learningPlan);
router.post('/recommendations', ctrl.recommendations);
export default router;
