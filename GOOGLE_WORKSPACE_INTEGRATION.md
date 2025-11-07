# Google Workspace Integration Setup Guide

## Current Status

✅ **Already Configured:**
- Google OAuth credentials in `.env` (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI)
- `googleapis` package installed in hooks backend
- OAuth scopes configured for Gmail, Calendar, and Spreadsheets
- Google API helper functions created in `frontend/app/api/test-zap/google-apis.ts`

⚠️ **What's Missing:**
- Package installation in frontend (`googleapis` and `google-auth-library`)
- OAuth token storage and retrieval
- Integration with test-zap endpoint
- User authorization flow

---

## Step 1: Install Required Packages

Run this command in the **frontend** directory:

```bash
cd frontend
npm install googleapis@^164.1.0 google-auth-library@^10.4.2
```

This will install the Google APIs Node.js client library.

---

## Step 2: How Google Workflow Execution Works

### Current Behavior (What You're Experiencing):

When you click "Test" on a Google Workflow zap:
1. ❌ Gmail trigger doesn't actually monitor your inbox
2. ❌ Google Sheets doesn't update
3. ❌ Google Calendar doesn't create events
4. ✅ Email action sends immediately (because email sending is implemented)

### Why This Happens:

The system needs **OAuth access tokens** to call Google APIs on behalf of the user. Here's what's missing:

1. **User Authorization**: Users need to authorize your app to access their Google account
2. **Token Storage**: Access tokens need to be stored securely in the database
3. **Token Retrieval**: When executing a workflow, the system needs to load the user's tokens
4. **API Calls**: Use the tokens to make actual Google API calls

---

## Step 3: Understanding the OAuth Flow

### A. User Authorization (One-time setup per user)

```
User clicks "Connect Google Account" 
  → Redirected to Google
  → User grants permissions
  → Google redirects back with authorization code
  → Exchange code for access_token + refresh_token
  → Store tokens in database
```

Your hooks backend (`hooks/src/index.ts`) already has this flow:
- Line 129-142: Generates OAuth URL with correct scopes
- Line 146-174: Handles OAuth callback
- **Missing**: Storing tokens in database

### B. Executing Workflows (Each time)

```
User clicks "Test Zap"
  → Load user's Google OAuth tokens from database
  → Set tokens in oauth2Client
  → Execute Google API calls:
     - Add row to Sheets
     - Create Calendar event
     - Search Gmail
```

---

## Step 4: Database Schema Update

You need to store OAuth tokens. Add this to your Prisma schema:

```prisma
model User {
  id               String    @id @default(uuid())
  email            String    @unique
  wallet           String?   @unique
  googleAccessToken  String?
  googleRefreshToken String?
  googleTokenExpiry  DateTime?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  
  Zap              Zap[]
}
```

Run migration:
```bash
npx prisma migrate dev --name add_google_tokens
```

---

## Step 5: Update OAuth Callback to Store Tokens

In `hooks/src/index.ts`, after line 172 where you get tokens, add:

```typescript
const { tokens } = await oauth2Client.getToken(code as string);

// Store tokens in database
await prisma.user.upsert({
  where: { wallet: walletAddress },
  update: {
    googleAccessToken: tokens.access_token,
    googleRefreshToken: tokens.refresh_token,
    googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
  },
  create: {
    wallet: walletAddress,
    googleAccessToken: tokens.access_token,
    googleRefreshToken: tokens.refresh_token,
    googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
  },
});
```

---

## Step 6: Update Test-Zap Endpoint

The helper functions are already created in `google-apis.ts`. Now you need to:

### A. Import the helpers

At the top of `frontend/app/api/test-zap/[id]/route.ts`:

```typescript
import {
  setGoogleCredentials,
  addRowToSheet,
  createCalendarEvent,
  parseDateTime,
  calculateEndTime,
} from '../google-apis';
```

### B. Load user's Google tokens

Before executing actions, add:

