import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const educationSchema = new mongoose.Schema({ degree: String, institution: String, year: String }, { _id: false });
const experienceSchema = new mongoose.Schema({ title: String, company: String, duration: String, description: String }, { _id: false });

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ['candidate', 'admin'], default: 'candidate' },
    phone: { type: String, trim: true },
    profilePhoto: { type: String },
    education: [educationSchema],
    experience: [experienceSchema],
    domain: { type: String, trim: true },
    skills: [{ type: String, trim: true }],
    targetRole: { type: String, trim: true },
    preferredIndustry: { type: String, trim: true },
    linkedinUrl: { type: String, trim: true },
    githubUrl: { type: String, trim: true },
    portfolioUrl: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.set('toJSON', { transform: (_doc, ret) => { delete ret.password; delete ret.__v; return ret; } });

export default mongoose.model('User', userSchema);
