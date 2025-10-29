# BioQuest Deployment Guide

**Last Updated:** 2025-01-27

This guide covers deploying BioQuest with focus on **zero surprise bills** and **predictable costs**.

---

## ⚠️ Critical Warning: Avoid Usage-Based Billing

### **Platforms to AVOID for Production:**

#### **Vercel** ❌
- **Risk Level:** HIGH
- **Why avoid:**
  - DDoS attacks → $1000+ bills documented on X/Twitter
  - Bandwidth overages can explode
  - Edge function invocations multiply costs
  - "Pause at 100%" doesn't always work reliably
  - Requires support tickets to dispute charges
- **Verdict:** Great for demos, risky for production

#### **AWS/GCP/Azure** ❌
- **Risk Level:** EXTREME
- Complex pricing models, easy to misconfigure
- Bandwidth egress costs can be massive
- Hard to set true spending limits
- Only for enterprises with dedicated DevOps

---

## ✅ Recommended Deployment Options

### **Option 1: Cloudflare Pages + D1** ⭐ RECOMMENDED FOR PRODUCTION

**Cost:** $0/month (truly free forever)

#### **Why it's the best choice for BioQuest:**

- ✅ **Unlimited bandwidth** - truly free (not a trick)
- ✅ **10 GB database storage** free (20x more than Neon!)
- ✅ **5 million reads/day** + **100,000 writes/day** free
- ✅ **Hard capped** - stops at limit, no charges
- ✅ **Global CDN** - 300+ edge locations
- ✅ **DDoS protection** included
- ✅ **Automatic HTTPS** - SSL certificates managed
- ✅ **Same network** - ultra-low latency between app and database
- ✅ **SQLite-compatible** - BioQuest already uses SQLite!
- ✅ **No credit card needed** - stay free forever

#### **BioQuest-Specific Benefits:**

BioQuest is **SQLite-native** via Prisma, making it a perfect match for Cloudflare D1:
- No database migration needed
- Development SQLite → Production D1 seamlessly
- Prisma handles both identically
- Better performance than separate database

#### **Free Tier Limits (per day):**
- 10 GB storage
- 5 million reads
- 100,000 writes
- 500 builds/month
- Unlimited bandwidth
- Unlimited requests

#### **Perfect for:**
- Production deployments
- MVP validation
- Portfolio projects
- Zero budget constraints
- Apps needing global performance

---

### **Option 2: Hetzner VPS** (Fixed Cost Alternative)

**Cost:** €4.15/month FIXED (impossible to exceed)

#### **Why consider this:**

- ✅ **Fixed monthly cost** - literally impossible to go over
- ✅ **20TB bandwidth included** - way more than needed
- ✅ **Professional hosting** - real infrastructure
- ✅ **EU-based** - GDPR compliant
- ✅ **Full control** - any tech stack works
- ✅ **Easy to scale** - upgrade to bigger VPS anytime

#### **Specs (CPX11):**
- 2 vCPU (AMD)
- 2 GB RAM
- 40 GB SSD
- 20 TB bandwidth
- Germany/Finland/USA locations
- Backups: €0.83/month (20% of server cost)

#### **Perfect for:**
- Someone who wants full control
- Learning server administration
- Custom configurations
- Multiple projects on same server

#### **Deployment Complexity:** ⭐⭐⭐ (Medium - needs Docker/Linux knowledge)

---

### **Option 3: Railway** (with spending limits)

**Cost:** $5 free credit/month, ~$5-15/month paid

#### **Why it's okay:**

- ✅ Can set hard spending limits
- ✅ Simple setup (git push to deploy)
- ✅ Database included (PostgreSQL)
- ✅ Good developer experience
- ⚠️ Still usage-based pricing

#### **Risk Level:** LOW (if you set limits)

**Important:** Set spending limit in Settings → Usage Limits → Set max $10/month

#### **Perfect for:**
- Quick MVPs
- Temporary projects
- Teams who need simplicity

#### **Deployment Complexity:** ⭐ (Easiest)

---

## 🚀 Deployment Guide: Cloudflare Pages + D1

### **Pre-Deployment Checklist**

- [ ] All tests passing (`npm test`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] iNaturalist OAuth app created (or will create after deployment)
- [ ] GitHub repository ready

### **Step 1: Create D1 Database**

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create D1 database
wrangler d1 create bioquest

# Output will show:
# [[d1_databases]]
# binding = "DB"
# database_name = "bioquest"
# database_id = "xxxx-xxxx-xxxx-xxxx"
# Save the database_id!
```

### **Step 2: Verify Prisma Schema (Already Configured)**

BioQuest already uses SQLite, so no changes needed:

```prisma
// prisma/schema.prisma (already correct!)
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// No changes needed - ready for D1!
```

### **Step 3: Run Database Migrations**

```bash
# Generate migration SQL
npx prisma migrate dev --name init

