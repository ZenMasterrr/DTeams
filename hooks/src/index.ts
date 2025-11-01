import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import express from 'express';
import cors from 'cors';
import { Request, Response, NextFunction, Router } from 'express';
import dotenv from 'dotenv';

// Simple UUID v4 implementation to avoid ESM/CommonJS issues
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Load environment variables
dotenv.config();

// Initialize Google OAuth2 client
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || `${process.env.BACKEND_URL || 'http://localhost:3002'}/api/v1/auth/google/callback`
);

// Simple in-memory store for demo purposes
// In production, replace this with a proper database
interface GoogleTokenData {
  accessToken: string;
  refreshToken?: string;
  expiryDate?: number;
  email?: string;
  wallet: string;
}

const tokenStore: Record<string, GoogleTokenData> = {}; // wallet -> token data

// Create express app
const app = express();

// Add middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Routes
app.get('/', (req, res) => {
  res.send('Backend server is running');
});

// API v1 routes
const apiRouter = express.Router();
app.use('/api/v1', apiRouter);

// Auth routes
const authRouter = express.Router();
apiRouter.use('/auth', authRouter);

// Signup endpoint
authRouter.post('/signup', async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({
        status: 'error',
        message: 'Wallet address is required',
      });
    }

    // In a real app, you would:
    // 1. Verify the wallet signature
    // 2. Check if user already exists
    // 3. Create user in database
    // 4. Generate JWT token

    // For now, just return success with a mock token
    const token = `mock_jwt_token_for_${address}`;
    
    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      token,
      user: {
        id: 'user_' + Math.random().toString(36).substr(2, 9),
        address,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during signup',
    });
  }
});

// Google OAuth route
authRouter.get('/google', (req, res) => {
  const { wallet } = req.query;
  if (!wallet) {
    return res.status(400).json({ 
      status: 'error',
      message: 'Wallet address is required' 
    });
  }

  // Generate the URL that's the Google OAuth consent screen
  const state = JSON.stringify({
    wallet,
    nonce: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  });
  
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/spreadsheets'
    ],
    state: state,
  });

  res.redirect(url);
});

// Google OAuth callback route
authRouter.get('/google/callback', async (req, res) => {
  const { code, state, error } = req.query;
  
  // Handle OAuth errors
  if (error) {
    console.error('Google OAuth error:', error);
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?google_auth=error&error=${encodeURIComponent(error as string)}`);
  }

  if (!code || !state) {
    console.error('Missing required parameters:', { code, state });
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?google_auth=error&error=missing_parameters`);
  }
  
  let walletAddress: string;
  try {
    const stateObj = JSON.parse(state as string);
    walletAddress = stateObj.wallet;
    if (!walletAddress) throw new Error('No wallet address in state');
  } catch (err) {
    console.error('Invalid state parameter:', err);
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?google_auth=error&error=invalid_state`);
  }

  try {
    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code as string);
    
    // Get user info from Google
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.v2.me.get();
    
    // Store the tokens with wallet address
    if (!tokens.access_token) {
      throw new Error('No access token received from Google');
    }
    
    tokenStore[walletAddress] = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || undefined,
      expiryDate: tokens.expiry_date || undefined,
      email: userInfo.data.email || undefined,
      wallet: walletAddress
    };
    
    console.log('Stored tokens for wallet:', walletAddress);

    console.log('Google OAuth tokens received for wallet:', state);
    console.log('User email:', userInfo.data.email);
    
    // Redirect back to dashboard with success
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?google_auth=success`);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?google_auth=error`);
  }
});

// Check Google connection status
authRouter.get('/google/status', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      status: 'error', 
      message: 'Unauthorized: No token provided' 
    });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    // In a real app, verify the JWT token and get the wallet address
    // For now, we'll use a simple approach to get the wallet from a query param
    const wallet = req.query.wallet as string;
    
    if (!wallet) {
      return res.status(400).json({
        status: 'error',
        message: 'Wallet address is required'
      });
    }
    
    // Check if we have tokens for this wallet
    const tokenData = tokenStore[wallet];
    const isConnected = !!tokenData?.accessToken;
    
    res.json({ 
      status: 'success',
      connected: isConnected,
      email: tokenData?.email
    });
  } catch (error) {
    console.error('Error checking Google connection status:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to check Google connection status' 
    });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Not Found',
    timestamp: new Date().toISOString()
  });
});

// Start the server
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3002;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health\n`);
});

// Handle server errors
server.on('error', (error: NodeJS.ErrnoException) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`);
  }
  process.exit(1);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});


process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});