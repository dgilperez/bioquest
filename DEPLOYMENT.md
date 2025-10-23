# Deployment Guide

This guide covers deploying BioQuest to production environments.

---

## Pre-Deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] iNaturalist OAuth app created
- [ ] SSL certificate ready (production)

---

## Recommended Platforms

### 1. Vercel (Recommended for Next.js)

**Pros:**
- Zero-config Next.js deployment
- Automatic HTTPS
- Preview deployments for PRs
- Edge functions support
- Free tier available

**Steps:**

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login and Deploy**
```bash
vercel login
vercel
```

3. **Configure Environment Variables**

In Vercel Dashboard → Settings → Environment Variables, add:

```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://your-domain.com
INATURALIST_CLIENT_ID=...
INATURALIST_CLIENT_SECRET=...
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_APP_NAME=BioQuest
```

4. **Configure Database**

For Vercel, recommend using:
- **Neon** (serverless PostgreSQL)
- **Supabase** (PostgreSQL + auth)
- **PlanetScale** (MySQL alternative)

5. **Run Migrations**

```bash
# In your terminal with production DATABASE_URL
npx prisma migrate deploy
npm run db:seed
```

6. **Deploy**

```bash
vercel --prod
```

### 2. Railway

**Pros:**
- Built-in PostgreSQL
- Simple pricing
- Automatic deployments from GitHub

**Steps:**

1. **Create New Project**
   - Go to railway.app
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

2. **Add PostgreSQL**
   - Click "New" → "Database" → "PostgreSQL"
   - Copy the DATABASE_URL

3. **Configure Environment Variables**
   - Add all required env vars from `.env.example`

4. **Deploy**
   - Railway automatically deploys on git push
   - Monitor logs in dashboard

### 3. Digital Ocean App Platform

**Pros:**
- Full-featured PaaS
- Managed databases
- Predictable pricing

**Steps:**

1. **Create New App**
```bash
# Install doctl
brew install doctl

# Login
doctl auth init

# Create app
doctl apps create --spec .do/app.yaml
```

2. **Configure App Spec** (`.do/app.yaml`)

```yaml
name: bioquest
services:
  - name: web
    github:
      repo: your-username/bioquest
      branch: main
      deploy_on_push: true
    build_command: npm run build
    run_command: npm start
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    envs:
      - key: DATABASE_URL
        value: ${db.DATABASE_URL}
      - key: NEXTAUTH_SECRET
        type: SECRET
      - key: NEXTAUTH_URL
        value: ${APP_URL}
      - key: INATURALIST_CLIENT_ID
        type: SECRET
      - key: INATURALIST_CLIENT_SECRET
        type: SECRET
databases:
  - name: db
    engine: PG
    version: "16"
```

3. **Deploy**

```bash
doctl apps create-deployment <app-id>
```

---

## Database Setup (Production)

### Option 1: Neon (Serverless PostgreSQL)

1. Create account at neon.tech
2. Create new project
3. Copy connection string
4. Update DATABASE_URL in env vars
5. Run migrations:

```bash
DATABASE_URL="your-neon-url" npx prisma migrate deploy
DATABASE_URL="your-neon-url" npm run db:seed
```

### Option 2: Supabase

1. Create account at supabase.com
2. Create new project
3. Get connection string from Settings → Database
4. Update DATABASE_URL with connection pooler URL
5. Run migrations (same as above)

### Option 3: Self-Hosted PostgreSQL

```bash
# On your server
sudo apt update
sudo apt install postgresql

# Create database
sudo -u postgres createdb bioquest
sudo -u postgres createuser bioquest_user
sudo -u postgres psql -c "ALTER USER bioquest_user WITH PASSWORD 'secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE bioquest TO bioquest_user;"

# Configure firewall
sudo ufw allow 5432/tcp

# Run migrations
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

---

## iNaturalist OAuth Setup

1. **Create OAuth Application**
   - Go to https://www.inaturalist.org/oauth/applications/new
   - Application Name: `BioQuest` (or your app name)
   - Redirect URI: `https://your-domain.com/api/auth/callback/inaturalist`
   - Scopes: `read` (minimum required)

2. **Get Credentials**
   - Copy Application ID → `INATURALIST_CLIENT_ID`
   - Copy Secret → `INATURALIST_CLIENT_SECRET`

3. **Update Environment Variables**

---

## SSL/HTTPS Setup

### Vercel/Railway
- Automatic HTTPS included

### Custom Domain
```bash
# Using Let's Encrypt with Certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Environment Variables

### Required

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://your-production-domain.com"

# iNaturalist OAuth
INATURALIST_CLIENT_ID="your-client-id"
INATURALIST_CLIENT_SECRET="your-client-secret"

# App
NEXT_PUBLIC_APP_URL="https://your-production-domain.com"
NEXT_PUBLIC_APP_NAME="BioQuest"
```

### Optional

```env
# Analytics
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"

# Error Monitoring
SENTRY_DSN="https://..."

# Logging
LOG_LEVEL="info"
```

---

## Post-Deployment Tasks

### 1. Verify Deployment