# Upload schema to D1
wrangler d1 execute bioquest --file=./prisma/migrations/XXXXXX_init/migration.sql

# Or run all migrations at once
wrangler d1 execute bioquest --command="$(cat prisma/migrations/*/migration.sql)"
```

### **Step 4: Seed Database (Optional but Recommended)**

```bash
# Run seed script against D1
npm run db:seed:d1

# Or manually insert badge data
wrangler d1 execute bioquest --command="INSERT INTO Badge (code, name, ...) VALUES (...);"
```

### **Step 5: Setup Cloudflare Pages**

```bash
# Go to https://dash.cloudflare.com
# Navigate to: Workers & Pages → Create application → Pages
# Click: Connect to Git

# Select repository: bioquest
# Click: Begin setup

# Build settings:
Framework preset: Next.js
Build command: npm run build
Build output directory: .next
Root directory: / (leave empty)
```

### **Step 6: Configure Environment Variables**

In Cloudflare Pages → Settings → Environment Variables, add:

**Required Variables:**

```env
# NextAuth
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
NEXTAUTH_URL=https://your-project.pages.dev

# iNaturalist OAuth (add after creating OAuth app)
INATURALIST_CLIENT_ID=your_inaturalist_client_id
INATURALIST_CLIENT_SECRET=your_inaturalist_client_secret

# App
NEXT_PUBLIC_APP_URL=https://your-project.pages.dev
NEXT_PUBLIC_APP_NAME=BioQuest
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### **Step 7: Bind D1 Database to Pages**

```bash
# In Cloudflare Dashboard:
# Pages → Your Project → Settings → Functions
# Scroll to: "D1 database bindings"
# Click: Add binding

# Variable name: DB
# D1 database: bioquest (select from dropdown)

# Click: Save
```

### **Step 8: Deploy**

```bash
# Push to main branch
git add .
git commit -m "Configure for Cloudflare Pages deployment"
git push origin main

# Cloudflare auto-builds and deploys
# Watch logs in dashboard
# Access at: your-project.pages.dev
```

### **Step 9: Setup iNaturalist OAuth (Post-Deployment)**

1. **Create OAuth Application**
   - Go to https://www.inaturalist.org/oauth/applications/new
   - Application Name: `BioQuest`
   - Redirect URI: `https://your-project.pages.dev/api/auth/callback/inaturalist`
   - Scopes: `read` (minimum required)

2. **Get Credentials**
   - Copy Application ID → Update `INATURALIST_CLIENT_ID` in Cloudflare
   - Copy Secret → Update `INATURALIST_CLIENT_SECRET` in Cloudflare

3. **Redeploy**
   - Push any change to trigger rebuild
   - Or manually redeploy in Cloudflare dashboard

### **Step 10: Custom Domain (Optional)**

```bash
# In Cloudflare Pages → Custom domains
# Click: Set up a custom domain
# Enter your domain (must be on Cloudflare DNS)
# Cloudflare handles DNS automatically
# HTTPS certificate auto-provisioned
```

### **Step 11: Verify Deployment**

```bash
# Test health endpoint
curl https://your-project.pages.dev/api/health

# Test authentication flow
# Visit /signin and try logging in

# Check database connection
wrangler d1 execute bioquest --command="SELECT COUNT(*) FROM User;"
```

---

## 🚀 Alternative: Hetzner VPS Deployment

For those who prefer full control with fixed costs.

### **Step 1: Create VPS**

```bash
# Go to https://console.hetzner.cloud/
# Register account
# Create project: "bioquest"
# Add server:
#   Location: Falkenstein (Germany) or Helsinki (Finland)
#   Image: Ubuntu 22.04
#   Type: CPX11 (€4.15/month)
#   SSH Key: Add your public key
```

### **Step 2: Initial Server Setup**

```bash
# SSH into server
ssh root@YOUR_SERVER_IP

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Install Docker Compose
apt install docker-compose -y

# Install Caddy (automatic HTTPS)
apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | \
  gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | \
  tee /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install caddy

# Create app directory
mkdir -p /opt/bioquest
cd /opt/bioquest
```

### **Step 3: Create docker-compose.yml**

