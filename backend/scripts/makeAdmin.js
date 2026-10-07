// Usage: npm run make-admin -- user@example.com
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import User from '../models/User.js';

const email = process.argv[2]?.toLowerCase();
if (!email) { console.error('Usage: npm run make-admin -- <email>'); process.exit(1); }
await mongoose.connect(env.mongoUri);
const user = await User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true });
console.log(user ? `${user.email} is now an admin` : `No user with email ${email}`);
await mongoose.disconnect();
