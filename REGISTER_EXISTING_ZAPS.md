# 🔧 Register Your Existing Zaps for Automatic Monitoring

## ❌ Problem:
Your existing Google Workflow zaps are in browser localStorage, but the backend can't access them, so Gmail triggers aren't working automatically.

## ✅ Solution:
Register your zaps with the backend so it knows which Gmail criteria to monitor.

---

## 📋 Steps to Register Your Existing Zaps

### **Step 1: Restart Backend (to apply new code)**

```bash
cd C:\Users\91830\Downloads\Dteams\Dteams\hooks
npm run dev
```

Wait for:
```
✅ Trigger monitoring started
```

---

### **Step 2: Open Registration Page**

Go to: **http://localhost:3000/register-zaps**

---

### **Step 3: Click "Register All Zaps"**

This will:
1. Read all your zaps from localStorage
2. Send them to the backend
3. Save them in `hooks/src/registered-zaps.json`

You'll see:
```
✅ Successfully registered X out of X zaps for automatic monitoring!
```

---

### **Step 4: Verify Registration**

**Check the backend logs:**
```
✅ Registered existing zap zap-1234567890 for automatic monitoring
✅ Registered existing zap zap-0987654321 for automatic monitoring
```

**Wait 60 seconds and check monitoring logs:**
```
🔍 Monitoring Gmail for 1 users...
📋 Found 3 registered Google Workflow zaps  ← Should show your zaps!
```

---

## 🎯 Test Automatic Triggering

### **Send a Test Email:**

1. Find one of your Google Workflow zaps
2. Note the trigger criteria (e.g., subject: "Hi")
3. Send yourself an email with that subject
4. Wait up to 60 seconds

### **Watch Backend Logs:**
```
📧 Found 1 new emails for harshitpandey5506@gmail.com
📨 New email trigger for zap zap-1234567890: Hi
🚀 Executing zap...
✅ Google Sheets: Added row
✅ Google Calendar: Event created
✅ Email sent successfully
```

---

## ✨ After Registration:

### **✅ What Works Automatically:**
- Gmail triggers check every 60 seconds
- When matching email arrives → workflow executes
- All actions run: Sheets, Calendar, Email

### **📝 For New Zaps:**
- They auto-register when created
- No need to register manually again

### **🔄 If You Edit a Zap:**
- Visit http://localhost:3000/register-zaps again
- Click "Register All Zaps" to update

---

## 🔍 Troubleshooting

### **"Found 0 registered Google Workflow zaps"**

❌ Cause: Zaps not registered yet

✅ Fix: Visit http://localhost:3000/register-zaps and register them

---

### **"No zaps found in localStorage"**

❌ Cause: No zaps created yet OR localStorage cleared

✅ Fix: Create a new Google Workflow zap first

---

### **Backend not registering**

❌ Cause: Backend not running

✅ Fix:
```bash
cd hooks
npm run dev
```

---

## 📊 What Happens Now:

```
Every 60 seconds:
  ↓
Backend reads registered-zaps.json
  ↓
Finds your Google Workflow zaps
  ↓
For each zap, checks Gmail for matching emails
  ↓
If new email matches:
  → Execute workflow
  → Run all actions
  → Log results
```

---

## ✅ Success Checklist:

- [ ] Backend restarted with new code
- [ ] Visited http://localhost:3000/register-zaps
- [ ] Clicked "Register All Zaps"
- [ ] Saw success message
- [ ] Backend logs show: `📋 Found X registered Google Workflow zaps`
- [ ] Sent test email with matching subject
- [ ] Workflow executed automatically within 60 seconds

---

**Once registered, your zaps will work automatically! No more manual testing needed!** 🎉
