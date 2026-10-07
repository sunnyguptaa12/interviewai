import mongoose from 'mongoose';
const { Schema } = mongoose;

const analysisSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  resume: { type: Schema.Types.ObjectId, ref: 'Resume', required: true, unique: true },
  domain: { type: String, index: true },
  domainConfidence: Number,
  targetRole: String,
  experienceLevel: String,
  resumeScore: Number,
  data: Schema.Types.Mixed, // zod-validated structured analysis
  improvements: Schema.Types.Mixed,
}, { timestamps: true });

export default mongoose.model('ResumeAnalysis', analysisSchema);
