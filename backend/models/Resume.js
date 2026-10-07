import mongoose from 'mongoose';
const { Schema } = mongoose;

const resumeSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  originalName: { type: String, required: true },
  storedName: String,
  filePath: { type: String, select: false },
  mimeType: String,
  size: Number,
  extractedText: { type: String, select: false },
  textLength: Number,
  status: { type: String, enum: ['uploaded', 'analyzing', 'analyzed', 'failed'], default: 'uploaded' },
  analysis: { type: Schema.Types.ObjectId, ref: 'ResumeAnalysis' },
  error: String,
}, { timestamps: true });

export default mongoose.model('Resume', resumeSchema);
