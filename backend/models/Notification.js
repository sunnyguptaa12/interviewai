import mongoose from 'mongoose';
const { Schema } = mongoose;

const notificationSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['resume_analyzed', 'questions_generated', 'interview_completed', 'plan_generated', 'milestone'], required: true },
  title: String, message: String, link: String,
  read: { type: Boolean, default: false },
}, { timestamps: true });
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