```yaml
# /opt/bioquest/docker-compose.yml
version: '3.8'

services:
  app:
    image: node:20-alpine
    container_name: bioquest-app
    working_dir: /app
    volumes:
      - ./app:/app
      - /app/node_modules
      - /app/.next
      - ./data:/app/data  # SQLite database volume
    environment:
      NODE_ENV: production
      DATABASE_URL: file:/app/data/bioquest.db
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: ${NEXTAUTH_URL}
      INATURALIST_CLIENT_ID: ${INATURALIST_CLIENT_ID}
      INATURALIST_CLIENT_SECRET: ${INATURALIST_CLIENT_SECRET}
      NEXT_PUBLIC_APP_URL: ${NEXTAUTH_URL}
      NEXT_PUBLIC_APP_NAME: BioQuest
    command: sh -c "npm ci --only=production && npx prisma migrate deploy && npm run build && npm start"
    restart: unless-stopped
    ports:
      - "3000:3000"

volumes:
  data:
```

**Note:** BioQuest uses SQLite, so no PostgreSQL container needed!

### **Step 4: Deploy Application**

```bash
# Clone repository
cd /opt/bioquest
git clone https://github.com/yourusername/bioquest.git app

# Create .env file
nano .env
```

Add environment variables:

```env
NEXTAUTH_SECRET=your_nextauth_secret_from_openssl_rand_base64_32
NEXTAUTH_URL=https://yourdomain.com
INATURALIST_CLIENT_ID=your_inaturalist_client_id
INATURALIST_CLIENT_SECRET=your_inaturalist_client_secret
```

```bash
# Start app
docker-compose up -d

# Check logs
docker-compose logs -f app
```

### **Step 5: Setup Caddy for HTTPS**

```bash
# Configure Caddy
nano /etc/caddy/Caddyfile

# Add:
yourdomain.com {
    reverse_proxy localhost:3000

    # Security headers
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
    }

    # Enable compression
    encode gzip zstd

    # Logging
    log {
        output file /var/log/caddy/bioquest.log
        format json
    }
}

# Reload Caddy
systemctl reload caddy
systemctl status caddy
```

### **Step 6: Security Hardening**

```bash
# Setup UFW firewall
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable

# Disable password authentication
nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
systemctl restart sshd

# Setup automatic security updates
apt install unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

# Setup fail2ban
apt install fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

### **Step 7: Automated Backups**

```bash
# Create backup script
nano /opt/bioquest/backup.sh

# Add:
#!/bin/bash
BACKUP_DIR="/opt/bioquest/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup SQLite database
cp /opt/bioquest/data/bioquest.db "$BACKUP_DIR/bioquest_$TIMESTAMP.db"
gzip "$BACKUP_DIR/bioquest_$TIMESTAMP.db"

# Keep only last 30 days
find $BACKUP_DIR -name "bioquest_*.db.gz" -mtime +30 -delete

echo "Backup completed: $TIMESTAMP"

# Make executable
chmod +x /opt/bioquest/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add line:
0 2 * * * /opt/bioquest/backup.sh >> /var/log/bioquest-backup.log 2>&1
```

---

## 🚀 Railway Deployment (Quick Setup)

### **Step 1: Sign Up and Set Limits**

```bash
# Go to https://railway.app
# Sign up with GitHub
# Go to Settings → Usage
# Set spending limit: $10/month
```

### **Step 2: Create Project**

```bash
# Dashboard → New Project
# "Deploy from GitHub repo"
# Select bioquest repository
```

### **Step 3: Configure Environment**

Railway doesn't need a separate database for SQLite - files are persisted.

In Railway → Your app → Variables, add:

```env
DATABASE_URL=file:/app/data/bioquest.db
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=${{RAILWAY_PUBLIC_DOMAIN}}
INATURALIST_CLIENT_ID=your_id
INATURALIST_CLIENT_SECRET=your_secret
NEXT_PUBLIC_APP_URL=${{RAILWAY_PUBLIC_DOMAIN}}
NEXT_PUBLIC_APP_NAME=BioQuest
```

### **Step 4: Deploy**

Railway auto-deploys. After deployment:

```bash
# Open shell in Railway dashboard
npx prisma migrate deploy
npm run db:seed
```

---

## 📊 Cost Comparison

| Platform | Setup | Monthly | Year 1 | Surprise Risk | Best For |
|----------|-------|---------|--------|---------------|----------|
| **Cloudflare + D1** ⭐ | $0 | $0 | $0 | **0%** ✅ | Production |
| **Hetzner VPS** | $0 | €4.15 | ~$54 | **0%** ✅ | Full control |
| **Railway** | $0 | $5-15 | $60-180 | **LOW** ⚠️ | Quick MVP |
| **Vercel** | $0 | $0-??? | $0-∞ | **HIGH** ❌ | Demos only |

---

## 🎯 Recommendation

### **For BioQuest:**

**Primary Choice: Cloudflare Pages + D1**
- Zero cost forever
- Perfect match (BioQuest uses SQLite)
- Production-ready
- Global performance
- 10 GB free storage
- No credit card needed

**Alternative: Hetzner VPS (€4.15/month)**
- Fixed cost, no surprises
- Full control
- Professional hosting
- Easy to scale

**Quick Test: Railway ($5-15/month)**
- Set spending limit immediately
- Fastest to deploy
- Good for validation

---

## 📋 Post-Deployment Checklist

### **Security:**
- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Dependencies up to date
- [ ] No secrets in git history

### **Monitoring:**
- [ ] Setup health checks
- [ ] Configure uptime monitoring (UptimeRobot free tier)
- [ ] Test error tracking
- [ ] Monitor database size

### **Testing:**
- [ ] Sign in with iNaturalist works
- [ ] Observation sync works
- [ ] Dashboard displays correctly
- [ ] Badges display correctly
- [ ] Mobile responsiveness verified

---

## 🔧 Database Management

### **Cloudflare D1 Commands:**

```bash
# List databases
wrangler d1 list

