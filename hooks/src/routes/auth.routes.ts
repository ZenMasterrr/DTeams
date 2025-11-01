import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { PrismaClient, User, Prisma } from '@prisma/client';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const router = require('express').Router();
const prisma = new PrismaClient();
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Define the metadata type for Google OAuth
type GoogleAuthData = {
  accessToken: string;
  refreshToken: string;
  tokenExpiry: string;
};

type UserMetadata = {
  google?: GoogleAuthData;
} | null;

// Type for the user data we'll return to the client
type SafeUser = {
  id: number;
  name: string | null;
  email: string | null;
  address: string;
  metadata: UserMetadata | null;
  isGoogleAuthenticated: boolean;
};

// Type for the Prisma User with metadata
type UserWithMetadata = {
  id: number;
  name: string | null;
  email: string | null;
  address: string;
  password: string | null;
  createdAt: Date;
  updatedAt: Date;
  metadata: UserMetadata;
};

// Google OAuth URL generation
router.get('/google', (req: Request, res: Response) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
  });
  res.redirect(url);
});

// Google OAuth callback
router.get('/google/callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);

    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) {
      throw new Error('No email found in Google account');
    }

    // Calculate token expiry (1 hour from now)
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 1);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: payload.email }
    }) as UserWithMetadata | null;

    let user: UserWithMetadata | null = null;
    
    if (existingUser) {
      // Parse existing metadata
      const currentMetadata = existingUser.metadata ? 
        (typeof existingUser.metadata === 'string' ? 
          JSON.parse(existingUser.metadata) : 
          existingUser.metadata) as UserMetadata : 
        null;
      
      // Update user with new metadata
      const updatedMetadata: UserMetadata = {
        ...(currentMetadata || {}),
        google: {
          accessToken: tokens.access_token!,
          refreshToken: tokens.refresh_token || (currentMetadata?.google?.refreshToken || ''),
          tokenExpiry: tokenExpiry.toISOString(),
        }
      };

      // Update the user with the new metadata using type assertion
      const updateData: any = {
        name: payload.name,
        metadata: updatedMetadata
      };

      // Perform the update with the typed data
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: updateData
      });

      // Create the UserWithMetadata object with proper typing
      user = {
        ...updatedUser,
        metadata: updatedMetadata as Prisma.JsonValue
      } as UserWithMetadata;
    } else {
// Create new user
      const newUserMetadata: UserMetadata = {
        google: {
          accessToken: tokens.access_token!,
          refreshToken: tokens.refresh_token || '',
          tokenExpiry: tokenExpiry.toISOString(),
        }
      };

      const newUser = await prisma.user.create({
        data: {
          name: payload.name,
          email: payload.email,
          password: null,
          address: `user_${Date.now()}`,
          metadata: newUserMetadata as any  // Using any to bypass Prisma's type checking
        }
      });
      
      // Manually create a UserWithMetadata object
      user = {
        ...newUser,
        metadata: newUserMetadata
      } as UserWithMetadata;
    }

    // Create JWT
    const token = jwt.sign(
      { userId: user.id, address: user.address },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Parse the metadata if it's a string
    const metadata = user.metadata ? 
      (typeof user.metadata === 'string' ? JSON.parse(user.metadata) : user.metadata) : 
      null;

    // Create safe user object for the client
    const safeUser: SafeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      address: user.address,
      metadata: metadata as UserMetadata | null,
      isGoogleAuthenticated: !!(metadata as UserMetadata)?.google?.accessToken,
    };

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);

  } catch (error) {
    console.error('Google OAuth error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=${encodeURIComponent(errorMessage)}`);
  }
});

// Get current user
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };

    // Get user data with metadata
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        metadata: true,
      },
    }) as UserWithMetadata | null;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Parse metadata safely
    const userMetadata: UserMetadata = user.metadata 
      ? (typeof user.metadata === 'string' 
          ? JSON.parse(user.metadata) 
          : user.metadata)
      : null;

    // Check if Google token is expired
    const googleData = userMetadata?.google;
    let isTokenExpired = true;
    if (googleData?.tokenExpiry) {
      isTokenExpired = new Date(googleData.tokenExpiry) < new Date();
    }

    // Create safe user object for the client
    const safeUser: SafeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      address: user.address,
      metadata: userMetadata,
      isGoogleAuthenticated: !!googleData?.accessToken && !isTokenExpired
    };

    res.json(safeUser);

  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;