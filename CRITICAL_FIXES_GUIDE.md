# 🚀 Critical Gaps - Quick Fix Guide

This guide helps you fix the **2 critical gaps** identified in the gap analysis before production deployment.

---

## 🔴 CRITICAL GAP #1: Input Validation

### Step 1: Create Validation Files

Create `backend/validators/authValidator.js`:
```javascript
import { body, validationResult } from 'express-validator';

export const validateLogin = [
  body('email')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

export const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3 }).withMessage('Username must be at least 3 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['Admin', 'Manager', 'User', 'Auditor', 'Viewer']).withMessage('Invalid role'),
  body('branch_id')
    .isInt().withMessage('Branch ID must be a number')
];

export const validateForgotPassword = [
  body('email')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail()
];

export const validateResetPassword = [
  body('token')
    .notEmpty().withMessage('Token is required')
    .isLength({ min: 32 }).withMessage('Invalid token format'),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};
```

Create `backend/validators/assetValidator.js`:
```javascript
import { body } from 'express-validator';
import { handleValidationErrors } from './authValidator.js';

export const validateCreateAsset = [
  body('name')
    .trim()
    .notEmpty().withMessage('Asset name is required')
    .isLength({ max: 255 }).withMessage('Name too long'),
  body('asset_type')
    .isIn(['HSDC', 'COMPUTER', 'ELECTRICAL', 'OFFICE', 'FURNITURE', 'FIREFIGHTING', 'BUILDING'])
    .withMessage('Invalid asset type'),
  body('branch_id')
    .isInt().withMessage('Branch ID must be a number'),
  body('quantity')
    .optional()
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('purchase_value')
    .optional()
    .isFloat({ min: 0 }).withMessage('Purchase value must be positive'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Location too long'),
  body('po_number')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('PO number too long'),
  handleValidationErrors
];

export const validateTestingStatus = [
  body('testing_status')
    .isIn(['Passed', 'Failed']).withMessage('Invalid testing status'),
  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Remarks too long'),
  handleValidationErrors
];
```

### Step 2: Update Routes

Update `backend/routes/authRoutes.js`:
```javascript
import express from 'express';
import { register, login, getProfile, updatePassword, forgotPassword, resetPassword } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { 
  validateLogin, 
  validateRegister, 
  validateForgotPassword, 
  validateResetPassword 
} from '../validators/authValidator.js';

const router = express.Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);
router.get('/profile', authenticate, getProfile);
router.get('/me', authenticate, getProfile);
router.patch('/update-password', authenticate, updatePassword);

export default router;
```

Update `backend/routes/assetRoutes.js`:
```javascript
import express from 'express';
import { /* ... existing imports */ } from '../controllers/assetController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { assetFileUpload } from '../middleware/fileUpload.js';
import { validateCreateAsset, validateTestingStatus } from '../validators/assetValidator.js';

const router = express.Router();

router.post('/', authenticate, assetFileUpload, validateCreateAsset, createAsset);
router.post('/:id/testing', authenticate, authorize('Admin', 'Manager'), assetFileUpload, validateTestingStatus, confirmTesting);
// ... other routes

export default router;
```

---

## 🔴 CRITICAL GAP #2: Email Service

### Step 1: Install Nodemailer

```bash
cd backend
npm install nodemailer
```

### Step 2: Update .env

Add to `backend/.env`:
```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@stpi.in
FRONTEND_URL=http://localhost:5173
```

**For Gmail:**
1. Go to Google Account Settings
2. Enable 2-Factor Authentication
3. Generate App Password
4. Use App Password in SMTP_PASS

### Step 3: Create Email Service

Create `backend/services/emailService.js`:
```javascript
import nodemailer from 'nodemailer';
import logger from '../config/logger.js';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    logger.error('Email service error:', error);
  } else {
    logger.info('Email service ready');
  }
});

export const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Password Reset Request - STPI Asset Tracker',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You requested to reset your password for STPI Asset Tracker.</p>
            <p>Click the button below to reset your password:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; background: white; padding: 10px; border-radius: 5px;">
              ${resetUrl}
            </p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2026 STPI Asset Tracker. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    logger.error('Failed to send email:', error);
    throw new Error('Failed to send password reset email');
  }
};

export const sendWelcomeEmail = async (email, username) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Welcome to STPI Asset Tracker',
    html: `
      <h2>Welcome ${username}!</h2>
      <p>Your account has been created successfully.</p>
      <p>You can now login at: ${process.env.FRONTEND_URL}</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Welcome email sent to ${email}`);
  } catch (error) {
    logger.error('Failed to send welcome email:', error);
  }
};

export default { sendPasswordResetEmail, sendWelcomeEmail };
```

### Step 4: Update Auth Controller

Update `backend/controllers/authController.js`:
```javascript
import { sendPasswordResetEmail } from '../services/emailService.js';

// ... existing imports

export const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ where: { email, is_active: true } });

  if (!user) {
    // Don't reveal if email exists (security)
    return ApiResponse.success(res, null, 'If email exists, reset link has been sent');
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

  await user.update({
    reset_token: resetToken,
    reset_token_expiry: resetTokenExpiry
  });

  try {
    // Send email
    await sendPasswordResetEmail(email, resetToken);
    
    ApiResponse.success(res, null, 'Password reset link sent to your email');
  } catch (error) {
    // Rollback token if email fails
    await user.update({
      reset_token: null,
      reset_token_expiry: null
    });
    
    return next(new AppError('Failed to send email. Please try again later.', 500));
  }
});
```

---

## ⚡ BONUS: Rate Limiting on Forgot Password

Update `backend/routes/authRoutes.js`:
```javascript
import rateLimit from 'express-rate-limit';

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 requests per IP
  message: {
    success: false,
    message: 'Too many password reset attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/forgot-password', forgotPasswordLimiter, validateForgotPassword, forgotPassword);
```

---

## ⚡ BONUS: Frontend File Validation

Update `src/Assets.jsx`:
```javascript
const validateFile = (file) => {
  if (!file) return true;
  
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  
  if (file.size > maxSize) {
    alert('File too large. Maximum size is 10MB');
    return false;
  }
  
  if (!allowedTypes.includes(file.type)) {
    alert('Invalid file type. Only images, PDFs, and Word documents are allowed');
    return false;
  }
  
  return true;
};

// In file input onChange:
onChange={(e) => {
  const file = e.target.files[0];
  if (validateFile(file)) {
    setFiles({ ...files, invoice_file: file });
  } else {
    e.target.value = ''; // Clear input
  }
}}
```

---

## 🧪 Testing the Fixes

### Test Input Validation
```bash
# Should fail with validation error
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid","password":"123"}'

# Should succeed
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@stpi.in","password":"admin123"}'
```

### Test Email Service
1. Configure SMTP in .env
2. Request password reset
3. Check your email inbox
4. Click reset link
5. Reset password

### Test Rate Limiting
1. Request password reset 3 times quickly
2. 4th request should be blocked
3. Wait 15 minutes
4. Should work again

---

## ✅ Verification Checklist

- [ ] Input validation working on all endpoints
- [ ] Validation errors return proper messages
- [ ] Email service configured
- [ ] Password reset emails being sent
- [ ] Email templates look good
- [ ] Rate limiting working on forgot password
- [ ] File validation working on frontend
- [ ] All tests passing

---

## 📝 Next Steps

After fixing these critical gaps:

1. Deploy to staging environment
2. Perform security testing
3. Test email delivery
4. Monitor rate limiting
5. Fix any issues found
6. Deploy to production

---

**Estimated Time:** 4-6 hours  
**Priority:** CRITICAL - Must complete before production
