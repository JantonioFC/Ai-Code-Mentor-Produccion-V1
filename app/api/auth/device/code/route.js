import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/device/code
 * 
 * Inicia el flujo de autorización de dispositivo (RFC 8628).
 * Genera un código de usuario corto y un código de dispositivo largo.
 */
export async function POST(request) {
    try {
        // 1. Generar códigos
        const device_code = uuidv4();
        const user_code = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 chars (ej: A1B2C3D4)
        const expires_in = 900; // 15 minutos en segundos

        // Calcular fecha de expiración para SQLite (ISO String)
        const expires_at = new Date(Date.now() + expires_in * 1000).toISOString();

        // 2. Guardar en DB
        db.run(`
            INSERT INTO device_codes (device_code, code, expires_at, status)
            VALUES (?, ?, ?, 'pending')
        `, [device_code, user_code, expires_at]);

        // 3. Retornar respuesta estándar OAuth Device Flow
        return NextResponse.json({
            device_code,
            user_code,
            verification_uri: '/connect', // URL relativa o absoluta si se prefiere
            verification_uri_complete: `/connect?code=${user_code}`, // UX friendly
            expires_in,
            interval: 5 // Polling interval sugerido (segundos)
        });

    } catch (error) {
        console.error('[Device Flow Code] Error:', error);
        return NextResponse.json(
            { error: 'internal_server_error', message: 'No se pudo iniciar la autorización.' },
            { status: 500 }
        );
    }
}
