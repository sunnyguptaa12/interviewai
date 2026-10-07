import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

export async function getProfile(userId) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

export async function updateProfile(userId, updates) {
  const user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true, runValidators: true });
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}
