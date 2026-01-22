import jwt from 'jsonwebtoken';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { User } from '../models/index.js';

export const authenticate = catchAsync(async (req, res, next) => {
  let token;
  
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
  const user = await User.findOne({
    where: { id: decoded.id, is_active: true },
    attributes: ['id', 'username', 'email', 'role', 'branch_id', 'is_active']
  });

  if (!user) {
    return next(new AppError('User no longer exists or is inactive.', 401));
  }

  req.user = user.toJSON();
  next();
});

export const authorize = (...roles) => {
  return (req, res, next) => {
    console.log('Authorization check - User role:', req.user?.role);
    console.log('Required roles:', roles);
    console.log('User object:', req.user);
    
    if (!roles.includes(req.user.role)) {
      console.log('Authorization failed - role not in allowed roles');
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    console.log('Authorization passed');
    next();
  };
};