```typescript
// Get user's Google OAuth tokens from database
const user = await prisma.user.findUnique({
  where: { id: userId }, // You need to pass userId somehow
});

if (user?.googleAccessToken) {
  setGoogleCredentials(user.googleAccessToken, user.googleRefreshToken || undefined);
}
```

### C. Replace SHEETS case

In the switch statement, replace:

```typescript
case 'SHEETS':
  if (!user?.googleAccessToken) {
    actionResult.success = false;
    actionResult.message = 'Google account not connected. Please authorize Google access.';
    break;
  }

  const sheetResult = await addRowToSheet(
    actionMetadata.spreadsheetId,
    actionMetadata.sheetName || 'Sheet1',
    [new Date().toISOString(), 'Test Row', 'From Zap'], // Customize this data
    actionMetadata.range
  );
  
  actionResult.success = sheetResult.success;
  actionResult.message = sheetResult.message;
  actionResult.details = sheetResult.details;
  break;
```

### D. Replace CALENDAR case

```typescript
case 'CALENDAR':
  if (!user?.googleAccessToken) {
    actionResult.success = false;
    actionResult.message = 'Google account not connected. Please authorize Google access.';
    break;
  }

  try {
    // Parse date and time
    const startDateTime = parseDateTime(
      actionMetadata.dateField || '2024-11-15',
      actionMetadata.timeField || '14:30'
    );
    const endDateTime = calculateEndTime(startDateTime, actionMetadata.duration || 60);
    
    const calendarResult = await createCalendarEvent(
      actionMetadata.eventTitle || 'Untitled Event',
      actionMetadata.eventDescription || '',
      startDateTime,
      endDateTime,
      actionMetadata.sendNotifications !== false
    );
    
    actionResult.success = calendarResult.success;
    actionResult.message = calendarResult.message;
    actionResult.details = calendarResult.details;
  } catch (error) {
    actionResult.success = false;
    actionResult.message = `Failed to parse date/time: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
  break;
```

---

## Step 7: Add "Connect Google Account" Button

In your dashboard or settings page:

```tsx
<Button onClick={() => {
  const wallet = localStorage.getItem('wallet'); // or however you track user
  window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/google?wallet=${wallet}`;
}}>
  Connect Google Account
</Button>
```

---

## Testing the Full Flow

### 1. Connect Google Account
- Click "Connect Google Account"
- Authorize the app
- Tokens are stored in database

### 2. Create a Google Workflow Zap
- Trigger: Gmail (when email arrives with subject containing "test")
- Action 1: Add row to Google Sheets
- Action 2: Create Calendar event with date "2024-11-15" and time "14:30"
- Action 3: Send confirmation email

### 3. Test the Zap
- Click "Test" button
- ✅ Should add row to your Google Sheet
- ✅ Should create event in your Google Calendar
- ✅ Should send confirmation email

---

## Important Notes

### Security
- Store tokens encrypted in production
- Use refresh tokens to get new access tokens when they expire
- Never expose tokens in client-side code

### Gmail Trigger (Real-time)
For the Gmail trigger to work automatically:
- Set up Gmail push notifications (Pub/Sub)
- Or use polling (check for new emails every N minutes)
- This requires additional backend infrastructure

### Current Limitations
- Workflow execution is manual (click "Test" button)
- No automatic trigger when emails arrive
- No data flow between steps (e.g., extract date from email → use in calendar)

### Next Steps for Production
1. Implement token refresh logic
2. Add Gmail webhook for real-time triggers
3. Implement data mapping between workflow steps
4. Add error handling and retry logic
5. Create UI for managing Google account connection

---

## Quick Start (After installing packages)

1. Run frontend: `npm run dev`
2. Go to dashboard
3. Click "Connect Google Account" (implement this button)
4. Create a Google Workflow zap
5. Click "Test" - it should now actually call Google APIs!

The code structure is ready. You just need to:
- Run `npm install` in frontend
- Add token storage to database
- Connect the pieces together
