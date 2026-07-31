import bcrypt from 'bcryptjs';
import { User, Branch } from '../models/index.js';
import catchAsync from '../utils/catchAsync.js';
import ApiResponse from '../utils/ApiResponse.js';
import AppError from '../utils/AppError.js';

const USER_ATTRIBUTES = { exclude: ['password', 'reset_token', 'reset_token_expiry'] };
const BRANCH_INCLUDE = [{ model: Branch, as: 'branch' }];

export const getAllUsers = catchAsync(async (req, res) => {
  const users = await User.findAll({
    where: { registration_status: 'Approved' },
    attributes: USER_ATTRIBUTES,
    include: BRANCH_INCLUDE,
    order: [['created_at', 'DESC']]
  });
  ApiResponse.success(res, users);
});

export const getPendingUsers = catchAsync(async (req, res) => {
  const users = await User.findAll({
    where: { registration_status: 'Pending' },
    attributes: USER_ATTRIBUTES,
    include: BRANCH_INCLUDE,
    order: [['created_at', 'DESC']]
  });
  ApiResponse.success(res, users);
});

export const getRejectedUsers = catchAsync(async (req, res) => {
  const users = await User.findAll({
    where: { registration_status: 'Rejected' },
    attributes: USER_ATTRIBUTES,
    include: BRANCH_INCLUDE,
    order: [['updated_at', 'DESC']]
  });
  ApiResponse.success(res, users);
});

// Public self-registration — creates inactive pending user
export const selfRegister = catchAsync(async (req, res) => {
  const { full_name, username, email, password, branch_id, department } = req.body;

  if (!full_name || !username || !email || !password || !branch_id) {
    throw new AppError('Full name, username, email, password and branch are required', 400);
  }
  if (password.length < 6) throw new AppError('Password must be at least 6 characters', 400);

  // Check email — skip if only rejected (allow re-registration after rejection)
  const existingEmail = await User.findOne({ where: { email } });
  if (existingEmail) {
    if (existingEmail.registration_status === 'Rejected') {
      // Allow re-registration: delete old rejected record
      await existingEmail.destroy();
    } else {
      throw new AppError('Email already registered', 400);
    }
  }

  // Check username — skip if only rejected
  const existingUsername = await User.findOne({ where: { username } });
  if (existingUsername) {
    if (existingUsername.registration_status === 'Rejected') {
      await existingUsername.destroy();
    } else {
      throw new AppError('Username already taken', 400);
    }
  }

  const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);

  await User.create({
    full_name, username, email,
    password: hashedPassword,
    role: 'User',
    branch_id,
    department: department || null,
    is_active: false,
    registration_status: 'Pending'
  });

  ApiResponse.created(res, null, 'Registration submitted. Please wait for Admin approval before logging in.');
});

export const approveUser = catchAsync(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  if (user.registration_status !== 'Pending') throw new AppError('User is not pending approval', 400);

  await user.update({ registration_status: 'Approved', is_active: true });
  ApiResponse.success(res, null, 'User approved successfully');
});

export const rejectUser = catchAsync(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  if (user.registration_status !== 'Pending') throw new AppError('User is not pending approval', 400);

  await user.update({ registration_status: 'Rejected', is_active: false });
  ApiResponse.success(res, null, 'User rejected');
});

export const createUser = catchAsync(async (req, res) => {
  const { username, email, password, role, branch_id, full_name, department } = req.body;

  const existing = await User.findOne({ where: { email } });
  if (existing) throw new AppError('Email already exists', 400);

  const existingUsername = await User.findOne({ where: { username } });
  if (existingUsername) throw new AppError('Username already taken', 400);

  const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);

  const user = await User.create({
    full_name, username, email, password: hashedPassword,
    role, branch_id, department,
    is_active: true, registration_status: 'Approved'
  });

  ApiResponse.created(res, { id: user.id, username: user.username, email: user.email, role: user.role }, 'User created');
});

export const updateUser = catchAsync(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw new AppError('User not found', 404);

  const { username, email, role, branch_id, is_active, full_name, department } = req.body;
  await user.update({ username, email, role, branch_id, is_active, full_name, department });

  ApiResponse.success(res, { id: user.id, username: user.username, email: user.email, role: user.role, is_active: user.is_active }, 'User updated');
});

export const resetUserPassword = catchAsync(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw new AppError('User not found', 404);

  const hashedPassword = await bcrypt.hash(req.body.password, parseInt(process.env.BCRYPT_ROUNDS) || 10);
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
