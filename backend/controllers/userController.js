import bcrypt from 'bcryptjs';
import { User, Branch } from '../models/index.js';
import catchAsync from '../utils/catchAsync.js';
import ApiResponse from '../utils/ApiResponse.js';
import AppError from '../utils/AppError.js';

export const getAllUsers = catchAsync(async (req, res) => {
  const users = await User.findAll({
    attributes: { exclude: ['password', 'reset_token', 'reset_token_expiry'] },
    include: [{ model: Branch, as: 'branch' }],
    order: [['createdAt', 'DESC']]
  });
  ApiResponse.success(res, users);
});

export const createUser = catchAsync(async (req, res) => {
  const { username, email, password, role, branch_id } = req.body;

  const existing = await User.findOne({ where: { email } });
  if (existing) throw new AppError('Email already exists', 400);

  const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS));

  const user = await User.create({ username, email, password: hashedPassword, role, branch_id });

  ApiResponse.created(res, { id: user.id, username: user.username, email: user.email, role: user.role }, 'User created');
});

export const updateUser = catchAsync(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw new AppError('User not found', 404);

  const { username, email, role, branch_id, is_active } = req.body;
  await user.update({ username, email, role, branch_id, is_active });

  ApiResponse.success(res, { id: user.id, username: user.username, email: user.email, role: user.role, is_active: user.is_active }, 'User updated');
});

export const resetUserPassword = catchAsync(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw new AppError('User not found', 404);

  const hashedPassword = await bcrypt.hash(req.body.password, parseInt(process.env.BCRYPT_ROUNDS));
  await user.update({ password: hashedPassword });

  ApiResponse.success(res, null, 'Password reset successfully');
});

export const deleteUser = catchAsync(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  if (user.id === req.user.id) throw new AppError('Cannot delete yourself', 400);

  await user.destroy();
  ApiResponse.success(res, null, 'User deleted');
});
