import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint to get all zaps from localStorage
 * This is used by the automatic trigger monitoring service
 */
export async function GET(req: NextRequest) {
  try {
    // Since this is a server-side API, we can't directly access localStorage
    // But we can return a structure that tells the monitoring service
    // to use the standard test-zap endpoint which handles localStorage zaps
    
    // For now, return empty array
    // The monitoring will work by having the frontend periodically sync zaps
    // OR we can use a different approach
    
    return NextResponse.json({
      status: 'success',
      message: 'Zaps list endpoint - localStorage access not available server-side',
      zaps: [],
      note: 'Use test-zap endpoint directly with zap IDs for localStorage zaps'
    });
    
  } catch (error) {
    console.error('Error in zaps list endpoint:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to get zaps list',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