```bash
# Check health endpoint
curl https://your-domain.com/api/health

# Test authentication flow
# Visit /signin and try logging in

# Check database
npx prisma studio
```

### 2. Monitor Logs

```bash
# Vercel
vercel logs

# Railway
railway logs

# Self-hosted
pm2 logs bioquest
```

### 3. Setup Monitoring

**Recommended Tools:**
- **Sentry** - Error tracking
- **Vercel Analytics** - Performance monitoring
- **Uptime Robot** - Uptime monitoring
- **LogRocket** - Session replay

### 4. Seed Badge Data

```bash
# Run seed script in production
npm run db:seed
```

### 5. Test Critical Flows

- [ ] Sign in with iNaturalist
- [ ] Sync observations
- [ ] View dashboard
- [ ] Check badges page
- [ ] Verify notifications work

---

## Performance Optimization

### 1. Enable Compression

Next.js includes automatic compression. Verify in `next.config.js`:

```javascript
module.exports = {
  compress: true,
}
```

### 2. Database Connection Pooling

Update DATABASE_URL:

```env
DATABASE_URL="postgresql://...?connection_limit=10&pool_timeout=10"
```

Or use PgBouncer (recommended for high traffic):

```bash
# Install
sudo apt install pgbouncer

# Configure /etc/pgbouncer/pgbouncer.ini
[databases]
bioquest = host=localhost port=5432 dbname=bioquest

[pgbouncer]
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
```

### 3. Enable Caching

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=300' },
        ],
      },
    ];
  },
};
```

### 4. Image Optimization

Images are automatically optimized by Next.js Image component.

---

## Backup Strategy

### 1. Database Backups

**Automated (Recommended):**

```bash
# Cron job for daily backups
0 2 * * * pg_dump -U bioquest_user bioquest | gzip > /backups/bioquest_$(date +\%Y\%m\%d).sql.gz

# Keep only last 30 days
0 3 * * * find /backups -name "bioquest_*.sql.gz" -mtime +30 -delete
```

**Manual:**

```bash
# Backup
pg_dump -U bioquest_user bioquest > backup.sql

# Restore
psql -U bioquest_user bioquest < backup.sql
```

### 2. Code Backups

Use git tags for releases:

```bash
git tag -a v0.1.0 -m "MVP Release"
git push origin v0.1.0
```

---

## Rollback Procedure

### 1. Vercel
```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback <deployment-url>
```

### 2. Railway
- Use dashboard to rollback to previous deployment

### 3. Database Migration Rollback
```bash
# Find migration to rollback to
npx prisma migrate status

# Rollback (careful!)
# Prisma doesn't support automatic rollback
# You need to manually restore from backup
```

---

## Monitoring & Alerts

### Setup Uptime Monitoring

```bash
# Example with UptimeRobot API
curl -X POST https://api.uptimerobot.com/v2/newMonitor \
  -d "api_key=YOUR_API_KEY" \
  -d "friendly_name=BioQuest Production" \
  -d "url=https://your-domain.com" \
  -d "type=1"
```

### Setup Error Alerts

Install Sentry:

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

---

## Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Database passwords strong (20+ chars)
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] SQL injection protection (Prisma handles this)
- [ ] XSS protection (React handles this)
- [ ] CSRF protection (NextAuth handles this)
- [ ] Security headers configured
- [ ] Dependencies up to date
- [ ] No secrets in git history

---

## Common Issues & Solutions

### "Can't connect to database"
- Check DATABASE_URL format
- Verify database is running
- Check firewall rules
- Ensure IP whitelisting (if using cloud DB)

### "NextAuth session not working"
- Verify NEXTAUTH_URL matches your domain
- Check NEXTAUTH_SECRET is set
- Ensure cookies are allowed

### "iNaturalist OAuth fails"
- Verify redirect URI matches exactly
- Check client ID and secret
- Ensure app is not in testing mode

### "Build fails in production"
- Run `npm run build` locally first
- Check for environment-specific code
- Verify all dependencies in package.json

---

## Scaling Considerations

### Horizontal Scaling
- Use multiple Next.js instances behind load balancer
- Share session store (Redis recommended)
- Use CDN for static assets

### Database Scaling
- Enable read replicas for heavy read workloads
- Use connection pooling (PgBouncer)
- Consider caching layer (Redis)

### Caching Strategy
- API responses: 60s cache with stale-while-revalidate
- Static assets: CDN with long cache times
- User stats: Denormalized in database for fast reads

---

## Production Checklist

### Before Launch
- [ ] All environment variables configured
- [ ] Database migrated and seeded
- [ ] SSL certificate installed
- [ ] Monitoring setup
- [ ] Backups configured
- [ ] Error tracking enabled
- [ ] Performance testing done
- [ ] Security audit completed

### After Launch
- [ ] Monitor error rates
- [ ] Check response times
- [ ] Verify user signups working
- [ ] Test sync functionality
- [ ] Monitor database performance
- [ ] Review logs for issues

---

## Support & Troubleshooting

For production issues:
1. Check application logs
2. Review error tracking (Sentry)
3. Verify database connectivity
4. Check external API status (iNaturalist)
5. Review recent deployments

For assistance, open an issue on GitHub.
