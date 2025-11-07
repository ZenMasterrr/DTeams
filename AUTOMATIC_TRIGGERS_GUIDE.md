# 🚀 Automatic Triggers Implementation Guide

## ✅ What's Implemented

Your zaps now run **AUTOMATICALLY** without manual testing!

### **1. Gmail Triggers (Google Workflows)** 📧
- Checks Gmail every 60 seconds
- Detects emails matching your criteria (subject, from, body)
- Automatically executes workflow actions (Sheets, Calendar, Email)

### **2. Price Alert Triggers** 📊  
- Monitors crypto prices every 60 seconds
- Supports: BTC, ETH, SOL, MATIC, AVAX, DOT, LINK
- Triggers when price crosses threshold (above/below)
- Executes actions automatically

### **3. Webhook Triggers** 🪝
- Receives POST requests from external services
- Instantly executes zap actions
- Returns success/failure response

---

## 🛠️ Setup Instructions

### **Step 1: Install Required Packages**

```bash
cd hooks
npm install axios
```

### **Step 2: Restart Hooks Backend**

```bash
cd hooks
npm run dev
```

**You should see:**
```
🚀 Server running on http://localhost:3002

🔄 Starting automatic trigger monitoring...

✅ Trigger monitoring started
   - Gmail: Checking every 60 seconds
   - Price Alerts: Checking every 60 seconds
```

---

## 📋 How Each Trigger Works

### **1. Gmail Trigger (Google Workflow)**

**When you create a Google Workflow zap:**
1. Select "When an email arrives in Gmail"
2. Set criteria: `subject`, `from`, or `body`
3. Set value: e.g., "Hi", "john@example.com"
4. Add actions: Sheets, Calendar, Email

**What happens automatically:**
```
Every 60 seconds:
  ↓
Check Gmail for new emails matching criteria
  ↓
If new email found:
  ↓
Execute workflow actions:
  → Add row to Google Sheet
  → Create Calendar event
  → Send confirmation email
```

**Requirements:**
- ✅ Google account connected
- ✅ Gmail OAuth scopes authorized
- ✅ Backend running

---

### **2. Price Alert Trigger**

**When you create a Price Alert zap:**
1. Select "Price Alert" trigger
2. Choose crypto: BTC, ETH, SOL, etc.
3. Set target price: e.g., $50,000
4. Choose condition: "above" or "below"
5. Add actions: Email, Webhook, etc.

**What happens automatically:**
```
Every 60 seconds:
  ↓
Fetch current price from CoinGecko API
  ↓
Check if price crossed threshold:
  - Above: current > target
  - Below: current < target
  ↓
If triggered:
  ↓
Execute zap actions
```

**Example:**
```
BTC Price Alert: Trigger when BTC > $50,000
Current: $49,800 → No trigger
Current: $50,100 → ✅ TRIGGERED! Actions execute
Current: $50,200 → No trigger (already triggered)
```

---

### **3. Webhook Trigger**

**Webhook URL for your zap:**
```
http://localhost:3002/api/v1/webhook/{zapId}
```

**How to use:**
1. Create a zap with "Webhook" trigger
2. Copy the zap ID from the dashboard
3. Send POST request to webhook URL

**Example with curl:**
```bash
curl -X POST http://localhost:3002/api/v1/webhook/zap-1234567890 \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello from external service",
    "data": {
      "user": "John Doe",
      "amount": 100
    }
  }'
```

**What happens:**
```
External service sends POST request
  ↓
Webhook endpoint receives data
  ↓
Execute zap actions immediately
  ↓
Return success/failure response
```

---

## 🔍 Monitoring & Logs

### **Gmail Monitoring Logs:**
```
📧 Found 2 new emails for user@gmail.com
📨 New email trigger: Meeting Request
🚀 Executing zap zap-1234567890...
✅ Zap executed successfully
```

### **Price Alert Logs:**
```
📊 Monitoring 3 price alert zaps...
💰 BTC: $50,123
🚨 Price alert triggered! BTC is above $50,000 (current: $50,123)
🚀 Executing zap zap-0987654321...
✅ Zap executed successfully
```

### **Webhook Logs:**
```
🪝 Webhook received for zap: zap-1122334455
📦 Webhook data: { "message": "Hello" }
✅ Zap executed successfully via webhook
```

---

## 🎯 Testing Each Trigger Type

### **Test Gmail Trigger:**

