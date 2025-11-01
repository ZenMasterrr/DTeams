import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define action types based on your application's needs
const ActionType = {
  EMAIL: 'EMAIL',
  WEBHOOK: 'WEBHOOK',
  SLACK: 'SLACK',
  DISCORD: 'DISCORD',
  TWITTER: 'TWITTER',
  GOOGLE_SHEETS: 'GOOGLE_SHEETS',
  NOTION: 'NOTION',
  CUSTOM: 'CUSTOM'
} as const;

type ActionType = typeof ActionType[keyof typeof ActionType];

// Helper function to update action run status
async function updateActionRunStatus(
  actionRunId: string,
  status: 'success' | 'failed' | 'running',
  message: string,
  details: Record<string, any> = {}
) {
  return prisma.actionRun.update({
    where: { id: actionRunId },
    data: {
      status,
      message,
      metadata: details,
      ...(status !== 'running' ? { finishedAt: new Date() } : {})
    }
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const zapId = params.id;
  
  try {
    // Get the zap with its trigger and actions from the database
    const zap = await prisma.zap.findUnique({
      where: { id: zapId },
      include: {
        trigger: true,
        actions: {
          orderBy: { sortingOrder: 'asc' }
        }
      }
    });
    
    if (!zap) {
      console.error(`Zap not found: ${zapId}`);
      return NextResponse.json(
        { 
          success: false, 
          message: `Zap with ID ${zapId} not found`
        },
        { status: 404 }
      );
    }

    console.log(`🔔 Testing zap: ${zap.name} (${zapId})`);
    
    // Create a zap run to track this test execution
    const zapRun = await prisma.zapRun.create({
      data: {
        zapId: zap.id,
        status: 'running',
        metadata: { testRun: true }
      }
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
        details: {} as Record<string, any>
      };
      
      // Create an action run to track this action
      const actionRun = await prisma.actionRun.create({
        data: {
          actionId: action.id,
          zapRunId: zapRun.id,
          status: 'running',
          metadata: { 
            ...actionMetadata,
            testRun: true 
          }
        }
      });
      
      try {
        // Process the action based on its type
        switch (actionType.toUpperCase()) {
          case 'EMAIL':
            actionResult.message = `Email would be sent to ${actionMetadata.to}`;
            actionResult.details = {
              to: actionMetadata.to,
              subject: actionMetadata.subject,
              bodyPreview: actionMetadata.body?.substring(0, 100) + (actionMetadata.body?.length > 100 ? '...' : '')
            };
            console.log(`📧 [TEST] Would send email to: ${actionMetadata.to}`);
            break;
            
          case 'WEBHOOK':
            actionResult.message = `Webhook would be called: ${actionMetadata.url}`;
            actionResult.details = {
              url: actionMetadata.url,
              method: actionMetadata.method || 'POST',
              headers: actionMetadata.headers || {},
              payload: actionMetadata.payload || {}
            };
            console.log(`🌐 [TEST] Would call webhook: ${actionMetadata.url}`);
            break;
            
          case 'SLACK':
            actionResult.message = `Slack message would be sent to #${actionMetadata.channel}`;
            actionResult.details = {
              channel: actionMetadata.channel,
              message: actionMetadata.message
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
        await updateActionRunStatus(
          actionRun.id,
          actionResult.success ? 'success' : 'failed',
          actionResult.message,
          actionResult.details
        );
        
      } catch (error) {
        console.error(`❌ Error executing action ${action.id}:`, error);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        actionResult.success = false;
        actionResult.message = `Action failed: ${errorMessage}`;
        actionResult.details = { error: String(error) };
        allActionsSucceeded = false;
        
        // Update action run status to failed
        await updateActionRunStatus(
          actionRun.id,
          'failed',
          errorMessage,
          { error: String(error) }
        );
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
          testRun: true
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      message: `Zap test ${allActionsSucceeded ? 'completed successfully' : 'completed with some errors'}`,
      zapId: zap.id,
      zapName: zap.name,
      status: zapRunStatus,
      actionResults,
      startedAt: zapRun.createdAt,
      finishedAt: new Date()
    });
    
  } catch (error) {
    console.error('Error testing zap:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to test zap',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
            if (action.config.payload) {
              console.log('   Payload:', action.config.payload);
            }
            break;
            
          default:
            actionResult.message = `Executed ${action.type} action`;
            actionResult.details = action.config || {};
            console.log(`⚡ [TEST] Would execute action: ${action.type}`, action.config);
        }
      } catch (error) {
        actionResult.success = false;
        actionResult.message = `Error executing ${action.type} action`;
        actionResult.details = {
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        console.error(`❌ Error in ${action.type} action:`, error);
      }
      
      actionResults.push(actionResult);
    }
    
    const response = {
      success: true,
      message: `Zap "${zap.name}" executed successfully`,
      zapId: zap.id,
      zapName: zap.name,
      actionsExecuted: actionResults.length,
      actionResults,
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ Test zap execution complete:', response);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ Error testing zap:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to test zap',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Helper function to update action run status
async function updateActionRunStatus(
  actionRunId: string, 
  status: 'success' | 'failed', 
  message: string, 
  details: Record<string, any> = {}
) {
  return prisma.actionRun.update({
    where: { id: actionRunId },
    data: {
      status,
      message,
      details,
      finishedAt: new Date()
    }
  });
}
