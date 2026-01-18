# 🧪 Forgot Password - Testing Guide

## Prerequisites
- ✅ Backend running on http://localhost:5000
- ✅ Frontend running on http://localhost:5173
- ✅ Database migration completed
- ✅ Test user accounts available

---

## Test Scenario 1: Successful Password Reset

### Step 1: Navigate to Login Page
```
URL: http://localhost:5173
```
**What you should see:**
- Login form with email and password fields
- "Forgot Password?" link below the login button
- Demo credentials section

**Action:** Click "Forgot Password?" link

---

### Step 2: Request Password Reset
```
URL: http://localhost:5173/forgot-password
```
**What you should see:**
- "Forgot Password" heading
- "Enter your email to receive a password reset link" text
- Email input field
- "Send Reset Link" button
- "Back to Login" link

**Action:** 
1. Enter email: `admin@stpi.in`
2. Click "Send Reset Link"

**Expected Result:**
- ✅ Green success message: "Password reset link sent to email"
- ✅ Email field cleared
- ✅ Button shows "Sending..." during request

---

### Step 3: Get Reset Link from Console
```
Check Backend Terminal/Console
```
**What you should see:**
```
Password Reset Link: http://localhost:5173/reset-password?token=abc123def456...
```

**Action:** Copy the entire URL

---

### Step 4: Open Reset Link
```
Paste URL in browser
```
**What you should see:**
- "Reset Password" heading
- "Enter your new password" text
- "New Password" input field
- "Confirm Password" input field
- "Reset Password" button
- "Back to Login" link

**Action:**
1. Enter new password: `newPassword123`
2. Enter confirm password: `newPassword123`
3. Click "Reset Password"

**Expected Result:**
- ✅ Green success message: "Password reset successfully"
- ✅ Auto-redirect to login page after 2 seconds
- ✅ Button shows "Resetting..." during request

---

### Step 5: Login with New Password
```
URL: http://localhost:5173 (auto-redirected)
```
**Action:**
1. Enter email: `admin@stpi.in`
2. Enter password: `newPassword123` (the new password)
3. Click "Login"

**Expected Result:**
- ✅ Successfully logged in
- ✅ Redirected to dashboard
- ✅ User info displayed in header

---

## Test Scenario 2: Invalid Email

### Step 1: Request Reset for Non-Existent Email
```
URL: http://localhost:5173/forgot-password
```
**Action:**
1. Enter email: `nonexistent@stpi.in`
2. Click "Send Reset Link"

**Expected Result:**
- ✅ Success message shown (no user enumeration)
- ✅ No error exposed
- ✅ No token generated in database

---

## Test Scenario 3: Expired Token

### Step 1: Wait for Token to Expire
**Note:** Tokens expire after 1 hour. For testing, you can:
1. Manually update database to set expiry in the past
2. Or wait 1 hour

**Database Query:**
```sql
UPDATE users 
SET reset_token_expiry = DATE_SUB(NOW(), INTERVAL 2 HOUR) 
WHERE email = 'admin@stpi.in';
```

### Step 2: Try to Use Expired Token
```
URL: http://localhost:5173/reset-password?token=expired_token
```
**Action:**
1. Enter new password
2. Click "Reset Password"

**Expected Result:**
- ❌ Red error message: "Invalid or expired reset token"
- ❌ Password not updated
- ❌ Cannot login with new password

---

## Test Scenario 4: Password Validation

### Step 1: Password Too Short
```
URL: http://localhost:5173/reset-password?token=valid_token
```
**Action:**
1. Enter new password: `12345` (only 5 characters)
2. Enter confirm password: `12345`
3. Click "Reset Password"

**Expected Result:**
- ❌ Red error message: "Password must be at least 6 characters"
- ❌ Password not updated

---

### Step 2: Passwords Don't Match
```
URL: http://localhost:5173/reset-password?token=valid_token
```
**Action:**
1. Enter new password: `password123`
2. Enter confirm password: `password456` (different)
3. Click "Reset Password"

**Expected Result:**
- ❌ Red error message: "Passwords do not match"
- ❌ Password not updated

---

## Test Scenario 5: Token Reuse Prevention

### Step 1: Reset Password Successfully
```
Complete Test Scenario 1 (successful reset)
```

### Step 2: Try to Use Same Token Again
```
URL: http://localhost:5173/reset-password?token=already_used_token
```
**Action:**
1. Enter new password
2. Click "Reset Password"

**Expected Result:**
- ❌ Red error message: "Invalid or expired reset token"
- ❌ Token was cleared after first use
- ❌ Cannot reset password again with same token

---

## Test Scenario 6: Multiple Users

### Test with Different Accounts
```
Test emails:
- admin@stpi.in
- manager.hyd@stpi.in
- user.hyd@stpi.in
```

**Action:** Repeat Test Scenario 1 for each user

**Expected Result:**
- ✅ Each user gets unique token
- ✅ Tokens don't interfere with each other
- ✅ Each user can reset independently

