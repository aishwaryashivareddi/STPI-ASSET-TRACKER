import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/index.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

const signToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

export const register = catchAsync(async (req, res, next) => {
  const { username, email, password, role, branch_id } = req.body;
  
  const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS));
  
  const user = await User.create({
    username,
    email,
    password: hashedPassword,
    role: role || 'Viewer',
    branch_id
  });

  ApiResponse.created(res, { id: user.id }, 'User registered successfully');
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email, is_active: true } });

  if (!user) {
    return next(new AppError('Invalid credentials', 401));
  }

  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    return next(new AppError('Invalid credentials', 401));
  }

  const token = signToken(user);

  ApiResponse.success(res, {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      branch_id: user.branch_id
    }
  }, 'Login successful');
});

export const getProfile = catchAsync(async (req, res, next) => {
  ApiResponse.success(res, req.user, 'Profile retrieved successfully');
});

export const updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findByPk(req.user.id);

  const isValidPassword = await bcrypt.compare(currentPassword, user.password);

  if (!isValidPassword) {
    return next(new AppError('Current password is incorrect', 401));
  }

  const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS));

  await user.update({ password: hashedPassword });

  ApiResponse.success(res, null, 'Password updated successfully');
});

export const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ where: { email, is_active: true } });

  if (!user) {
    return ApiResponse.success(res, null, 'If email exists, reset link has been sent');
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date(Date.now() + 3600000);

  await user.update({
    reset_token: resetToken,
    reset_token_expiry: resetTokenExpiry
  });

  try {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      await sendPasswordResetEmail(email, resetToken);
      ApiResponse.success(res, null, 'Password reset link sent to your email');
    } else {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
      console.log('Password Reset Link:', resetUrl);
      ApiResponse.success(res, { resetUrl }, 'Password reset link sent (check console in dev mode)');
    }
  } catch (error) {
    await user.update({ reset_token: null, reset_token_expiry: null });
    return next(new AppError('Failed to send email. Please try again later.', 500));
  }
});

export const resetPassword = catchAsync(async (req, res, next) => {
  const { token, password } = req.body;

  const user = await User.findOne({
    where: {
      reset_token: token,
      is_active: true
    }
  });

  if (!user || !user.reset_token_expiry || user.reset_token_expiry < new Date()) {
    return next(new AppError('Invalid or expired reset token', 400));
  }

  const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS));

  await user.update({
    password: hashedPassword,
    reset_token: null,
    reset_token_expiry: null
  });

  ApiResponse.success(res, null, 'Password reset successfully');
});
