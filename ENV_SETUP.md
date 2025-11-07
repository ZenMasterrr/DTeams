# Environment Variables Setup Guide

## Overview
This project uses environment variables to configure various services. Due to the monorepo structure, you need to set up `.env` files in multiple locations.

## Required .env Files

### 1. Root Level: `Dteams/.env`
This is the main configuration file that should contain all shared environment variables.

**Location:** `c:\Users\91830\Downloads\Dteams\Dteams\.env`

**Required Variables:**
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/zapier?schema=public"

# Blockchain (for Hardhat/contracts)
NEXT_PUBLIC_ZAP_CONTRACT_ADDRESS="your_contract_address"
NEXT_PUBLIC_ORACLE_CONTRACT_ADDRESS="your_oracle_address"
SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/your_infura_key"
PRIVATE_KEY="your_private_key"

# Email (AWS SES SMTP) - REQUIRED FOR TESTS
SMTP_USERNAME="your_aws_ses_username"
SMTP_PASSWORD="your_aws_ses_password"
SMTP_ENDPOINT="email-smtp.region.amazonaws.com"
FROM_EMAIL="your_verified_email@domain.com"

# Google OAuth (for hooks backend)
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GOOGLE_REDIRECT_URI="http://localhost:3002/api/v1/auth/google/callback"

# Backend & Frontend URLs
BACKEND_URL="http://localhost:3002"
FRONTEND_URL="http://localhost:3000"

# JWT Secret
JWT_SECRET="your_jwt_secret_key"

# Next.js
NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL="http://localhost:3000"

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your_walletconnect_project_id"
```

### 2. Hooks Directory: `hooks/.env`
This is for the backend hooks service. It should mirror the main `.env` file.

**Location:** `c:\Users\91830\Downloads\Dteams\Dteams\hooks\.env`

**Required Variables:**
```env
# Same variables as root .env, but specifically for the hooks service
DATABASE_URL="postgresql://user:password@localhost:5432/zapier?schema=public"
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GOOGLE_REDIRECT_URI="http://localhost:3002/api/v1/auth/google/callback"
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:3002"
JWT_SECRET="your_jwt_secret_key"
PORT=3002
```

### 3. Frontend Directory (Optional): `frontend/.env.local`
For Next.js specific environment variables.

**Location:** `c:\Users\91830\Downloads\Dteams\Dteams\frontend\.env.local`

**Required Variables:**
```env
NEXT_PUBLIC_BACKEND_URL="http://localhost:3002"
NEXT_PUBLIC_ZAP_CONTRACT_ADDRESS="your_contract_address"
NEXT_PUBLIC_ORACLE_CONTRACT_ADDRESS="your_oracle_address"
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your_walletconnect_project_id"
DATABASE_URL="postgresql://user:password@localhost:5432/zapier?schema=public"
```

## How Environment Loading Works

### For Tests
When running tests with `npm test` from the root directory:
1. Jest loads `jest.setup.js` which loads environment variables from both `.env` files
2. Test files also load environment variables at the top using dotenv
3. The API route file (`test-zap/[id]/route.ts`) tries multiple paths to find .env files

### For Hooks Backend
When running the hooks backend (`npm run dev` from hooks directory):
1. The `index.ts` file loads environment variables from `hooks/.env` first
2. Falls back to parent `Dteams/.env` if variables are missing
3. Uses `override: false` to prevent overwriting existing variables

### For Frontend
When running the Next.js frontend:
1. Next.js automatically loads `.env.local`, `.env`, etc.
2. The API routes also manually load environment variables from multiple paths

## Troubleshooting

### Test Errors: "configuration is not set"
**Problem:** The test can't find environment variables, especially SMTP credentials.

**Solution:**
1. Ensure `Dteams/.env` exists and contains all required variables
2. Ensure `hooks/.env` exists and contains the same variables
3. Run `npm install` in the root directory to install Jest dependencies
4. The test should now be able to read environment variables from both locations

### Backend Not Reading .env
**Problem:** The hooks backend starts but can't find configuration.

**Solution:**
1. Check that `hooks/.env` exists
2. Make sure you're running the backend from the correct directory
3. Check the console logs - the code now logs which .env file it loaded

### Next.js API Routes Not Loading .env
**Problem:** API routes can't find SMTP or other credentials.

**Solution:**
1. Restart the Next.js dev server after changing .env files
2. Check that `.env` exists in the root `Dteams` directory
3. The route file tries multiple paths, so at least one should work

## File Structure
```
Dteams/
├── .env                          # ✅ Main configuration file
├── .env.example                  # Template for .env
├── jest.config.js                # ✅ Jest configuration (created)
├── jest.setup.js                 # ✅ Loads env vars for tests (created)
├── test-zap-endpoint.test.ts     # ✅ Updated to load env vars
├── hooks/
│   ├── .env                      # ✅ Hooks backend configuration
│   ├── .env.test                 # For testing hooks specifically
│   └── src/
│       ├── index.ts              # ✅ Updated to load env vars
│       └── routes/
│           └── auth.routes.ts    # ✅ Updated to load env vars
└── frontend/
    ├── .env.local                # Frontend-specific vars (optional)
    └── app/
        └── api/
            └── test-zap/
                └── [id]/
                    └── route.ts  # ✅ Updated with better env loading
```

## Next Steps

1. **Copy your .env.example to .env:**
   ```bash
   cd c:\Users\91830\Downloads\Dteams\Dteams
   copy .env.example .env
   ```

2. **Fill in your actual credentials** in the `.env` file

3. **Copy to hooks directory:**
   ```bash
   copy .env hooks\.env
   ```

4. **Install dependencies:**
   ```bash
   npm install
   cd hooks
   npm install
   cd ..
   ```

5. **Run tests:**
   ```bash
   npm test
   ```

## Important Notes

- **Never commit `.env` files** - they are gitignored for security
- **SMTP credentials are required** for the email action tests to pass
- **All paths are now relative** - the code finds .env files from any directory
- **Restart servers** after changing .env files