# Execute SQL query
wrangler d1 execute bioquest --command="SELECT * FROM User LIMIT 10"

# Run SQL file
wrangler d1 execute bioquest --file=./query.sql

# Export data
wrangler d1 export bioquest --output=backup.sql

# Check database size
wrangler d1 execute bioquest --command="SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()"
```

### **SQLite Backup (Hetzner/Railway):**

```bash
# Backup
sqlite3 bioquest.db ".backup backup.db"

# Or with compression
sqlite3 bioquest.db ".backup '/tmp/backup.db'" && gzip /tmp/backup.db

# Restore
sqlite3 bioquest.db ".restore backup.db"
```

---

## 🚨 Troubleshooting

### **"Can't connect to database"**
- **D1:** Check binding name in Cloudflare (should be "DB")
- **SQLite:** Check file path and permissions
- Verify DATABASE_URL format

### **"NextAuth session not working"**
- Verify NEXTAUTH_URL matches your domain exactly
- Check NEXTAUTH_SECRET is set
- Ensure cookies are allowed

### **"iNaturalist OAuth fails"**
- Verify redirect URI matches exactly (https://yourdomain.com/api/auth/callback/inaturalist)
- Check client ID and secret
- Ensure app is not in testing mode

### **"Build fails in production"**
- Run `npm run build` locally first
- Check all environment variables are set
- Verify no development-only dependencies in code

---

## 📈 Scaling Strategy

### **Cloudflare Pages:**
- Automatic global scaling via CDN
- No configuration needed
- Handles traffic spikes automatically

### **D1 Database:**
- 5M reads/day = 57 reads/second average
- 100K writes/day = 1.15 writes/second average
- More than enough for most apps
- If exceeded, consider upgrading to paid tier or Hetzner VPS

### **Hetzner VPS:**
- Upgrade to bigger instance (€8.30/month for CPX21)
- Add load balancer when needed
- Scale vertically first, then horizontally

---

## 🔍 Monitoring & Performance

### **Essential Metrics:**
- Response time (target: <500ms)
- Error rate (target: <1%)
- Database size (D1: 10GB limit)
- Daily API calls to iNaturalist (stay under 60/min per user)

### **Free Monitoring Tools:**
- **UptimeRobot** - Uptime monitoring (free for 50 monitors)
- **Cloudflare Analytics** - Built-in (free)
- **Sentry** - Error tracking (free tier: 5K errors/month)

---

## 📚 Resources

### **Cloudflare:**
- D1 Docs: https://developers.cloudflare.com/d1/
- Pages Docs: https://developers.cloudflare.com/pages/
- Community: https://community.cloudflare.com
- Status: https://www.cloudflarestatus.com

### **Hetzner:**
- Docs: https://docs.hetzner.com
- Community: https://community.hetzner.com
- Status: https://status.hetzner.com

### **Railway:**
- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway
- Status: https://status.railway.app

---

## 🎓 Next Steps After Deployment

1. **Enable Analytics**
   - Setup Cloudflare Web Analytics (free)
   - Track key metrics (signups, syncs, active users)

2. **Setup Error Monitoring**
   - Install Sentry for error tracking
   - Configure alerts for critical errors

3. **Performance Monitoring**
   - Monitor API response times
   - Track iNaturalist API usage
   - Watch database growth

4. **User Feedback**
   - Add feedback mechanism
   - Monitor user engagement
   - Track badge unlock rates

5. **Scale Planning**
   - Monitor D1 usage limits
   - Plan upgrade path if needed
   - Consider adding caching layer

---

**Last Updated:** 2025-01-27
**Recommended Platform:** Cloudflare Pages + D1
**Fallback:** Hetzner VPS (€4.15/month)
**Questions?** Open an issue on GitHub
