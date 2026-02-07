# PostgreSQL Migration Assessment

## 1. Executive Summary
This document evaluates the necessity and strategy for migrating from **SQLite** to **PostgreSQL**. While SQLite is excellent for our current development and beta stage, PostgreSQL is required for multi-region scalability, high concurrency, and production-grade resilience.

## 2. Rationale: Why Migrate?
Currently, AI Code Mentor uses `better-sqlite3` which stores data in a single file (`database/sqlite/curriculum.db`).

| Feature | SQLite (Current) | PostgreSQL (Target) |
|---------|------------------|---------------------|
| **Concurrency** | Single-writer (locks DB) | High (MVCC) |
| **Scalability** | Vertical only | Horizontal (Clusters/Read Replicas) |
| **Availability** | No native HA | Master-Slave / Multi-region |
| **Data Types** | Limited | Rich (JSONB, Arrays, etc.) |
| **Ecosystem** | Local tools | Cloud-native tools, GUI clients, Monitoring |

## 3. Evaluation of Cloud Providers

| Provider | Reach/Stability | Impact on DX | Confidence | Effort | Est. Cost (100-1K users) |
|----------|-----------------|--------------|------------|--------|--------------------------|
| **Neon** | High | Excellent (Serverless, Branching) | High | Low | $0 - $19/mo |
| **Supabase** | High | High (All-in-one platform) | High | Medium | $25/mo |
| **AWS RDS** | Absolute | Medium (Management overhead) | Very High | High | $30 - $60/mo |
| **Railway** | Medium | Simple | Medium | Low | $5 - $20/mo |

> [!IMPORTANT]
> **Neon** is the recommended choice for our next stage due to its auto-scaling capabilities and "Database Branching" which matches our Git-based development workflow.

## 4. Cost Projections

- **Starter (0-500 Users)**: $0 (Free Tiers/Hobby plans)
- **Growth (500-2K Users)**: $20 - $50/mo
- **Scale (2K+ Users)**: $100+ /mo

## 5. Technical Implementation (POC Snippets)

### Connection Strategy
Using `pg` (node-postgres) with a connection pool.

```javascript
// lib/db/postgres.js (Proposed)
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false,
});

export const query = (text, params) => pool.query(text, params);
```

### Migration Script (SQLite -> Postgres)
A simplified approach to transfer existing data.

```javascript
// scripts/migrate-to-pg.js
async function migrateData() {
  const users = sqlite.prepare('SELECT * FROM user_profiles').all();
  for (const user of users) {
    await pg.query(
      'INSERT INTO user_profiles (id, email, full_name, avatar_url) VALUES ($1, $2, $3, $4)',
      [user.id, user.email, user.full_name, user.avatar_url]
    );
  }
}
```

## 6. Next Steps & Trigger
- **Trigger**: Reach 500 active users or require a multi-instance production environment.
- **Immediate Action**: Keep `MigrationRunner` (Task 2.4) updated with SQL-standard compatible queries to minimize migration friction.
