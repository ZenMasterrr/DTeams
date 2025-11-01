import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

// Schema for request validation
const testZapSchema = z.object({
  id: z.string().min(1, 'Zap ID is required'),
});

// Error handling middleware
const handleError = (error: any, res: Response) => {
  console.error('Error in test-zap:', error);
  const status = error.status || 500;
  const message = error.message || 'An error occurred while testing the zap';
  res.status(status).json({ success: false, message });
};

// Test a zap by ID
router.post('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Validate request
    testZapSchema.parse({ id });

    // Get the zap with its trigger and actions
    const zap = await prisma.zap.findUnique({
      where: { id },
      include: {
        trigger: true,
        actions: {
          orderBy: { sortingOrder: 'asc' },
        },
      },
    });

    if (!zap) {
      return res.status(404).json({
        success: false,
        message: 'Zap not found',
      });
    }

    // Create a zap run to track this test execution
    const zapRun = await prisma.zapRun.create({
      data: {
        zapId: zap.id,
        metadata: { 
          status: 'running',
          testRun: true 
        },
      },
    });

    const actionResults = [];
    let allActionsSucceeded = true;

    // Execute each action
    for (const action of zap.actions) {
      const actionMetadata = action.metadata as Record<string, any>;
      const actionType = actionMetadata?.type || 'UNKNOWN';
      
      const actionResult = {
        actionId: action.id,
        type: actionType,
        success: true,
        message: '',
        details: {} as Record<string, any>,
      };

      // Create an action run to track this action
      const actionRun = await prisma.actionRun.create({
        data: {
          actionId: action.id,
          zapRunId: zapRun.id,
          status: 'running',
          metadata: { 
            ...actionMetadata,
            testRun: true,
          },
        },
      });

      try {
        // Process the action based on its type
        switch (actionType.toUpperCase()) {
          case 'EMAIL':
            actionResult.message = `Email would be sent to ${actionMetadata.to}`;
            actionResult.details = {
              to: actionMetadata.to,
              subject: actionMetadata.subject,
              bodyPreview: actionMetadata.body?.substring(0, 100) + 
                (actionMetadata.body?.length > 100 ? '...' : ''),
            };
            console.log(`📧 [TEST] Would send email to: ${actionMetadata.to}`);
            break;
            
          case 'WEBHOOK':
            actionResult.message = `Webhook would be called: ${actionMetadata.url}`;
            actionResult.details = {
              url: actionMetadata.url,
              method: actionMetadata.method || 'POST',
              headers: actionMetadata.headers || {},
              payload: actionMetadata.payload || {},
            };
            console.log(`🌐 [TEST] Would call webhook: ${actionMetadata.url}`);
            break;
            
          case 'SLACK':
            actionResult.message = `Slack message would be sent to #${actionMetadata.channel}`;
            actionResult.details = {
              channel: actionMetadata.channel,
              message: actionMetadata.message,
            };
            console.log(`💬 [TEST] Would send Slack message to #${actionMetadata.channel}`);
            break;
            
          default:
            actionResult.success = false;
            actionResult.message = `Action type '${actionType}' is not implemented yet`;
            actionResult.details = { type: actionType };
            allActionsSucceeded = false;
            console.warn(`⚠️ [TEST] Unhandled action type: ${actionType}`);
        }
        
        // Update action run status
        await prisma.actionRun.update({
          where: { id: actionRun.id },
          data: {
            status: actionResult.success ? 'success' : 'failed',
            metadata: {
              ...(actionRun.metadata as object || {}), // Preserve existing metadata
              message: actionResult.message,
              finishedAt: new Date().toISOString(),
              ...actionResult.details
            }
          },
        });
        
      } catch (error) {
        console.error(`❌ Error executing action ${action.id}:`, error);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        actionResult.success = false;
        actionResult.message = `Action failed: ${errorMessage}`;
        actionResult.details = { error: String(error) };
        allActionsSucceeded = false;
        
        // Update action run status to failed
        await prisma.actionRun.update({
          where: { id: actionRun.id },
          data: {
            status: 'failed',
            metadata: {
              ...(actionRun.metadata as object || {}), // Preserve existing metadata
              message: errorMessage,
              error: String(error),
              finishedAt: new Date().toISOString()
            }
          },
        });
      }
      
      actionResults.push(actionResult);
    }
    
    // Update the zap run status
    const zapRunStatus = allActionsSucceeded ? 'completed' : 'partially_completed';
    await prisma.zapRun.update({
      where: { id: zapRun.id },
      data: {
        metadata: {
          ...(zapRun.metadata as object || {}),
          status: zapRunStatus,
          actionResults,
          testRun: true,
          finishedAt: new Date().toISOString()
        },
        updatedAt: new Date()
      },
    });
    
    // Return the results
    res.json({
      success: true,
      message: `Zap test ${allActionsSucceeded ? 'completed successfully' : 'completed with some errors'}`,
      zapId: zap.id,
      zapName: zap.name,
      status: zapRunStatus,
      actionResults,
      startedAt: zapRun.createdAt,
      finishedAt: new Date(),
    });
    
  } catch (error) {
    handleError(error, res);
  }
});

export default router;
