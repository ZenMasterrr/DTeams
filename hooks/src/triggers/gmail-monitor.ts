import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ProcessedEmail {
  id: string;
  from: string;
  subject: string;
  body: string;
  timestamp: Date;
}

// Keep track of processed emails to avoid duplicates
const processedEmailIds = new Set<string>();

/**
 * Check Gmail for new emails matching zap criteria
 */
export async function checkGmailForTriggers(
  oauth2Client: OAuth2Client,
  userEmail: string,
  criteria: string,
  value: string,
  label: string = 'INBOX'
): Promise<ProcessedEmail[]> {
  try {
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // Build search query
    let query = `label:${label} is:unread`;
    if (criteria === 'subject') {
      query += ` subject:${value}`;
    } else if (criteria === 'from') {
      query += ` from:${value}`;
    } else if (criteria === 'body') {
      query += ` ${value}`;
    }
    
    // Search for matching emails
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 10
    });
    
    const messages = listResponse.data.messages || [];
    const newEmails: ProcessedEmail[] = [];
    
    for (const message of messages) {
      // Skip if already processed
      if (processedEmailIds.has(message.id!)) {
        continue;
      }
      
      // Get full message details
      const msgResponse = await gmail.users.messages.get({
        userId: 'me',
        id: message.id!,
        format: 'full'
      });
      
      const msg = msgResponse.data;
      const headers = msg.payload?.headers || [];
      
      const from = headers.find(h => h.name?.toLowerCase() === 'from')?.value || 'Unknown';
      const subject = headers.find(h => h.name?.toLowerCase() === 'subject')?.value || 'No Subject';
      const date = headers.find(h => h.name?.toLowerCase() === 'date')?.value || new Date().toISOString();
      
      // Extract body
      let body = '';
      if (msg.payload?.parts) {
        const textPart = msg.payload.parts.find(p => p.mimeType === 'text/plain');
        if (textPart?.body?.data) {
          body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
        }
      } else if (msg.payload?.body?.data) {
        body = Buffer.from(msg.payload.body.data, 'base64').toString('utf-8');
      }
      
      newEmails.push({
        id: message.id!,
        from,
        subject,
        body,
        timestamp: new Date(date)
      });
      
      // Mark as processed
      processedEmailIds.add(message.id!);
      
      // Mark as read (optional)
      await gmail.users.messages.modify({
        userId: 'me',
        id: message.id!,
        requestBody: {
          removeLabelIds: ['UNREAD']
        }
      });
    }
    
    console.log(`📧 Found ${newEmails.length} new emails for ${userEmail}`);
    return newEmails;
    
  } catch (error) {
    console.error('Error checking Gmail:', error);
    return [];
  }
}

/**
 * Execute a zap via the frontend API
 */
async function executeZap(zap: any, triggerData: any) {
  try {
    const axios = require('axios');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    console.log(`🚀 Executing zap ${zap.id}...`);
    
    // Send full zap configuration along with trigger data
    const response = await axios.post(
      `${frontendUrl}/api/test-zap/${zap.id}`,
      { 
        triggerData,
        zap: {
          id: zap.id,
          trigger: zap.trigger,
          actions: zap.actions,
          status: zap.status
        }
      },
      { timeout: 30000 }
    );
    
    console.log(`✅ Zap ${zap.id} executed successfully`);
    return response.data;
    
  } catch (error) {
    console.error(`❌ Error executing zap ${zap.id}:`, error instanceof Error ? error.message : error);
    throw error;
  }
}

/**
 * Get all registered Google Workflow zaps from file system
 */
async function getRegisteredZaps(): Promise<any[]> {
  try {
    const fs = require('fs');
    const path = require('path');
    // Read from hooks/ directory (from dist/src/triggers/ go up 3 levels)
    const registeredZapsPath = path.join(__dirname, '..', '..', '..', 'registered-zaps.json');
    
    if (!fs.existsSync(registeredZapsPath)) {
      console.log('⚠️  No registered zaps file found');
      return [];
    }
    
    const data = fs.readFileSync(registeredZapsPath, 'utf-8');
    const registeredZaps = JSON.parse(data);
    const zaps = registeredZaps.zaps || [];
    
    console.log(`🔍 Read ${zaps.length} zaps from file`);
    
    // Filter for Google Workflow zaps with Gmail triggers
    const filteredZaps = zaps.filter((zap: any) => {
      const isActive = zap.status === 'active';
      const isGoogleWorkflow = zap.trigger?.type === 'google_workflow';
      const hasTriggerStep = zap.trigger?.workflow?.steps?.[0]?.type === 'trigger';
      const isGmailTrigger = zap.trigger?.workflow?.steps?.[0]?.config?.type === 'gmail';
      
      console.log(`  Zap ${zap.id}:`, {
        isActive,
        isGoogleWorkflow,
        hasTriggerStep,
        isGmailTrigger,
        triggerType: zap.trigger?.type,
        firstStepType: zap.trigger?.workflow?.steps?.[0]?.type
      });
      
      return isActive && isGoogleWorkflow && hasTriggerStep && isGmailTrigger;
    });
    
    return filteredZaps;
    
  } catch (error) {
    console.error('Error reading registered zaps:', error);
    return [];
  }
}

/**
 * Monitor all active Gmail-triggered zaps
 */
export async function monitorAllGmailZaps() {
  try {
    // Get all users with Google tokens
    const users = await prisma.user.findMany({
      where: {
        googleAccessToken: { not: null }
      },
      select: {
        id: true,
        email: true,
        address: true,
        googleAccessToken: true,
        googleRefreshToken: true
      }
    });
    
    if (users.length === 0) {
      console.log('⚠️  No users with Google credentials found. Skipping Gmail monitoring.');
      return;
    }
    
    console.log(`🔍 Monitoring Gmail for ${users.length} users...`);
    
    // Get registered Google Workflow zaps
    const registeredZaps = await getRegisteredZaps();
    console.log(`📋 Found ${registeredZaps.length} registered Google Workflow zaps`);
    
    for (const user of users) {
      const oauth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      
      oauth2Client.setCredentials({
        access_token: user.googleAccessToken!,
        refresh_token: user.googleRefreshToken || undefined
      });
      
      // Monitor each registered zap
      for (const zap of registeredZaps) {
        // Correct path: zap.trigger.workflow.steps[0] (not zap.trigger.config.workflow)
        const triggerStep = zap.trigger?.workflow?.steps?.[0];
        const gmailConfig = triggerStep?.config;
        
        console.log(`🔎 Checking zap ${zap.id} - triggerStep:`, triggerStep ? 'Found' : 'Not found', 'gmailConfig:', gmailConfig);
        
        if (!gmailConfig) {
          console.log(`⚠️  Skipping zap ${zap.id} - no gmail config found`);
          continue;
        }
        
        // Check for new emails matching this zap's criteria
        const newEmails = await checkGmailForTriggers(
          oauth2Client,
          user.email || user.address,
          gmailConfig.criteria || 'subject',
          gmailConfig.value || '',
          gmailConfig.label || 'INBOX'
        );
        
        // Execute zap for each new email
        for (const email of newEmails) {
          console.log(`📨 New email trigger for zap ${zap.id}: ${email.subject}`);
          
          try {
            await executeZap(zap, { email });
          } catch (error) {
            console.error(`Failed to execute zap ${zap.id}:`, error);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Error monitoring Gmail zaps:', error);
  }
}
