import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import * as crypto from 'crypto';

// Simple UUID v4 implementation to avoid ESM/CommonJS issues
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const router = Router();

// Initialize Google OAuth2 client
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'auth' });
});

// Login route
router.post('/login', (req, res) => {
  // TODO: Implement actual authentication logic
  res.json({ message: 'Login successful', token: 'sample-jwt-token' });
});

// Register route (for email/password signup)
router.post('/register', (req, res) => {
  // TODO: Implement registration logic
  res.status(201).json({ message: 'User registered successfully' });
});

// Wallet signup route
router.post('/signup', (req, res) => {
  const { address } = req.body;
  
  if (!address) {
    return res.status(400).json({ 
      status: 'error',
      message: 'Wallet address is required' 
    });
  }

  // TODO: Add actual user creation logic here
  // For now, we'll just generate a token and return it
  const token = `wallet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  res.status(201).json({ 
    status: 'success',
    message: 'Wallet connected successfully',
    token: token,
    user: {
      address: address,
      isNew: true
    }
  });
});

// Google OAuth routes
router.get('/google', (req, res) => {
  const { wallet } = req.query;
  
  if (!wallet) {
    return res.status(400).json({ 
      status: 'error',
      message: 'Wallet address is required' 
    });
  }

  const state = uuidv4();
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ],
    state: JSON.stringify({ wallet, state })
  });

  // Store the state in session or database for verification
  // For now, we'll just redirect
  res.redirect(url);
});

// Google OAuth callback
router.get('/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code || !state) {
      return res.status(400).send('Invalid request');
    }

    // Verify state if needed
    const stateData = JSON.parse(state as string);
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const userinfo = await oauth2Client.request({
      url: 'https://www.googleapis.com/oauth2/v3/userinfo',
    });

    // Here you would typically:
    // 1. Find or create a user in your database
    // 2. Associate the wallet address with the user
    // 3. Generate a JWT or session
    // 4. Redirect back to the frontend with a success status

    // For now, just redirect back to the dashboard
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?google_auth=success`);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?google_auth=error`);
  }
});

export const authRouter = router;
