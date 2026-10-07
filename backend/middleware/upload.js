import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export const UPLOAD_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads');
const MIME = {
  '.pdf': ['application/pdf'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(UPLOAD_ROOT, String(req.user._id));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (MIME[ext]?.includes(file.mimetype)) return cb(null, true);
  cb(new ApiError(400, 'Only PDF and DOCX files are allowed'));
};

export const uploadSingle = (field) =>
  multer({ storage, fileFilter, limits: { fileSize: env.maxUploadMb * 1024 * 1024, files: 1 } }).single(field);
