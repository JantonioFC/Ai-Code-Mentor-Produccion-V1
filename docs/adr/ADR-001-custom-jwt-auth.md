# ADR-001: Custom JWT Authentication vs NextAuth.js

**Status**: Accepted  
**Date**: 2026-02-06  
**Deciders**: Development Team

## Context

AI Code Mentor requires user authentication to:
- Track learning progress per user
- Protect AI-powered features from abuse
- Store personal portfolios and code samples

We needed to choose between:
1. **NextAuth.js** - Popular, mature authentication library for Next.js
2. **Custom JWT implementation** - Built from scratch with `jsonwebtoken`

## Decision

We chose **Custom JWT Authentication** implemented in `lib/auth-local.js`.

### Implementation Details
- JWT tokens signed with `HS256` algorithm
- Tokens stored in HTTP-only cookies (`ai-code-mentor-auth`)
- 7-day expiration with secure flags (HttpOnly, Secure, SameSite=Strict)
- Password hashing with `bcryptjs`

## Rationale

| Factor | NextAuth.js | Custom JWT |
|--------|-------------|------------|
| Setup complexity | Low | Medium |
| Database flexibility | Limited | Full control |
| Token customization | Limited | Full control |
| OAuth providers | Built-in | Manual |
| Bundle size | +50KB | Minimal |
| Learning curve | Documentation-heavy | Simple code |

### Why Custom?

1. **SQLite Compatibility**: NextAuth.js adapters assume PostgreSQL/MySQL. Our SQLite choice simplifies deployment.

2. **Minimal Dependencies**: Only `jsonwebtoken` and `bcryptjs` vs NextAuth.js ecosystem.

3. **Full Control**: Custom claims, token structure, and validation logic tailored to our needs.

4. **Simpler Mental Model**: ~200 lines of code vs complex library internals.

## Consequences

### Positive
- ✅ Zero breaking changes from library updates
- ✅ Complete control over auth flow
- ✅ Smaller bundle size
- ✅ Works perfectly with SQLite

### Negative
- ❌ No built-in OAuth providers (GitHub, Google login requires manual implementation)
- ❌ Security responsibility fully on us
- ❌ No session management UI out of the box

### Mitigations
- Security audit of auth code (completed in Phase 1)
- Rate limiting on auth endpoints (5 attempts/15 min)
- Regular security updates for dependencies

## Related
- [Security: Cookie flags](../walkthroughs/downgrade-walkthrough.md)
- `lib/auth-local.js` - Main implementation
- `pages/api/auth/login.js` - Login endpoint
