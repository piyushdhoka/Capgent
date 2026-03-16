import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';

export async function GET() {
  console.log('🔍 [API Test] Diagnosing Neon HTTP connection...');
  
  try {
    const start = Date.now();
    const result = await sql`SELECT NOW() as now, version() as version`;
    const duration = Date.now() - start;
    
    console.log('✅ [API Test] SUCCESS in', duration, 'ms');
    
    return NextResponse.json({
      success: true,
      time: result[0].now,
      version: result[0].version,
      duration: `${duration}ms`,
      message: 'Direct Neon connectivity is working perfectly.'
    });
  } catch (error) {
    console.error('❌ [API Test] FAILED:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      stack: (error as Error).stack,
      message: 'Direct Neon connectivity failed within the Next.js runtime.'
    }, { status: 500 });
  }
}
