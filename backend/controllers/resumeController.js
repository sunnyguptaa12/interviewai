import fs from 'fs';
import * as svc from '../services/resume/resumeService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const upload = asyncHandler(async (req, res) =>
  sendSuccess(res, { resume: await svc.createFromUpload(req.user._id, req.file) }, 'Resume uploaded', 201));
export const list = asyncHandler(async (req, res) => sendSuccess(res, { resumes: await svc.list(req.user._id) }));
export const getOne = asyncHandler(async (req, res) =>
  sendSuccess(res, { resume: await svc.getOwned(req.user._id, req.params.id, { withText: req.query.includeText === '1' }) }));
export const getAnalysis = asyncHandler(async (req, res) =>
  sendSuccess(res, { analysis: await svc.getAnalysis(req.user._id, req.params.id) }));
export const remove = asyncHandler(async (req, res) => { await svc.remove(req.user._id, req.params.id); sendSuccess(res, {}, 'Resume deleted'); });

// Files are only streamed after an ownership check; there is no public URL.
export const file = (disposition) => asyncHandler(async (req, res) => {
  const r = await svc.getOwned(req.user._id, req.params.id, { withPath: true });
  res.setHeader('Content-Type', r.mimeType);
  res.setHeader('Content-Disposition', `${disposition}; filename*=UTF-8''${encodeURIComponent(r.originalName)}`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  fs.createReadStream(r.filePath).on('error', () => res.destroy()).pipe(res);
});
