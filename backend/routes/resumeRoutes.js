import { Router } from 'express';
import * as ctrl from '../controllers/resumeController.js';
import { protect } from '../middleware/auth.js';
import { uploadSingle } from '../middleware/upload.js';

const router = Router();
router.use(protect);
router.post('/upload', uploadSingle('resume'), ctrl.upload);
router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);
router.get('/:id/analysis', ctrl.getAnalysis);
router.get('/:id/file', ctrl.file('inline'));
router.get('/:id/download', ctrl.file('attachment'));
router.delete('/:id', ctrl.remove);
export default router;