1. **Connect Google Account:**
   - Go to dashboard
   - Click "Connect Google"
   - Authorize Gmail, Sheets, Calendar

2. **Create Gmail Workflow:**
   - Trigger: "When email arrives with subject: Test"
   - Action 1: Add to Google Sheet
   - Action 2: Create Calendar event
   - Action 3: Send confirmation email

3. **Test It:**
   - Send yourself an email with subject "Test"
   - Wait up to 60 seconds
   - Check logs for: `📨 New email trigger: Test`
   - Verify: Sheet updated, Calendar event created, Email sent

---

### **Test Price Alert:**

1. **Create Price Alert Zap:**
   - Trigger: BTC above $45,000 (set to current price or below)
   - Action: Send email notification

2. **Wait for Monitoring Cycle:**
   - Watch logs: `💰 BTC: $50,123`
   - When condition met: `🚨 Price alert triggered!`
   - Check email inbox for notification

---

### **Test Webhook:**

1. **Get Zap ID:**
   - Go to dashboard
   - Find your webhook zap
   - Note the zap ID (e.g., `zap-1762461668813-5k08z1dkj`)

2. **Send Webhook:**
   ```bash
   curl -X POST http://localhost:3002/api/v1/webhook/zap-1762461668813-5k08z1dkj \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```

3. **Check Response:**
   ```json
   {
     "status": "success",
     "message": "Webhook received and zap executed",
     "zapId": "zap-1762461668813-5k08z1dkj"
   }
   ```

---

## ⚙️ Configuration

### **Monitoring Intervals:**

Edit `hooks/src/triggers/scheduler.ts` to change check frequency:

```typescript
// Gmail - currently 60 seconds
setInterval(async () => {
  await monitorAllGmailZaps();
}, 60000); // Change this value

// Price Alerts - currently 60 seconds  
setInterval(async () => {
  await monitorPriceAlerts();
}, 60000); // Change this value
```

### **Supported Cryptocurrencies:**

Edit `hooks/src/triggers/price-monitor.ts` to add more coins:

```typescript
const coinMap: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  // Add more coins here
  'XRP': 'ripple',
  'ADA': 'cardano'
};
```

---

## 🐛 Troubleshooting

### **Gmail Triggers Not Working:**

❌ **Problem:** No emails detected  
✅ **Solutions:**
- Check Google account is connected
- Verify Gmail OAuth scope is authorized
- Check logs: `📧 Found 0 new emails`
- Send test email matching criteria
- Check email is unread in INBOX

---

### **Price Alerts Not Triggering:**

❌ **Problem:** Price condition met but no action  
✅ **Solutions:**
- Check logs: `📊 Monitoring X price alert zaps...`
- Verify zap is in database (not localStorage)
- Check crypto symbol is supported
- Ensure price crosses threshold (not just meets it)

---

### **Webhook Not Responding:**

❌ **Problem:** 404 Not Found  
✅ **Solutions:**
- Verify hooks backend is running
- Check URL: `http://localhost:3002/api/v1/webhook/{zapId}`
- Use correct zap ID
- Check Content-Type header is `application/json`

---

## 📊 Status Dashboard

### **Check If Monitoring Is Active:**

Visit: `http://localhost:3002/`

Should show: `Backend server is running`

Check terminal logs for:
```
✅ Trigger monitoring started
   - Gmail: Checking every 60 seconds
   - Price Alerts: Checking every 60 seconds
```

---

## 🚀 Production Deployment

### **For Production:**

1. **Increase Monitoring Frequency:**
   - Gmail: Every 30 seconds
   - Price: Every 15 seconds

2. **Add Database Persistence:**
   - Store processed email IDs in database
   - Track last triggered price in database

3. **Add Error Handling:**
   - Retry failed API calls
   - Send admin alerts on errors

4. **Use Gmail Push Notifications:**
   - Set up Google Cloud Pub/Sub
   - Replace polling with real-time webhooks

5. **Rate Limiting:**
   - Implement API rate limiting
   - Cache price data

---

## ✅ Summary

**You now have:**
- ✅ Automatic Gmail triggers (60s polling)
- ✅ Automatic price alerts (60s polling)
- ✅ Webhook receiver (instant)
- ✅ All actions execute automatically
- ✅ Full logging and monitoring

**No more manual testing required!** Your zaps run automatically when triggers fire. 🎉
