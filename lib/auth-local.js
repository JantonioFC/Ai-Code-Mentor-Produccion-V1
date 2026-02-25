/**
 * SERVICIO DE AUTENTICACIÓN LOCAL (SQLite)
 * Reemplazo de Supabase Auth para modo offline/local.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import db from './db.js';

const BCRYPT_SALT_ROUNDS = 12;

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    if (process.env.NODE_ENV === 'production' && process.env.CI !== 'true') {
        throw new Error('FATAL: JWT_SECRET must be defined in production.');
    }
    console.warn('⚠️ [AuthLocal] JWT_SECRET missing. Using insecure fallback (safe for CI/Build).');
}

const SECRET_KEY = process.env.JWT_SECRET ||
    (process.env.NODE_ENV === 'development' ||
        process.env.NODE_ENV === 'test' ||
        process.env.CI === 'true' ? 'dev-secret-key-safe-for-local-only' : undefined);

if (!SECRET_KEY) {
    throw new Error('FATAL: JWT_SECRET must be defined.');
}
const JWT_EXPIRES_IN = '15m'; // Short-lived access token
const REFRESH_TOKEN_EXPIRES_IN = '30d'; // Long-lived refresh token

const AuthLocal = {
    /**
     * Registra un nuevo usuario
     */
    async registerUser(email, password, fullName = '') {
        try {
            // Verificar si existe (usando tabla user_profiles para coherencia con esquema v1)
            const existing = db.findOne('user_profiles', { email });

            if (existing && existing.password_hash) {
                return { error: 'El usuario ya existe' };
            }

            const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

            if (existing && !existing.password_hash) {
                // User exists from legacy system without password — set their password
                db.update('user_profiles', {
                    password_hash: hashedPassword,
                    display_name: fullName || existing.display_name,
                    updated_at: new Date().toISOString()
                }, { id: existing.id });

                const userRole = existing.role || 'authenticated';
                const tokens = await this.generateTokenPair(existing.id, email, 1, userRole);
                return {
                    user: { id: existing.id, email, full_name: fullName || existing.display_name },
                    ...tokens
                };
            }

            const userId = uuidv4();
            const initialVersion = 1;

            // Transacción: Crear usuario + perfil base
            db.transaction(() => {
                db.insert('user_profiles', {
                    id: userId,
                    email,
                    password_hash: hashedPassword,
                    display_name: fullName || email.split('@')[0],
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            })();

            // Auto-login
            const tokens = await this.generateTokenPair(userId, email, initialVersion);
            return { user: { id: userId, email, full_name: fullName }, ...tokens };

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
            const user = db.findOne('user_profiles', { email });

            if (!user) {
                return { error: 'Credenciales inválidas' };
            }

            // Verify password against stored hash
            if (!user.password_hash) {
                return { error: 'Credenciales inválidas' };
            }

            const isPasswordValid = await bcrypt.compare(password, user.password_hash);
            if (!isPasswordValid) {
                return { error: 'Credenciales inválidas' };
            }

            const version = 1;
            const userRole = user.role || 'authenticated';
            const tokens = await this.generateTokenPair(user.id, user.email, version, userRole);

            return {
                user: {
                    id: user.id,
                    email: user.email,
                    display_name: user.display_name
                },
                ...tokens
            };
        } catch (error) {
            console.error('[AuthLocal] Login error:', error);
            return { error: 'Error de inicio de sesión' };
        }
    },

    /**
     * Genera un par de tokens (Access + Refresh)
     */
    async generateTokenPair(userId, email, version, role = 'authenticated') {
        const accessToken = this.generateToken(userId, email, version, role);
        const refreshToken = crypto.randomBytes(32).toString('hex');

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 30 días

        // Almacenar en DB
        db.insert('refresh_tokens', {
            id: uuidv4(),
            user_id: userId,
            token: refreshToken,
            expires_at: expiresAt.toISOString()
        });

        return { token: accessToken, refreshToken };
    },

    /**
     * Genera JWT (Access Token)
     */
    generateToken(userId, email, version, role = 'authenticated') {
        return jwt.sign(
            {
                sub: userId,
                email,
                aud: 'authenticated',
                role,
                v: version
            },
            SECRET_KEY,
            { expiresIn: JWT_EXPIRES_IN }
        );
    },

    /**
     * Verifica JWT
     */
    verifyToken(token) {
        try {
            if (!token) return { error: 'Token no proporcionado' };
            const cleanToken = token.replace(/^Bearer\s+/i, '');
            const decoded = jwt.verify(cleanToken, SECRET_KEY);

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
     * Refresca un Access Token usando un Refresh Token
     */
    async refreshAccessToken(refreshToken) {
        try {
            const stored = db.findOne('refresh_tokens', { token: refreshToken, revoked: 0 });

            if (!stored) {
                return { error: 'Refresh token inválido o revocado' };
            }

            if (new Date(stored.expires_at) < new Date()) {
                return { error: 'Refresh token expirado' };
            }

            const user = db.findOne('user_profiles', { id: stored.user_id });
            if (!user) {
                return { error: 'Usuario no encontrado' };
            }

            // Generar nuevo access token
            const accessToken = this.generateToken(user.id, user.email, 1, user.role || 'authenticated');

            return { token: accessToken };
        } catch (error) {
            console.error('[AuthLocal] Refresh error:', error);
            return { error: 'Error al refrescar token' };
        }
    },

    /**
     * Revoca un refresh token (logout)
     */
    async revokeRefreshToken(refreshToken) {
        try {
            db.update('refresh_tokens', { revoked: 1 }, { token: refreshToken });
            return true;
        } catch (error) {
            console.error('[AuthLocal] Revoke error:', error);
            return false;
        }
    },

    /**
     * Verifica un Personal Access Token (PAT)
     * Usado por la extensión de VS Code
     */
    verifyPAT(rawToken) {
        try {
            if (!rawToken || !rawToken.startsWith('pat_')) return { error: 'Formato de token inválido' };

            // 1. Hash del token para comparar con DB
            const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

            // 2. Buscar en DB
            const pat = db.findOne('personal_access_tokens', { token_hash: tokenHash });

            if (!pat) {
                return { isValid: false, error: 'Token no encontrado o revocado' };
            }

            // 3. Verificar usuario
            const user = db.findOne('user_profiles', { id: pat.user_id });
            if (!user) {
                return { isValid: false, error: 'Usuario asociado no encontrado' };
            }

            // 4. Actualizar uso (Async fire-and-forget para no bloquear)
            db.update('personal_access_tokens', { last_used_at: new Date().toISOString() }, { id: pat.id });

            return {
                isValid: true,
                user,
                patLabel: pat.label
            };

        } catch (error) {
            console.error('[AuthLocal] PAT Verification Error:', error);
            return { isValid: false, error: 'Error interno verificando token' };
        }
    }
};

export default AuthLocal;
