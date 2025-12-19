// DATABASE_CONNECTION_GUIDE.md

# Database Connection Pooling & Management

## Overview

This guide covers connection pooling, optimization, and best practices for PostgreSQL in Game Count System.

---

## Connection Pool Configuration

### Current Setup (lib/db.ts)

```typescript
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false },  // Required for cloud databases
  max: 10,                              // Max concurrent connections
  idleTimeoutMillis: 30000,            // 30 seconds idle timeout
  connectionTimeoutMillis: 10000,      // 10 seconds connection timeout
  allowExitOnIdle: true,               // Allow pool to exit when idle
});
```

### Parameters Explained

- **max (10)**: Max number of clients in pool
  - Serverless functions: 5-10
  - App servers: 20-50
  - Production: Adjust based on load testing

- **idleTimeoutMillis (30000)**: How long idle connection waits before closing
  - Reduces memory footprint
  - Frees database connections
  - Typical: 30-60 seconds

- **connectionTimeoutMillis (10000)**: Max time to acquire connection
  - Prevents indefinite hangs
  - Typical: 5-15 seconds

- **allowExitOnIdle (true)**: Pool exits process when idle
  - Important for serverless (Lambda, Vercel)
  - Prevents zombie processes

---

## Production Setup

### Render PostgreSQL

```env
# .env.production
POSTGRES_URL=postgresql://user:password@dpg-xxx.postgres.render.com:5432/dbname?sslmode=require

# Render automatically provides a connection string with:
# - SSL/TLS encryption
# - Connection pooling built-in
# - Automatic failover
```

### Neon PostgreSQL

```env
POSTGRES_URL=postgresql://user:password@ep-xxx.neon.tech/ndbname?sslmode=require

# Neon features:
# - Serverless database
# - Automatic scaling
# - Built-in connection pooling
```

### Connection String Format

```
postgresql://[user[:password]@][netloc][:port][/dbname][?param1=value1&...]

Examples:
- postgresql://user:pass@localhost/mydb
- postgresql://user:pass@host:5432/mydb?sslmode=require
- postgresql://user:pass@host/mydb?applicationName=myapp
```

---

## Optimization Strategies

### 1. Connection Reuse

**✓ Good**: Reuse pool across requests
```typescript
// lib/db.ts - Single pool instance
const pool = new Pool({ ... });
export { pool };

// app/api/route.ts - Reuse pool
import { pool } from '@/lib/db';
const result = await pool.query(...);
```

**✗ Bad**: Create new pool per request
```typescript
// AVOID!
const pool = new Pool({ ... });  // Created every request
```

### 2. Connection Timeout Handling

```typescript
async function queryWithTimeout(query: string, params: any[], timeoutMs = 10000) {
  const client = await Promise.race([
    pool.connect(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection timeout')), timeoutMs)
    ),
  ]);

  try {
    return await client.query(query, params);
  } finally {
    client.release();
  }
}
```

### 3. Monitor Connection Pool

```typescript
// Add monitoring middleware
setInterval(() => {
  console.log(`[DB Pool] Waiting: ${pool.waitingCount}, Idle: ${pool.idleCount}, Total: ${pool.totalCount}`);
}, 30000);
```

### 4. Reduce Query Time

```typescript
// ✓ Good: Query returns small result set
SELECT id, name, email FROM users WHERE id = $1;

// ✗ Bad: Fetches entire table
SELECT * FROM users;

// ✓ Good: Use indexes
SELECT * FROM events WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10;
-- Index: events(user_id, created_at)

// ✗ Bad: Full table scan
SELECT * FROM events WHERE event_name LIKE '%xyz%';
-- Would need: events(event_name) index or full-text search
```

### 5. Batch Operations

```typescript
// ✓ Good: Single trip to database
async function insertScores(scores: ScoreData[]) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    for (const score of scores) {
      await client.query(
        'INSERT INTO game_scores (...) VALUES ($1, $2, ...)',
        [score.eventId, score.teamId, ...]
      );
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// ✗ Bad: Multiple trips
for (const score of scores) {
  await pool.query(...);  // Each query: new connection + overhead
}
```

---

## Connection Pooling Best Practices

### Release Connections Immediately

```typescript
// ✓ Good: Always release in finally
const client = await pool.connect();
try {
  return await client.query(sql);
} finally {
  client.release();  // CRITICAL
}

// ✗ Bad: Might not release
const client = await pool.connect();
return await client.query(sql);  // Hangs if error
```

