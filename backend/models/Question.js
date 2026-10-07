import mongoose from 'mongoose';
const { Schema } = mongoose;

const questionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  resume: { type: Schema.Types.ObjectId, ref: 'Resume', required: true },
  jobDescription: { type: Schema.Types.ObjectId, ref: 'JobDescription' },
  category: { type: String, required: true },
  categoryType: { type: String, enum: ['hr', 'domain', 'skill', 'project', 'resume', 'behavioral'], required: true },
  domain: String,
  skill: String,
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  question: { type: String, required: true },
  normalized: { type: String, index: true },
  hint: String,
  idealConcepts: [String],
  reported: { type: Boolean, default: false },
  reportReason: String,
}, { timestamps: true });

questionSchema.index({ user: 1, resume: 1, category: 1, difficulty: 1 });
questionSchema.index({ question: 'text', skill: 'text', category: 'text' });

export default mongoose.model('Question', questionSchema);
