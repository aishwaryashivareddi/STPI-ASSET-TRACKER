# Forgot Password Feature

## Overview
Complete password reset functionality has been added to the STPI Asset Tracker application.

## Features Implemented

### Frontend Components
1. **ForgotPassword.jsx** - Request password reset
2. **ResetPassword.jsx** - Set new password with token
3. **Updated Login.jsx** - Added "Forgot Password?" link

### Backend Implementation
1. **Password Reset Routes**
   - `POST /api/auth/forgot-password` - Request reset
   - `POST /api/auth/reset-password` - Reset password

2. **Database Changes**
   - Added `reset_token` field to users table
   - Added `reset_token_expiry` field to users table

## Setup Instructions

### 1. Run Database Migration
```bash
cd backend
node migrateResetToken.js
```

### 2. Restart Backend Server
```bash
npm run dev
```

### 3. Frontend is Ready
The frontend routes are already configured in App.jsx

## How It Works

### User Flow
1. User clicks "Forgot Password?" on login page
2. User enters their email address
3. System generates a reset token (valid for 1 hour)
4. Reset link is displayed in console (in production, send via email)
5. User clicks reset link with token
6. User enters new password
7. Password is updated and user can login

### Security Features
- Reset tokens expire after 1 hour
- Tokens are single-use (cleared after reset)
- Passwords are hashed with bcrypt
- Invalid/expired tokens are rejected
- Email validation before sending reset link

## API Endpoints

### Request Password Reset
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@stpi.in"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset link sent to email",
  "data": {
    "resetUrl": "http://localhost:5173/reset-password?token=abc123..."
  }
}
```

### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "abc123...",
  "password": "newPassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

## Testing

### Test with Default Users
1. Go to http://localhost:5173
2. Click "Forgot Password?"
3. Enter: `admin@stpi.in`
4. Check backend console for reset link
5. Copy the reset URL and paste in browser
6. Enter new password
7. Login with new password

## Production Deployment

### Email Integration (Required for Production)
Replace the console.log in `authController.js` with actual email sending:

```javascript
// Install nodemailer
npm install nodemailer

// In authController.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// In forgotPassword function
await transporter.sendMail({
  from: 'noreply@stpi.in',
  to: user.email,
  subject: 'Password Reset Request',
  html: `
    <h2>Password Reset Request</h2>
    <p>Click the link below to reset your password:</p>
    <a href="${resetUrl}">${resetUrl}</a>
    <p>This link expires in 1 hour.</p>
  `
});
```

### Environment Variables
Add to `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FRONTEND_URL=https://yourdomain.com
```

## File Structure
```
frontend/src/
├── ForgotPassword.jsx    # Request reset page
├── ResetPassword.jsx     # Reset password page
├── Login.jsx             # Updated with forgot link
├── App.jsx               # Updated with new routes
└── api.js                # Updated with new endpoints

backend/
├── controllers/
│   └── authController.js # Added forgot/reset functions
├── routes/
│   └── authRoutes.js     # Added new routes
├── models/
│   └── User.js           # Added reset token fields
└── migrateResetToken.js  # Database migration
```

## Troubleshooting

### Reset link not working
- Check token hasn't expired (1 hour limit)
- Verify database migration ran successfully
- Check backend console for errors

### Email not in database
- Ensure user exists with `is_active = true`
- Check email spelling

### Token expired
- Request a new reset link
- Tokens are valid for 1 hour only

## Security Notes
- Never expose reset tokens in production logs
- Always use HTTPS in production
- Consider rate limiting on forgot password endpoint
- Monitor for abuse/spam attempts
- Implement CAPTCHA for production use