---

## Test Scenario 7: UI/UX Testing

### Mobile Responsiveness
**Action:**
1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test on different screen sizes:
   - iPhone SE (375px)
   - iPad (768px)
   - Desktop (1920px)

**Expected Result:**
- ✅ Forms are readable and usable
- ✅ Buttons are clickable
- ✅ Text is not cut off
- ✅ Layout adapts to screen size

---

### Loading States
**Action:**
1. Slow down network in DevTools (Throttling: Slow 3G)
2. Submit forgot password form
3. Submit reset password form

**Expected Result:**
- ✅ Button shows "Sending..." / "Resetting..."
- ✅ Button is disabled during request
- ✅ User cannot double-submit

---

### Navigation
**Action:**
1. Click "Back to Login" on forgot password page
2. Click "Back to Login" on reset password page
3. Use browser back button

**Expected Result:**
- ✅ Navigation works correctly
- ✅ No errors in console
- ✅ Forms reset when navigating away

---

## Test Scenario 8: Security Testing

### SQL Injection Attempt
**Action:**
```
Email: admin@stpi.in' OR '1'='1
```

**Expected Result:**
- ✅ No SQL injection
- ✅ Treated as literal string
- ✅ No error exposed

---

### XSS Attempt
**Action:**
```
Email: <script>alert('XSS')</script>@stpi.in
```

**Expected Result:**
- ✅ No script execution
- ✅ Input sanitized
- ✅ No XSS vulnerability

---

## Test Scenario 9: Database Verification

### Check Token Storage
**Database Query:**
```sql
SELECT email, reset_token, reset_token_expiry 
FROM users 
WHERE email = 'admin@stpi.in';
```

**After requesting reset:**
- ✅ reset_token is populated (64 characters)
- ✅ reset_token_expiry is set (1 hour from now)

**After successful reset:**
- ✅ reset_token is NULL
- ✅ reset_token_expiry is NULL
- ✅ password is updated (hashed)

---

## Test Scenario 10: API Testing

### Using Postman/cURL

#### Request Password Reset
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@stpi.in"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Password reset link sent to email",
  "data": {
    "resetUrl": "http://localhost:5173/reset-password?token=..."
  }
}
```

---

#### Reset Password
```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"abc123...","password":"newPassword123"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Password reset successfully",
  "data": null
}
```

---

## Automated Testing Checklist

### Functional Tests
- [ ] Request reset with valid email
- [ ] Request reset with invalid email
- [ ] Reset password with valid token
- [ ] Reset password with expired token
- [ ] Reset password with invalid token
- [ ] Password validation (min length)
- [ ] Password confirmation matching
- [ ] Token cleared after reset
- [ ] Login with new password

### Security Tests
- [ ] Token expiration works
- [ ] Token is single-use
- [ ] No user enumeration
- [ ] SQL injection prevented
- [ ] XSS prevented
- [ ] CSRF protection (if implemented)

### UI/UX Tests
- [ ] Mobile responsive
- [ ] Loading states work
- [ ] Error messages display
- [ ] Success messages display
- [ ] Navigation works
- [ ] Forms validate input
- [ ] Buttons are accessible

### Performance Tests
- [ ] Page loads quickly
- [ ] API responds quickly
- [ ] No memory leaks
- [ ] Database queries optimized

---

## Test Results Template

```
Test Date: _______________
Tester: _______________

Scenario 1: Successful Reset       [ PASS / FAIL ]
Scenario 2: Invalid Email          [ PASS / FAIL ]
Scenario 3: Expired Token          [ PASS / FAIL ]
Scenario 4: Password Validation    [ PASS / FAIL ]
Scenario 5: Token Reuse            [ PASS / FAIL ]
Scenario 6: Multiple Users         [ PASS / FAIL ]
Scenario 7: UI/UX                  [ PASS / FAIL ]
Scenario 8: Security               [ PASS / FAIL ]
Scenario 9: Database               [ PASS / FAIL ]
Scenario 10: API                   [ PASS / FAIL ]

Overall Status: [ PASS / FAIL ]

Notes:
_________________________________
_________________________________
_________________________________
```

---

## Troubleshooting During Testing

### Issue: Reset link not in console
**Solution:** Check backend terminal is running and showing logs

### Issue: Token expired immediately
**Solution:** Check server time is correct

### Issue: Password not updating
**Solution:** Check database connection and migration ran successfully

### Issue: UI not loading
**Solution:** Check frontend is running on port 5173

### Issue: API errors
**Solution:** Check backend is running on port 5000 and CORS is configured

---

## Success Criteria

✅ All 10 test scenarios pass  
✅ No console errors  
✅ No database errors  
✅ Security tests pass  
✅ UI/UX is smooth  
✅ Performance is acceptable  

---

**Testing Complete! 🎉**

If all tests pass, the forgot password feature is ready for production deployment (with email integration).
