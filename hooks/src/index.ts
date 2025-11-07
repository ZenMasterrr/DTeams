console.log('🔵 Starting hooks backend...');

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import express from 'express';
import cors from 'cors';
import { Request, Response, NextFunction, Router } from 'express';
import dotenv from 'dotenv';
import { resolve as pathResolve } from 'path';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

console.log('🔵 Imports loaded successfully');

// Load environment variables
// Try loading from hooks/.env first, then from parent directory
// Note: __dirname is available in CommonJS (which this project uses)
dotenv.config({ path: pathResolve(__dirname, '../../.env') }); // hooks/.env
dotenv.config({ path: pathResolve(__dirname, '../../../.env'), override: false }); // Dteams/.env

console.log('🔵 Environment variables loaded');

// Simple UUID v4 implementation to avoid ESM/CommonJS issues
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Initialize Prisma Client
console.log('🔵 Initializing Prisma...');
const prisma = new PrismaClient();
console.log('🔵 Prisma initialized');

// Initialize Google OAuth2 client
console.log('🔵 Initializing Google OAuth2 client...');
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || `${process.env.BACKEND_URL || 'http://localhost:3002'}/api/v1/auth/google/callback`
);
console.log('🔵 Google OAuth2 client initialized');

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
console.log('🔵 Creating Express app...');
const app = express();
console.log('🔵 Express app created');

// Add middleware
console.log('🔵 Adding middleware...');
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
console.log('🔵 Middleware added');

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Routes
console.log('🔵 Setting up routes...');
app.get('/', (req, res) => {
  res.send('Backend server is running');
});

// API v1 routes
const apiRouter = express.Router();
app.use('/api/v1', apiRouter);

// Auth routes
const authRouter = express.Router();
apiRouter.use('/auth', authRouter);
console.log('🔵 Routes configured');

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
      'https://www.googleapis.com/auth/gmail.modify', // Changed from readonly to modify for marking emails as read
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
    
    // Store the tokens in database
    if (!tokens.access_token) {
      throw new Error('No access token received from Google');
    }
    
    // Store tokens in both in-memory (for backward compatibility) and database
    tokenStore[walletAddress] = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || undefined,
      expiryDate: tokens.expiry_date || undefined,
      email: userInfo.data.email || undefined,
      wallet: walletAddress
    };
    
    // Store in database
    // First, try to find existing user by wallet or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { address: walletAddress },
          { email: userInfo.data.email || undefined }
        ]
      }
    });

    if (user) {
      // Update existing user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          address: walletAddress, // Update wallet address in case they're connecting with new wallet
          email: userInfo.data.email || undefined,
          googleAccessToken: tokens.access_token,
          googleRefreshToken: tokens.refresh_token || null,
          googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        }
      });
    } else {
      // Create new user
      await prisma.user.create({
        data: {
          address: walletAddress,
          email: userInfo.data.email || undefined,
          googleAccessToken: tokens.access_token,
          googleRefreshToken: tokens.refresh_token || null,
          googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        }
      });
    }
    
    console.log('Stored Google tokens for wallet:', walletAddress, 'Email:', userInfo.data.email);

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

