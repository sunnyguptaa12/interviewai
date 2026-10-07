import mongoose from 'mongoose';
const { Schema } = mongoose;

const answerSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  question: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
  resume: { type: Schema.Types.ObjectId, ref: 'Resume' },
  // denormalized so analytics never needs a $lookup
  category: String, categoryType: String, difficulty: String, skill: String, domain: String,
  answerText: String,
  skipped: { type: Boolean, default: false },
  score: Number,
  evaluation: Schema.Types.Mixed,
}, { timestamps: true });

answerSchema.index({ user: 1, createdAt: -1 });
answerSchema.index({ user: 1, question: 1 });

export default mongoose.model('Answer', answerSchema);
