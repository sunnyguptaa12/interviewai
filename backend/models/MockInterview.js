import mongoose from 'mongoose';
const { Schema } = mongoose;

const turnSchema = new Schema({
  role: { type: String, enum: ['interviewer', 'candidate'], required: true },
  content: { type: String, required: true },
  reaction: String,
}, { _id: false });

const mockInterviewSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  resume: { type: Schema.Types.ObjectId, ref: 'Resume' },
  domain: String, role: String,
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
  type: { type: String, enum: ['hr', 'technical', 'behavioral', 'project', 'mixed'] },
  totalQuestions: Number,
  status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
  turns: [turnSchema],
  result: Schema.Types.Mixed, // interview result (scores + feedback)
}, { timestamps: true });

export default mongoose.model('MockInterview', mockInterviewSchema);
