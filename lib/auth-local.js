/**
 * SERVICIO DE AUTENTICACIÓN LOCAL (SQLite)
 * Reemplazo de Supabase Auth para modo offline/local.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from './db.js';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('FATAL: JWT_SECRET must be defined in production.');
    }
    console.warn('⚠️ [AuthLocal] JWT_SECRET missing. Using insecure dev fallback.');
}

const SECRET_KEY = JWT_SECRET;
const JWT_EXPIRES_IN = '7d';

const AuthLocal = {
    /**
     * Registra un nuevo usuario
     */
    async registerUser(email, password, fullName = '') {
        try {
            // Verificar si existe
            const existing = db.findOne('users', { email });
            if (existing) {
                return { error: 'El usuario ya existe' };
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const userId = uuidv4();
            const initialVersion = 1;

            // Transacción: Crear usuario + perfil base
            db.transaction(() => {
                // 1. Crear usuario auth
                db.insert('users', {
                    id: userId,
                    email,
                    password_hash: hashedPassword,
                    full_name: fullName,
                    token_version: initialVersion, // Init version
                    created_at: new Date().toISOString()
                });

                // 2. Crear perfil asociado (importante para FKs)
                db.insert('user_profiles', {
                    id: userId,
                    email,
                    display_name: fullName || email.split('@')[0],
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            })();

            // Auto-login
            const token = this.generateToken(userId, email, initialVersion);
            return { user: { id: userId, email, full_name: fullName }, token };

        } catch (error) {
            console.error('[AuthLocal] Register error:', error);
            return { error: 'Error registrando usuario' };
        }
    },

    /**
     * Inicia sesión
     */
    async loginUser(email, password) {
        try {
            const user = db.findOne('users', { email });
            if (!user) {
                return { error: 'Credenciales inválidas' };
            }

            const isValid = await bcrypt.compare(password, user.password_hash);
            if (!isValid) {
                return { error: 'Credenciales inválidas' };
            }

            // Ensure we have a version (for legacy users pre-migration)
            const version = user.token_version || 1;

            const token = this.generateToken(user.id, user.email, version);
            return {
                user: {
                    id: user.id,
                    email: user.email,
                    full_name: user.full_name,
                    avatar_url: user.avatar_url
                },
                token
            };
        } catch (error) {
            console.error('[AuthLocal] Login error:', error);
            return { error: 'Error de inicio de sesión' };
        }
    },

    /**
     * Genera JWT con versionado
     */
    generateToken(userId, email, version) {
        return jwt.sign(
            {
                sub: userId,
                email,
                aud: 'authenticated',
                role: 'authenticated',
                v: version // Embed version
            },
            SECRET_KEY,
            { expiresIn: JWT_EXPIRES_IN }
        );
    },

    /**
     * Verifica JWT y comprueba revocación DB
     */
    verifyToken(token) {
        try {
            if (!token) return { error: 'Token no proporcionado' };

            // Remover 'Bearer ' si existe
            const cleanToken = token.replace('Bearer ', '');

            const decoded = jwt.verify(cleanToken, SECRET_KEY);

            // 🚀 PERSISTENCE CHECK: Verify token version against DB
            // This is synchronous with better-sqlite3, so API remains compatible.
            const user = db.findOne('users', { id: decoded.sub });

            if (!user) {
                return { isValid: false, error: 'Usuario no encontrado' };
            }

            // If user has a specific version requirement, enforce it
            // (Handle legacy users with version=null by defaulting to 1 in logic)
            const currentVersion = user.token_version || 1;
            const tokenVersion = decoded.v || 1; // Default to 1 if missing in old tokens

            if (tokenVersion !== currentVersion) {
                return { isValid: false, error: 'Sesión revocada' };
            }

            return {
                isValid: true,
                userId: decoded.sub,
                email: decoded.email,
                role: decoded.role
            };
        } catch (error) {
            return { isValid: false, error: 'Token inválido o expirado' };
        }
    },

    /**
     * Revoca todas las sesiones de un usuario
     */
    revokeUserSessions(userId) {
        try {
            const user = db.findOne('users', { id: userId });
            if (user) {
                const newVersion = (user.token_version || 1) + 1;
                db.update('users', { token_version: newVersion }, { id: userId });
                return true;
            }
            return false;
        } catch (error) {
            console.error('[AuthLocal] Revoke error:', error);
            return false;
        }
    }
};

export default AuthLocal;
