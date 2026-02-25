import { NextResponse } from 'next/server';

/**
 * Hello API (Migrated to App Router - V2)
 *
 * This is the modern equivalent of /pages/api/hello.js 
 * as part of the API Migration Pilot Phase.
 */
export async function GET(request) {
    return NextResponse.json({
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        path: '/api/v2/hello'
    });
}
