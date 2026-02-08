import { NextResponse } from 'next/server';
import db from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/device/token
 * 
 * El cliente (VS Code) hace polling a este endpoint enviando el `device_code`.
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { device_code } = body;

        if (!device_code) {
            return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
        }

        // 1. Buscar el código en la DB
        const row = db.get('SELECT * FROM device_codes WHERE device_code = ?', [device_code]);

        if (!row) {
            return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });
        }

        // 2. Verificar expiración
        if (new Date(row.expires_at) < new Date()) {
            return NextResponse.json({ error: 'expired_token' }, { status: 400 });
        }

        // 3. Verificar estado
        if (row.status === 'pending') {
            return NextResponse.json({ error: 'authorization_pending' }, { status: 400 });
        }

        if (row.status === 'denied') {
            return NextResponse.json({ error: 'access_denied' }, { status: 403 });
        }

        if (row.status === 'authorized' && row.user_id) {
            // 4. ¡Autorizado! Generar PAT (Personal Access Token)
            // En un sistema real, usaríamos JWT o un hash seguro. Aquí generamos un token opaco.
            const accessToken = 'pat_' + crypto.randomBytes(32).toString('hex');
            const tokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');

            // Guardar el PAT
            db.run(`
                INSERT INTO personal_access_tokens (token_hash, user_id, label, last_used_at)
                VALUES (?, ?, ?, datetime('now'))
            `, [tokenHash, row.user_id, 'VS Code Extension']);

            // Eliminar el device code usado (seguridad: one-time use)
            db.run('DELETE FROM device_codes WHERE device_code = ?', [device_code]);

            return NextResponse.json({
                access_token: accessToken,
                token_type: 'Bearer',
                expires_in: 31536000 // 1 año (ejemplo)
            });
        }

        return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });

    } catch (error) {
        console.error('[Device Flow Token] Error:', error);
        return NextResponse.json(
            { error: 'internal_server_error' },
            { status: 500 }
        );
    }
}