// Create zap endpoint
apiRouter.post('/zap', async (req, res) => {
  try {
    console.log('🔵 Received request to create zap');
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
    
    const { trigger, actions, status } = req.body;
    
    if (!trigger) {
      return res.status(400).json({
        status: 'error',
        message: 'Trigger is required'
      });
    }
    
    const zapId = `zap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Register this zap for automatic monitoring
    try {
      const fs = require('fs');
      const path = require('path');
      // Save to hooks root directory (from dist/src/ go up 2 levels)
      const registeredZapsPath = path.join(__dirname, '..', '..', 'registered-zaps.json');
      
      let registeredZaps: any = { zaps: [] };
      if (fs.existsSync(registeredZapsPath)) {
        registeredZaps = JSON.parse(fs.readFileSync(registeredZapsPath, 'utf-8'));
      }
      
      registeredZaps.zaps.push({
        id: zapId,
        trigger,
        actions,
        status: status || 'active',
        createdAt: new Date().toISOString()
      });
      
      fs.writeFileSync(registeredZapsPath, JSON.stringify(registeredZaps, null, 2));
      console.log(`✅ Registered zap ${zapId} for automatic monitoring`);
    } catch (error) {
      console.error('Failed to register zap for monitoring:', error);
    }
    
    // For Google Workflows, we don't store them in the database
    // They are stored in localStorage on the frontend
    // Just return success
    res.status(201).json({
      status: 'success',
      message: 'Zap created successfully (stored in localStorage)',
      zap: {
        id: zapId,
        trigger,
        actions,
        status: status || 'active'
      }
    });
  } catch (error) {
    console.error('Error creating zap:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create zap',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Register existing zap for monitoring
apiRouter.post('/zap/register', async (req, res) => {
  try {
    const { id, trigger, actions, status } = req.body;
    
    console.log(`📥 Registration request received for zap: ${id}`);
    console.log('📦 Trigger:', JSON.stringify(trigger, null, 2));
    
    if (!id || !trigger) {
      console.error('❌ Missing id or trigger');
      return res.status(400).json({
        status: 'error',
        message: 'Zap ID and trigger are required'
      });
    }
    
    const fs = require('fs');
    const path = require('path');
    // Save to hooks root directory (from dist/src/ go up 2 levels)
    const registeredZapsPath = path.join(__dirname, '..', '..', 'registered-zaps.json');
    console.log('📁 Registration file path:', registeredZapsPath);
    
    let registeredZaps: any = { zaps: [] };
    if (fs.existsSync(registeredZapsPath)) {
      registeredZaps = JSON.parse(fs.readFileSync(registeredZapsPath, 'utf-8'));
    }
    
    // Remove existing registration if any
    registeredZaps.zaps = registeredZaps.zaps.filter((z: any) => z.id !== id);
    
    // Add new registration
    registeredZaps.zaps.push({
      id,
      trigger,
      actions: actions || [],
      status: status || 'active',
      registeredAt: new Date().toISOString()
    });
    
    console.log(`💾 Writing to file... Total zaps: ${registeredZaps.zaps.length}`);
    fs.writeFileSync(registeredZapsPath, JSON.stringify(registeredZaps, null, 2));
    console.log(`💾 File written successfully!`);
    
    console.log(`✅ Registered existing zap ${id} for automatic monitoring`);
    
    res.json({
      status: 'success',
      message: 'Zap registered for automatic monitoring',
      zapId: id
    });
    
  } catch (error) {
    console.error('Error registering zap:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to register zap',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Webhook receiver endpoint
apiRouter.post('/webhook/:zapId', async (req, res) => {
  try {
    const { zapId } = req.params;
    const webhookData = req.body;
    
    console.log(`🪝 Webhook received for zap: ${zapId}`);
    console.log('📦 Webhook data:', JSON.stringify(webhookData, null, 2));
    
    // Execute the zap with webhook data
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    try {
      const response = await axios.post(
        `${frontendUrl}/api/test-zap/${zapId}`,
        { triggerData: webhookData },
        { timeout: 30000 }
      );
      
      console.log(`✅ Zap ${zapId} executed successfully via webhook`);
      
      res.status(200).json({
        status: 'success',
        message: 'Webhook received and zap executed',
        zapId,
        result: response.data
      });
    } catch (error) {
      console.error(`❌ Error executing zap ${zapId}:`, error);
      
      res.status(500).json({
        status: 'error',
        message: 'Webhook received but zap execution failed',
        zapId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process webhook',
      error: error instanceof Error ? error.message : 'Unknown error'
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
console.log('📝 About to start server...');
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3002;
console.log(`📝 Port: ${PORT}`);

try {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/health\n`);
    
    // Start automatic trigger monitoring
    try {
      const { startTriggerMonitoring } = require('./triggers/scheduler');
      startTriggerMonitoring();
    } catch (error) {
      console.error('❌ Failed to start trigger monitoring:', error);
      console.log('⚠️  Trigger monitoring is disabled. Manual testing only.');
    }
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
} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}