# Database Setup Guide

BioQuest uses Prisma ORM with support for both SQLite (development) and PostgreSQL (production).

---

## Development Setup (SQLite)

SQLite is used for local development - no installation required!

### 1. Configure Environment

Ensure your `.env` file has:

```env
DATABASE_URL="file:./dev.db"
```

### 2. Initialize Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Optional: Open Prisma Studio to view data
npm run prisma:studio
```

Your database file will be created at `prisma/dev.db`.

### 3. Seed Initial Data (Optional)

```bash
npm run db:seed
```

This will create:
- All 29 badge definitions in the database
- Sample data for testing (optional)

---

## Production Setup (PostgreSQL)

### 1. Install PostgreSQL

**macOS (Homebrew):**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Docker:**
```bash
docker run --name bioquest-postgres \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=bioquest \
  -p 5432:5432 \
  -d postgres:16-alpine
```

### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE bioquest;

# Create user
CREATE USER bioquest_user WITH PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE bioquest TO bioquest_user;

# Exit
\q
```

### 3. Configure Environment

Update your `.env` file:

```env
DATABASE_URL="postgresql://bioquest_user:your_secure_password@localhost:5432/bioquest?schema=public"
```

### 4. Run Migrations

```bash
# Push schema to database
npm run prisma:push

# Or run migrations (recommended for production)
npm run prisma:migrate

# Seed badge definitions
npm run db:seed
```

### 5. Verify Connection

```bash
# Open Prisma Studio
npm run prisma:studio
```

Navigate to http://localhost:5555 to view your database.

---

## Database Schema Overview

### Core Models

```
User (iNaturalist account)
  ├── UserStats (denormalized stats)
  ├── Observation (cached iNat data)
  ├── UserBadge (unlocked badges)
  └── UserQuest (active quests)

Badge (29 definitions)
  └── UserBadge (many-to-many with User)

Quest (challenge definitions)
  └── UserQuest (many-to-many with User)
```

### Key Enums

- `Rarity`: normal, rare, legendary
- `BadgeCategory`: milestone, taxon, rarity, geography, time, challenge, secret
- `BadgeTier`: bronze, silver, gold, platinum
- `QuestType`: daily, weekly, monthly, personal
- `QuestStatus`: active, completed, expired

---

## Common Database Operations

### Reset Database (Development)

```bash
# Delete database file
rm prisma/dev.db

# Recreate
npm run prisma:migrate
npm run db:seed
```

### Backup Database (Production)

```bash
# PostgreSQL backup
pg_dump -U bioquest_user bioquest > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql -U bioquest_user bioquest < backup_20251022_120000.sql
```

### View Migrations

```bash
npm run prisma:migrate:status
```

### Create New Migration

```bash
# After changing schema.prisma
npm run prisma:migrate:dev --name description_of_change
```

---

## Prisma Studio

Prisma Studio is a GUI for viewing and editing your database.

```bash
npm run prisma:studio
```

Features:
- Browse all tables
- Filter and search records
- Edit data directly
- View relationships

---

## Performance Tips

### Indexes

The schema includes indexes on commonly queried fields:
- `User.email`
- `User.inatId`
- `Observation.userId`
- `Observation.taxonId`
- `Badge.code`
- `Badge.category`
- `UserBadge.userId`
- `UserStats.userId`

### Connection Pooling (Production)

For production, use connection pooling:

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/bioquest?schema=public&connection_limit=10&pool_timeout=10"
```

Or use PgBouncer:

```bash
# Install PgBouncer
sudo apt install pgbouncer

# Configure in /etc/pgbouncer/pgbouncer.ini
[databases]
bioquest = host=localhost port=5432 dbname=bioquest

[pgbouncer]
listen_port = 6432
listen_addr = 127.0.0.1
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
```

Update DATABASE_URL:
```env
DATABASE_URL="postgresql://user:pass@localhost:6432/bioquest?schema=public"
```

---

## Troubleshooting

### "Can't reach database server"

1. Check PostgreSQL is running: `brew services list` or `systemctl status postgresql`
2. Verify connection string in `.env`
3. Test connection: `psql -U bioquest_user -d bioquest -h localhost`

### "Schema drift detected"

Your database schema doesn't match `schema.prisma`.

```bash
# Development: Reset database
npm run prisma:migrate:reset

# Production: Create migration
npm run prisma:migrate:dev
```

### "Unique constraint violation"

Usually caused by duplicate badge codes or user emails.

```bash
# Find duplicates
npm run prisma:studio

# Or use SQL
psql -U bioquest_user bioquest -c "SELECT code, COUNT(*) FROM \"Badge\" GROUP BY code HAVING COUNT(*) > 1;"
```

### Slow Queries

Enable query logging:

```typescript
// prisma/client.ts
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})
```

---

## Migration Strategy

### Development
1. Change `schema.prisma`
2. Run `npm run prisma:migrate:dev`
3. Test changes
4. Commit migration files

### Production
1. Test migration in staging
2. Backup production database
3. Run `npm run prisma:migrate:deploy`
4. Verify data integrity
5. Monitor for errors

---

## Security Best Practices

1. **Never commit `.env`** - Use `.env.example` as template
2. **Use strong passwords** - Generate with `openssl rand -base64 32`
3. **Restrict database access** - Use firewall rules
4. **Regular backups** - Automate with cron jobs
5. **SSL connections** - Add `?sslmode=require` to production DATABASE_URL

---

## Useful Commands Reference

```bash
# Generate Prisma client
npm run prisma:generate

# Create migration
npm run prisma:migrate:dev

# Apply migrations (production)
npm run prisma:migrate:deploy

# Reset database (destructive!)
npm run prisma:migrate:reset

# Open Prisma Studio
npm run prisma:studio

# Format schema file
npm run prisma:format

# Validate schema
npm run prisma:validate

# Push schema without migration
npm run prisma:push

# Pull schema from database
npm run prisma:pull
```
