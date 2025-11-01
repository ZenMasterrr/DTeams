import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const prisma = new PrismaClient();

// Handle incoming webhook
router.post('/:webhookId', async (req: Request, res: Response) => {
  const { webhookId } = req.params;
  const payload = req.body;
  const headers = req.headers;
  
  try {
    // Find the webhook configuration
    const webhook = await prisma.trigger.findFirst({
      where: {
        type: 'WEBHOOK',
        metadata: {
          path: ['webhookId'],
          equals: webhookId,
        },
      },
      include: {
        zap: {
          include: {
            actions: {
              orderBy: { sortingOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!webhook || !webhook.zap) {
      return res.status(404).json({ 
        success: false, 
        message: 'Webhook not found or inactive' 
      });
    }

    // Create a zap run to track this execution
    const zapRun = await prisma.zapRun.create({
      data: {
        zapId: webhook.zap.id,
        status: 'running',
        metadata: {
          webhook: {
            id: webhookId,
            headers: headers,
            payload: payload,
          },
        },
      },
    });

    const actionResults = [];
    let allActionsSucceeded = true;

    // Execute each action in the zap
    for (const action of webhook.zap.actions) {
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
            webhookPayload: payload,
          },
        },
      });

      try {
        // Process the action based on its type
        switch (actionType.toUpperCase()) {
          case 'EMAIL':
            // In a real implementation, you would send an email here
            actionResult.message = `Email would be sent to ${actionMetadata.to}`;
            actionResult.details = {
              to: actionMetadata.to,
              subject: actionMetadata.subject,
              body: actionMetadata.body,
              // In a real implementation, you would include the actual email sending logic
              // and update the status based on the result
            };
            console.log(`📧 [WEBHOOK] Would send email to: ${actionMetadata.to}`);
            break;
            
          case 'WEBHOOK':
            // In a real implementation, you would make an HTTP request to the webhook URL
            actionResult.message = `Webhook would be called: ${actionMetadata.url}`;
            actionResult.details = {
              url: actionMetadata.url,
              method: actionMetadata.method || 'POST',
              headers: actionMetadata.headers || {},
              payload: actionMetadata.payload || {},
              // In a real implementation, you would include the actual webhook call logic
              // and update the status based on the response
            };
            console.log(`🌐 [WEBHOOK] Would call webhook: ${actionMetadata.url}`);
            break;
            
          case 'SLACK':
            // In a real implementation, you would send a Slack message
            actionResult.message = `Slack message would be sent to #${actionMetadata.channel}`;
            actionResult.details = {
              channel: actionMetadata.channel,
              message: actionMetadata.message,
              // In a real implementation, you would include the actual Slack API call
              // and update the status based on the response
            };
            console.log(`💬 [WEBHOOK] Would send Slack message to #${actionMetadata.channel}`);
            break;
            
          default:
            actionResult.success = false;
            actionResult.message = `Action type '${actionType}' is not implemented yet`;
            actionResult.details = { type: actionType };
            allActionsSucceeded = false;
            console.warn(`⚠️ [WEBHOOK] Unhandled action type: ${actionType}`);
        }
        
        // Update action run status
        await prisma.actionRun.update({
          where: { id: actionRun.id },
          data: {
            status: actionResult.success ? 'success' : 'failed',
            metadata: {
              ...(actionRun.metadata as object || {}),
              message: actionResult.message,
              details: actionResult.details,
              finishedAt: new Date().toISOString()
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
              ...(actionRun.metadata as object || {}),
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
        status: zapRunStatus,
        metadata: {
          ...(zapRun.metadata as object || {}),
          actionResults,
          finishedAt: new Date().toISOString()
        }
      },
    });
    
    // Return success response
    res.status(200).json({
      success: true,
      message: `Webhook processed ${allActionsSucceeded ? 'successfully' : 'with some errors'}`,
      zapId: webhook.zap.id,
      zapName: webhook.zap.name,
      status: zapRunStatus,
      actionResults,
      startedAt: zapRun.createdAt,
      finishedAt: new Date(),
    });
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process webhook',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
