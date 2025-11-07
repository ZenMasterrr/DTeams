# How to Start Both Servers

## Step 1: Start Hooks Backend (Port 3002)

Open a terminal and run:

```bash
cd hooks
npm run dev
```

**You should see:**
```
🚀 Server running on http://localhost:3002
🌐 Health check: http://localhost:3002/health
```

**If you see "Port 3002 is already in use":**
1. Find the process: `netstat -ano | findstr :3002`
2. Kill it: `taskkill /PID <process_id> /F`
3. Try again

---

## Step 2: Start Frontend (Port 3000)

Open **a new terminal** and run:

```bash
cd frontend
npm run dev
```

**You should see:**
```
✓ Ready in X.Xs
- Local:        http://localhost:3000
```

---

## Step 3: Test Backend is Running

Open browser and go to:
```
http://localhost:3002/
```

You should see: `Backend server is running`

---

## Step 4: Connect Google Account

### Option A: Use the Button
1. Go to: `http://localhost:3000/dashboard`
2. Click the blue "Connect Google" button

### Option B: Direct URL
Just visit this URL in your browser:
```
http://localhost:3002/api/v1/auth/google?wallet=test-user
```

You should be redirected to Google's authorization page.

---

## Troubleshooting

### "404 Not Found" when clicking Connect Google

**Cause:** Backend not running or wrong URL

**Fix:**
1. Check backend is running: `http://localhost:3002/`
2. Verify the URL in the error message
   - Should be: `/api/v1/auth/google`
   - NOT: `/auth/google`

### "EADDRINUSE: address already in use"

**For Windows:**
```bash
# Find process on port 3002
netstat -ano | findstr :3002

# Kill the process (replace XXXX with PID from above)
taskkill /PID XXXX /F
```

### Backend starts but Google OAuth fails

**Check environment variables:**
1. Open `.env` file in Dteams folder
2. Verify these are set:
   ```
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:3002/api/v1/auth/google/callback
   ```

---

## Quick Test Commands

### Test backend is running:
```bash
curl http://localhost:3002/
# Should return: Backend server is running
```

### Test Google OAuth endpoint exists:
```bash
curl "http://localhost:3002/api/v1/auth/google?wallet=test"
# Should redirect to Google (status 302)
```

---

## What Should Happen When Working

1. Click "Connect Google" button
2. Browser redirects to Google
3. You authorize the app
4. Google redirects back to your app
5. Backend stores OAuth tokens in database
6. You see success message
7. Test your Google Workflow zap
8. ✅ Google Sheets and Calendar actions work!
