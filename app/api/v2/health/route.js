import { NextResponse } from 'next/server';

/**
 * Health Check API (Migrated to App Router - V2)
 *
 * This is the modern equivalent of /pages/api/health.js 
 * as part of the API Migration Pilot Phase.
 */
export async function GET(request) {
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'main-app',
        version: '1.0.0-app-router',
        uptime: process.uptime()
    });
}
