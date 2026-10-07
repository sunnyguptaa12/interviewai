import * as userService from '../services/userService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const getProfile = asyncHandler(async (req, res) =>
  sendSuccess(res, { user: await userService.getProfile(req.user._id) }));

export const updateProfile = asyncHandler(async (req, res) =>
  sendSuccess(res, { user: await userService.updateProfile(req.user._id, req.body) }, 'Profile updated'));