### Use Connection Helper

```typescript
// lib/db-client.ts
export async function withClient<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    return await callback(client);
  } finally {
    client.release();
  }
}

// Usage
await withClient(async (client) => {
  return client.query('SELECT ...');
});
```

### Avoid Long-Lived Connections

```typescript
// ✗ Bad: WebSocket connection holds database connection
ws.on('message', async (msg) => {
  const client = await pool.connect();
  // Connection held until WebSocket closes!
});

// ✓ Good: Request connection only when needed
ws.on('message', async (msg) => {
  const client = await pool.connect();
  try {
    await client.query(...);
  } finally {
    client.release();  // Immediately available for other requests
  }
});
```

---

## Scaling Strategies

### Horizontal Scaling

For multiple app servers sharing one database:

```
[Server 1] pool(max=5) \
[Server 2] pool(max=5) } --> PostgreSQL (max 30 connections)
[Server 3] pool(max=5) /
[Server 4] pool(max=5) \
[Server 5] pool(max=5) /
```

**Calculate**: `servers × max_connections_per_pool ≤ database_max_connections`

### Vertical Scaling

Increase database resources:
```
Render: Upgrade from Standard to Pro
Neon: Increase compute size
```

### Read Replicas (Optional)

For read-heavy workloads:
```
Write: Primary DB
Read: Replica DB

// lib/db.ts
const writePool = new Pool({ connectionString: process.env.POSTGRES_WRITE_URL });
const readPool = new Pool({ connectionString: process.env.POSTGRES_READ_URL });

// Use writePool for INSERT/UPDATE/DELETE
// Use readPool for SELECT
```

---

## Monitoring & Debugging

### Enable Query Logging

```typescript
// lib/db.ts
if (process.env.DEBUG_SQL) {
  pool.on('query', (query) => {
    console.log(`[SQL] ${query.text.substring(0, 100)}...`);
  });

  pool.on('error', (err) => {
    console.error('[DB Error]', err);
  });
}
```

### Connection Pool Status

```bash
# Check current connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'your_db';

# Check connection limit
SHOW max_connections;

# Check active queries
SELECT * FROM pg_stat_activity WHERE state != 'idle';
```

### Metrics to Track

1. **Pool utilization**: `waitingCount / max`
2. **Query time**: Response time percentiles (p50, p95, p99)
3. **Error rate**: Timeouts, connection refused
4. **Active connections**: Current vs max
5. **Idle connections**: Wasted resources

---

## Troubleshooting

### "Too many connections"

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**: Reduce pool size or upgrade database
```typescript
// Temporary fix
const pool = new Pool({
  max: 5,  // Reduce from 10
  // ...
});
```

### "Connection timeout"

```
Error: client acquired from pool has already been released
```

**Solution**: Check for double-release or missing finally
```typescript
const client = await pool.connect();
try {
  // ...
} finally {
  client.release();  // Only once
}
```

### Idle Connections Accumulate

**Solution**: Reduce idleTimeoutMillis
```typescript
const pool = new Pool({
  idleTimeoutMillis: 10000,  // 10 seconds instead of 30
  // ...
});
```

### Database Connection Drops

**Solution**: Enable keep-alive
```typescript
const pool = new Pool({
  keepalives: true,
  keepalive_idle_timeout: 30000,
  // ...
});
```

---

## Environment Variables

```env
# Development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/game_count_dev

# Production (Render)
DATABASE_URL=postgresql://user:password@dpg-xxx.render.com:5432/db?sslmode=require

# Production (Neon)
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require

# Debug mode
DEBUG_SQL=true
```

---

## Testing Connection

```bash
# Test connection string locally
psql $DATABASE_URL -c "SELECT version();"

# Or via Node
npm run check-db
# Runs: npx tsx scripts/check-database.ts
```

---

## Summary

✅ **Do**:
- Reuse pool across requests
- Always release connections
- Use indexes on foreign keys
- Monitor pool health
- Configure appropriate timeouts
- Batch operations when possible

❌ **Don't**:
- Create new pool per request
- Hold connections during WebSocket lifetime
- Run full table scans
- Forget to release connections
- Over-allocate connections
- Run complex calculations in database

---

## Next Steps

1. Run migration: `npm run migrate`
2. Test connection: `npm run check-db`
3. Monitor in production: Set up log aggregation
4. Load test: Verify pool config under expected load
5. Document: Update runbooks with pooling info
