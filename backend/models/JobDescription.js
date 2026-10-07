import mongoose from 'mongoose';
const { Schema } = mongoose;

const jdSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  resume: { type: Schema.Types.ObjectId, ref: 'Resume', required: true },
  title: { type: String, default: 'Untitled role' },
  text: { type: String, required: true, select: false },
  match: Schema.Types.Mixed,
  matchPercentage: Number,
}, { timestamps: true });

export default mongoose.model('JobDescription', jdSchema);
