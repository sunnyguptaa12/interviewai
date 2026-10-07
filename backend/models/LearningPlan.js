import mongoose from 'mongoose';
const { Schema } = mongoose;

const topicSchema = new Schema({ title: String, description: String, done: { type: Boolean, default: false } }, { _id: false });
const weekSchema = new Schema({ week: Number, focus: String, topics: [topicSchema] }, { _id: false });

const planSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  resume: { type: Schema.Types.ObjectId, ref: 'Resume' },
  jobDescription: { type: Schema.Types.ObjectId, ref: 'JobDescription' },
  title: String,
  weeks: [weekSchema],
}, { timestamps: true });

export default mongoose.model('LearningPlan', planSchema);
