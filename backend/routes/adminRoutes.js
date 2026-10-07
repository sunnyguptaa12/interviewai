import { Router } from 'express';
import * as c from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { adminUserUpdateSchema } from '../validators/aiValidators.js';

const router = Router();
router.use(protect, authorize('admin'));
router.get('/statistics', c.statistics);
router.get('/users', c.users);
router.patch('/users/:id', validate(adminUserUpdateSchema), c.updateUser);
router.delete('/users/:id', c.deleteUser);
router.get('/questions', c.questions);
router.delete('/questions/:id', c.deleteQuestion);
router.patch('/questions/:id/dismiss-report', c.dismissReport);
export default router;
