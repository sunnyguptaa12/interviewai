import { Router } from 'express';
import * as c from '../controllers/dataController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as v from '../validators/aiValidators.js';
import { evaluateAnswer } from '../controllers/aiController.js';

const make = (build) => { const r = Router(); r.use(protect); build(r); return r; };

export const questionRoutes = make((r) => {
  r.get('/', c.questions.list);
  r.get('/categories', c.questions.categories);
  r.get('/:id', c.questions.getOne);
  r.post('/:id/report', validate(v.reportSchema), c.questions.report);
});
export const answerRoutes = make((r) => {
  r.post('/', validate(v.answerSchema), evaluateAnswer);
  r.get('/history', c.answers.history);
});
export const interviewRoutes = make((r) => {
  r.get('/', c.interviews.list);
  r.get('/:id', c.interviews.getOne);
  r.post('/:id/answer', validate(v.mockAnswerSchema), c.interviews.answer);
  r.post('/:id/finish', c.interviews.finish);
});
export const jobRoutes = make((r) => {
  r.get('/', c.jobs.list); r.get('/:id', c.jobs.getOne); r.delete('/:id', c.jobs.remove);
});
export const planRoutes = make((r) => {
  r.get('/', c.plans.list); r.patch('/:id/topic', validate(v.topicSchema), c.plans.setTopic); r.delete('/:id', c.plans.remove);
});
export const analyticsRoutes = make((r) => r.get('/', c.analytics));
export const progressRoutes = make((r) => r.get('/', c.progress));
export const notificationRoutes = make((r) => {
  r.get('/', c.notifications.list); r.get('/unread-count', c.notifications.unread);
  r.patch('/read-all', c.notifications.readAll); r.patch('/:id/read', c.notifications.read);
});
