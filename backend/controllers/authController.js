import * as authService from '../services/authService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const register = asyncHandler(async (req, res) =>
  sendSuccess(res, await authService.register(req.body), 'Registration successful', 201));

export const login = asyncHandler(async (req, res) =>
  sendSuccess(res, await authService.login(req.body), 'Login successful'));

export const me = asyncHandler(async (req, res) => sendSuccess(res, { user: req.user }));

// JWT is stateless: the client discards the token.
export const logout = (req, res) => sendSuccess(res, {}, 'Logged out');
