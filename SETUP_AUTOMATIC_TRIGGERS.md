# 🚀 Setup Automatic Triggers - Quick Start

## ✅ What You'll Get

After this setup, ALL your zaps will run automatically:
- ✅ **Gmail triggers** - Auto-execute when emails arrive (60s polling)
- ✅ **Price alerts** - Auto-execute when crypto price crosses threshold (60s polling)
- ✅ **Webhooks** - Instant execution when external services call your webhook URL
- ✅ **All actions work** - Email, Webhook, Google Sheets, Google Calendar

---

## 📋 Setup Steps (5 minutes)

### **Step 1: Install Dependencies**

```bash
cd C:\Users\91830\Downloads\Dteams\Dteams\hooks
npm install
```

This installs `axios` and other required packages.

---

### **Step 2: Restart Hooks Backend**

**Stop the current backend** (if running): Press `Ctrl+C`

**Start it again:**
```bash
npm run dev
```

**Wait for these messages:**
```
🚀 Server running on http://localhost:3002

🔄 Starting automatic trigger monitoring...

✅ Trigger monitoring started
   - Gmail: Checking every 60 seconds
   - Price Alerts: Checking every 60 seconds
```

✅ **If you see this, automatic triggers are ACTIVE!**

---

### **Step 3: Keep Frontend Running**

**In a separate terminal:**
```bash
cd C:\Users\91830\Downloads\Dteams\Dteams\frontend
npm run dev
```

---

## 🎯 Test Each Trigger Type

### **Test 1: Gmail Trigger (Google Workflow)**

1. **Create a Gmail workflow zap:**
   - Go to: http://localhost:3000/create-zap
   - Select "Google Workspace"
   - Trigger: "When email arrives with subject: AutoTest"
   - Action 1: Add to Google Sheet
   - Action 2: Create Calendar event
   - Action 3: Send email to yourself

2. **Send yourself a test email:**
   - Subject: "AutoTest"
   - Body: "Testing automatic trigger"

3. **Watch the magic happen (within 60 seconds):**
   - Backend logs show: `📨 New email trigger: AutoTest`
   - Google Sheet gets new row
   - Calendar event appears
   - Confirmation email arrives

---

### **Test 2: Price Alert**

1. **Create a price alert zap:**
   - Trigger: BTC above $45,000 (set below current price)
   - Action: Send email

2. **Wait up to 60 seconds**

3. **Check logs:**
   ```
   💰 BTC: $50,123
   🚨 Price alert triggered!
   🚀 Executing zap...
   ✅ Email sent
   ```

---

### **Test 3: Webhook**

1. **Get your zap ID:**
   - Go to dashboard
   - Find a webhook zap
   - Copy the ID (e.g., `zap-1762461668813-5k08z1dkj`)

2. **Send webhook request:**
   ```bash
   curl -X POST http://localhost:3002/api/v1/webhook/zap-1762461668813-5k08z1dkj \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello from webhook!"}'
   ```

3. **Instant execution!**
   - No waiting
   - Actions execute immediately
   - Response returned

---

## 🔍 Verify It's Working

### **Check Logs:**

Watch the hooks backend terminal for:

**Gmail monitoring:**
```
📧 Found 2 new emails for harshitpandey5506@gmail.com
📨 New email trigger: AutoTest
🚀 Executing zap zap-123...
✅ Zap executed successfully
```

**Price monitoring:**
```
📊 Monitoring 3 price alert zaps...
💰 BTC: $50,123
💰 ETH: $3,456
```

**Webhook:**
```
🪝 Webhook received for zap: zap-123
✅ Zap executed successfully via webhook
```

---

## ⚡ What's Different Now?

### **Before (Manual Testing):**
```
Create zap → Click "Test" button → Actions execute
```

### **After (Automatic):**
```
Create zap → Triggers monitor automatically → Actions execute when triggered
```

---

## 🎓 Understanding Each Trigger

### **Gmail Trigger:**
- Polls Gmail API every 60 seconds
- Checks for new UNREAD emails in INBOX
- Matches your criteria (subject, from, body)
- Marks emails as READ after processing
- Executes workflow actions automatically

### **Price Alert:**
- Fetches prices from CoinGecko API every 60 seconds
- Supports: BTC, ETH, SOL, MATIC, AVAX, DOT, LINK
- Triggers ONCE when price crosses threshold
- Won't trigger again until price goes back and crosses again

### **Webhook:**
- Always listening (no polling needed)
- Instant execution when POST request received
- URL: `http://localhost:3002/api/v1/webhook/{zapId}`
- Perfect for integrating with external services

---

## 🚨 Troubleshooting

### **"Trigger monitoring is disabled"**

❌ **Cause:** Missing dependencies or TypeScript compilation error

✅ **Fix:**
```bash
cd hooks
npm install
npm run dev
```

---

### **Gmail triggers not working**

❌ **Cause:** Google account not connected

✅ **Fix:**
1. Go to dashboard
2. Click "Connect Google"
3. Authorize Gmail, Sheets, Calendar
4. Send test email

---

### **Price alerts not triggering**

❌ **Cause:** Zap stored in localStorage, not database

✅ **Fix:**
- Price alerts only work with database zaps
- For now, only Google Workflows auto-trigger from localStorage
- Webhook and Email zaps work from database

---

### **Webhook returns 404**

❌ **Cause:** Wrong URL or backend not running

✅ **Fix:**
- Check backend is running: http://localhost:3002/
- Verify URL: `/api/v1/webhook/{zapId}`
- Use correct zap ID

---

## 📊 Current Limitations

### **What Works Automatically:**
- ✅ Gmail triggers (with Google account connected)
- ✅ Price alerts (database zaps)
- ✅ Webhooks (instant)

### **What Still Needs Manual Testing:**
- ⚠️ Google Workflows stored in localStorage (use "Test" button)
- ⚠️ Price alerts for localStorage zaps

### **Future Improvements:**
- Real-time Gmail push notifications (replace polling)
- Faster price monitoring (15-30 seconds)
- Support for more cryptocurrencies
- Email trigger for non-Gmail providers
- Twitter/Discord webhooks

---

## ✅ Success Checklist

- [ ] `npm install` completed successfully
- [ ] Backend shows: `✅ Trigger monitoring started`
- [ ] Frontend running on port 3000
- [ ] Google account connected
- [ ] Test email sent and processed automatically
- [ ] Price monitoring logs visible
- [ ] Webhook test successful

**If all checked: You're all set! Your zaps now run automatically!** 🎉

---

## 📚 Full Documentation

See `AUTOMATIC_TRIGGERS_GUIDE.md` for:
- Detailed architecture
- How each trigger works internally
- Production deployment guide
- Advanced configuration
- API reference

---

## 🆘 Need Help?

Check logs in the hooks backend terminal for detailed error messages.

Common log prefixes:
- 📧 = Gmail monitoring
- 📊 = Price monitoring
- 🪝 = Webhook received
- ✅ = Success
- ❌ = Error
- ⚠️ = Warning

---

**Enjoy your fully automated zaps!** 🚀
