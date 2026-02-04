// lib/auth/auth.js - MIGRATED TO LOCAL AUTH
// SUPABASE REMOVED
import db from '../db';
import { compare, hash } from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { parse, serialize } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('FATAL: JWT_SECRET must be defined in production.');
}

const FINAL_SECRET = JWT_SECRET || 'local-development-secret-change-this';
const COOKIE_NAME = 'ai-code-mentor-auth';

// Helper to set auth cookie
export function setAuthCookie(res, token) {
  const cookie = serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    sameSite: 'lax',
    path: '/',
  });
  res.setHeader('Set-Cookie', cookie);
}

// Helper to remove auth cookie
export function removeAuthCookie(res) {
  const cookie = serialize(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: -1,
    sameSite: 'lax',
    path: '/',
  });
  res.setHeader('Set-Cookie', cookie);
}

/**
 * Sign In with Email and Password
 */
export async function signInWithEmail(email, password) {
  try {
    const user = db.findOne('users', { email });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const validPassword = await compare(password, user.password_hash);
    if (!validPassword) {
      throw new Error('Invalid credentials');
    }

    // Create session/token
    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.full_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        user_metadata: { full_name: user.full_name, avatar_url: user.avatar_url }
      },
      session: { access_token: token }
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Sign Up with Email and Password
 */
export async function signUpWithEmail(email, password, metadata = {}) {
  try {
    const existingUser = db.findOne('users', { email });
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await hash(password, 10);
    const userId = uuidv4();

    db.insert('users', {
      id: userId,
      email,
      password_hash: hashedPassword,
      full_name: metadata.full_name || '',
      avatar_url: metadata.avatar_url || '',
      created_at: new Date().toISOString()
    });

    // Auto login
    return signInWithEmail(email, password);
  } catch (error) {
    throw error;
  }
}

/**
 * Sign Out
 */
export async function signOut() {
  return { error: null };
}

/**
 * Get Server User
 * Reads JWT from cookie and verifies it.
 */
export async function getServerUser(req, res) {
  try {
    const cookies = parse(req.headers.cookie || '');
    const token = cookies[COOKIE_NAME];

    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET);

    // Optionally verify user still exists in DB
    const user = db.findOne('users', { id: decoded.userId });
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      user_metadata: { full_name: user.full_name, avatar_url: user.avatar_url },
      app_metadata: {}
    };
  } catch (error) {
    // Token invalid or expired
    return null;
  }
}

// End of auth file

