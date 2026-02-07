# ADR-002: SQLite Database vs PostgreSQL

**Status**: Accepted  
**Date**: 2026-02-06  
**Deciders**: Development Team

## Context

AI Code Mentor needs persistent storage for:
- User accounts and authentication
- Learning progress and curriculum state
- Generated lessons and exercises
- Portfolio projects and code samples

We evaluated:
1. **PostgreSQL** - Enterprise-grade relational database
2. **SQLite** - Embedded file-based database
3. **Supabase** - PostgreSQL-as-a-service (previously used)

## Decision

We chose **SQLite** with `better-sqlite3` for the current phase.

### Implementation
- Single file database: `data/ai-code-mentor.db`
- Synchronous API via `better-sqlite3`
- Schema defined in `lib/db.js`

## Rationale

| Factor | PostgreSQL | SQLite | Supabase |
|--------|------------|--------|----------|
| Setup complexity | High | Zero | Medium |
| Hosting cost | $$$  | Free | $-$$ |
| Concurrent users | 1000+ | ~100 | 1000+ |
| Maintenance | Required | None | Managed |
| Local dev experience | Docker needed | Just works | API latency |

### Why SQLite for Now?

1. **Zero Infrastructure**: No database server to manage, backup, or pay for.

2. **Instant Portability**: Entire database is one file that can be copied.

3. **Perfect for MVP**: Current user base is <100 concurrent users.

4. **Speed**: No network latency, all queries are local.

5. **Simplified Deployment**: Single process, no connection pooling needed.

## Consequences

### Positive
- ✅ Zero hosting costs
- ✅ Sub-millisecond queries
- ✅ Easy backups (just copy the file)
- ✅ Works offline
- ✅ No cold-start delays

### Negative
- ❌ Single-writer limitation (one write at a time)
- ❌ Cannot scale horizontally
- ❌ File must be on local disk (no serverless platforms like Vercel)
- ❌ No built-in replication

### Future Migration Path

When scaling beyond ~100 concurrent users:
1. Export SQLite data
2. Migrate to PostgreSQL/Supabase
3. Update connection string
4. Schema is already SQL-compatible

See Roadmap Phase 3 for PostgreSQL migration planning.

## Related
- `lib/db.js` - Database initialization and schema
- `data/ai-code-mentor.db` - Database file location
- [Roadmap Phase 3](../../roadmap.md) - PostgreSQL migration plan
