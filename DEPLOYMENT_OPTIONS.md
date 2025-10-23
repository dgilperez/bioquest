# BioQuest Deployment Options - Complete Guide

**Last Updated:** 2025-10-22

This guide compares all viable hosting options with a focus on **zero surprise bills** and **predictable costs**.

---

## ⚠️ The Truth About "Free Tiers"

### **Platforms to AVOID:**

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
- **Why avoid:**
  - Complex pricing models
  - Easy to misconfigure and rack up charges
  - Bandwidth egress costs can be massive
  - Hard to set true spending limits
  - Billing nightmares are common
- **Verdict:** Only for enterprises with dedicated DevOps

#### **Netlify** ⚠️
- **Risk Level:** MEDIUM
- **Why caution:**
  - Similar bandwidth overage issues as Vercel
  - Less DDoS protection
  - Build minute limits can be restrictive
- **Verdict:** Better than Vercel, but still risky

---

## ✅ Safe Deployment Options (Ranked)

### **Option 1: Hetzner VPS** ⭐ RECOMMENDED

**Cost:** €4.15/month FIXED (impossible to exceed)

#### **Why it's the best:**
- ✅ **Fixed monthly cost** - literally impossible to go over
- ✅ **20TB bandwidth included** - way more than needed
- ✅ **Professional hosting** - not a toy, real infrastructure
- ✅ **EU-based** - GDPR compliant, great privacy
- ✅ **Excellent reputation** - been around since 1997
- ✅ **Easy to scale** - upgrade to bigger VPS anytime
- ✅ **Standard Ubuntu VPS** - any tech stack works

#### **Specs (CPX11):**
- 2 vCPU (AMD)
- 2 GB RAM
- 40 GB SSD
- 20 TB bandwidth
- Germany/Finland/USA locations
- Backups: €0.83/month (20% of server cost)

#### **Perfect for:**
- Someone who wants full control
- Predictable monthly costs
- Professional hosting
- Learning server administration

#### **Deployment Complexity:** ⭐⭐⭐ (Medium - needs Docker/Linux knowledge)

---

### **Option 2: Sherpa.sh** ⭐ BEST FOR SIMPLICITY

**Cost:** $0-29/month (clear tiers)

#### **What is Sherpa:**
Sherpa is a deployment platform specifically designed for **indie developers** who want:
- Simple pricing (no surprise bills)
- Git-based deployments
- Automatic HTTPS
- Built-in database
- No vendor lock-in (uses standard Docker)

#### **Pricing:**
- **Hobby:** $0/month
  - 1 app
  - 512 MB RAM
  - 1 GB storage
  - Auto-sleep after inactivity
  - Community support

- **Pro:** $29/month
  - 5 apps
  - 2 GB RAM per app
  - 10 GB storage
  - No auto-sleep
  - Email support
  - Custom domains

- **Team:** $99/month
  - Unlimited apps
  - 4 GB RAM per app
  - 50 GB storage
  - Priority support

#### **Why it's great:**
- ✅ **Clear pricing tiers** - no usage-based billing
- ✅ **Hard limits** - app stops instead of billing
- ✅ **Built for indie devs** - understands our needs
- ✅ **Includes database** - PostgreSQL included
- ✅ **Simple deploys** - git push to deploy
- ✅ **Docker-based** - no vendor lock-in
- ✅ **Automatic HTTPS** - SSL included
- ✅ **Auto-sleep on free tier** - saves resources

#### **Perfect for:**
- Indie developers
- MVP testing
- Someone who wants simplicity over control
- Projects that might scale

#### **Deployment Complexity:** ⭐ (Easiest - literally git push)

---

### **Option 3: Raspberry Pi at Home** ⭐ ZERO ONGOING COSTS

**Cost:** $115 one-time + ~$2/month electricity

#### **Hardware:**
- Raspberry Pi 5 (4GB): $80
- MicroSD card (64GB): $15
- Official power supply: $10
- Case with fan: $10
- **Total:** $115

#### **Why it's awesome:**
- ✅ **Zero cloud bills** - forever
- ✅ **Full control** - your hardware, your rules
- ✅ **Great learning** - understand the full stack
- ✅ **Multiple projects** - run whatever you want
- ✅ **Cloudflare Tunnel** - free HTTPS + DDoS protection
- ✅ **No bandwidth limits** - your ISP limits only
- ✅ **Fun factor** - physical computer you can see

#### **Caveats:**
- ❌ Internet goes down = app goes down
- ❌ Power outage = downtime (unless UPS)
- ❌ Your responsibility to maintain
- ❌ Slower than cloud hosting
- ❌ Not suitable for high traffic

#### **Perfect for:**
- Enthusiasts who want to learn
- Testing/development
- Personal projects
- Zero budget constraints
- Someone with stable internet

#### **Deployment Complexity:** ⭐⭐⭐⭐ (Advanced - full stack required)

---

### **Option 4: Cloudflare Pages + Database** ⭐ ACTUALLY FREE

**Cost:** $0/month (truly free forever)

#### **Cloudflare Pages:**
- **Unlimited bandwidth** - truly free (not a trick)
- 500 builds/month
- Automatic HTTPS
- Global CDN (300+ locations)
- DDoS protection included
- Hard limits - stops, doesn't charge

#### **Database Options (choose one):**

**Option A: Cloudflare D1** (RECOMMENDED - fully integrated)
- ✅ **10 GB storage** free (20x more than Neon!)
- ✅ **5 million reads/day** free
- ✅ **100,000 writes/day** free
- ✅ **Same network as Pages** - ultra-low latency
- ✅ **Hard capped** - stops at limit, no charges
- ✅ **SQLite-compatible** - simple and fast
- ⚠️ SQLite not PostgreSQL (but Prisma supports both)

**Option B: Neon PostgreSQL** (if you need PostgreSQL)
- 0.5 GB storage free (less than D1)
- Auto-suspend after 5 min inactivity
- 1 compute unit (shared)
- PostgreSQL compatible
- Hard capped at quota
- Separate network (slight latency vs D1)

#### **Why it's safe:**
- ✅ **Actual hard limits** - can't exceed even if you try
- ✅ **No bandwidth charges** - unlimited on CF free tier
- ✅ **DDoS protected** - Cloudflare handles it
- ✅ **Can stay free forever** - don't add payment method
- ✅ **Global performance** - Cloudflare's edge network
- ✅ **D1 has 20x more storage** than Neon free tier

#### **Bonus - Cloudflare's Other Free Services:**
If you use Cloudflare, you also get access to:
- **R2 Storage** - 10 GB free (like S3, for images/files)
- **Workers KV** - 100,000 reads/day free (key-value store)
- **Queues** - 1 million operations/month free
- **Durable Objects** - 1 million requests/month free
- **All have hard limits** - no surprise bills!

#### **Caveats:**
- ❌ D1 is newer tech (less mature than PostgreSQL)
- ❌ Neon free tier is slow with cold starts
- ❌ Neon only 0.5 GB storage (D1 has 10 GB)
- ❌ More setup complexity
- ❌ Limited customization

#### **Perfect for:**
- MVP testing
- Portfolio projects
- Learning deployments
- Absolute zero budget

#### **Deployment Complexity:** ⭐⭐ (Easy-Medium)

---

### **Option 5: Railway (with spending limits)** ⚠️

**Cost:** $5 free credit/month, ~$5-15/month paid

#### **What is Railway:**
- All-in-one platform (app + database)
- Git-based deployments
- PostgreSQL included
- Simple pricing
- **Can set hard spending limits**

#### **Pricing:**
- $5/month free credit (rolls over!)
- Pay-as-you-go beyond that
- ~$0.000231/GB-hour for compute
- ~$0.20/GB for storage

#### **Cost Control:**
```
Settings → Usage Limits → Set max $10/month
```

#### **Why it's okay:**
- ✅ Can set hard spending limits
- ✅ Simple setup
- ✅ Database included
- ✅ Good DX
- ⚠️ Still usage-based pricing

#### **Risk Level:** LOW (if you set limits)

#### **Perfect for:**
- Quick MVPs
- Temporary projects
- Teams who need simplicity

#### **Deployment Complexity:** ⭐ (Easiest)

---

## 💰 Cost Comparison (1 Year)

| Platform | Setup Cost | Monthly Cost | Year 1 Total | Surprise Bill Risk | Best For |
|----------|------------|--------------|--------------|-------------------|----------|
| **Hetzner VPS** | $0 | €4.15 (~$4.50) | ~$54 | **0%** ✅ | Production |
| **Sherpa.sh Free** | $0 | $0 | $0 | **0%** ✅ | Testing/MVP |
| **Sherpa.sh Pro** | $0 | $29 | $348 | **0%** ✅ | Growing startups |
| **Raspberry Pi** | $115 | $2 | $139 | **0%** ✅ | Learning/hobby |
| **Cloudflare + D1** | $0 | $0 | $0 | **0%** ✅ | MVP/portfolio/prod |
| **Cloudflare + Neon** | $0 | $0 | $0 | **0%** ✅ | MVP (slower) |
| **Railway** | $0 | $5-15 | $60-180 | **LOW** ⚠️ | Quick projects |
| **Vercel + DB** | $0 | $0-??? | $0-∞ | **HIGH** ❌ | Demos only |

---

## 🎯 Recommendation Matrix

### **For BioQuest Specifically:**

#### **Scenario 1: "I want the safest, most professional option"**
→ **Hetzner VPS**
- Fixed €4.15/month
- Zero surprise bills possible
- Professional hosting
- Easy to scale

#### **Scenario 2: "I want dead simple deployment"**
→ **Sherpa.sh Pro ($29/month)**
- Git push to deploy
- Database included
- Clear pricing
- No DevOps needed

#### **Scenario 3: "I want to learn and have zero ongoing costs"**
→ **Raspberry Pi + Cloudflare Tunnel**
- One-time $115 investment
- ~$2/month electricity
- Full control
- Great learning experience

#### **Scenario 4: "I just want to test the app for free"**
→ **Cloudflare Pages + D1 Database**
- $0 forever (10 GB storage!)
- True hard limits
- No credit card needed
- Global CDN
- Ultra-fast (same network)
- (Or use Neon if you specifically need PostgreSQL)

#### **Scenario 5: "I need it live in 10 minutes"**
→ **Railway (with $10 spending limit)**
- Fastest setup
- Set hard limit immediately
- Good enough for testing

---

## 🚀 Detailed Setup Guides

### **Setup 1: Hetzner VPS (Recommended)**

#### **Step 1: Create VPS**
```bash
# Go to https://console.hetzner.cloud/
# Register account
# Create project: "bioquest"
# Add server:
Location: Falkenstein (Germany) or Helsinki (Finland)
Image: Ubuntu 22.04
Type: CPX11 (€4.15/month)
SSH Key: Add your public key
```

#### **Step 2: Initial Server Setup**
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

#### **Step 3: Create docker-compose.yml**
```yaml
# /opt/bioquest/docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: bioquest-db
    environment:
      POSTGRES_DB: bioquest
      POSTGRES_USER: bioquest
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - bioquest-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U bioquest"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    image: node:20-alpine
    container_name: bioquest-app
    working_dir: /app
    volumes:
      - ./app:/app
      - /app/node_modules
      - /app/.next
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://bioquest:${DB_PASSWORD}@postgres:5432/bioquest
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: ${NEXTAUTH_URL}
      INATURALIST_CLIENT_ID: ${INATURALIST_CLIENT_ID}
      INATURALIST_CLIENT_SECRET: ${INATURALIST_CLIENT_SECRET}
      NEXT_PUBLIC_APP_URL: ${NEXTAUTH_URL}
      NEXT_PUBLIC_APP_NAME: BioQuest
    command: sh -c "npm ci --only=production && npm run build && npm start"
    restart: unless-stopped
    ports:
      - "3000:3000"
    networks:
      - bioquest-network
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  postgres_data:

networks:
  bioquest-network:
    driver: bridge
```

#### **Step 4: Setup Environment Variables**
```bash
# Create .env file
nano /opt/bioquest/.env

# Add these variables:
DB_PASSWORD=your_super_secure_password_here
NEXTAUTH_SECRET=your_nextauth_secret_from_openssl_rand_base64_32
NEXTAUTH_URL=https://yourdomain.com
INATURALIST_CLIENT_ID=your_inaturalist_client_id
INATURALIST_CLIENT_SECRET=your_inaturalist_client_secret
```

#### **Step 5: Deploy Application**
```bash
# Clone your repository
cd /opt/bioquest
git clone https://github.com/yourusername/bioquest.git app
cd app

# Run migrations
docker-compose up -d postgres
sleep 10
docker-compose exec postgres psql -U bioquest -c "SELECT 1"
# If connection works, run migrations from your local machine:
# DATABASE_URL="postgresql://bioquest:password@your-server-ip:5432/bioquest" npx prisma migrate deploy
# DATABASE_URL="postgresql://bioquest:password@your-server-ip:5432/bioquest" npm run db:seed

# Start app
cd /opt/bioquest
docker-compose up -d

# Check logs
docker-compose logs -f app
```

#### **Step 6: Setup Caddy for HTTPS**
```bash
# Configure Caddy
nano /etc/caddy/Caddyfile

# Add this content:
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

# Check status
systemctl status caddy
```

#### **Step 7: Security Hardening**
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

#### **Step 8: Automated Backups**
```bash
# Create backup script
nano /opt/bioquest/backup.sh

# Add this content:
#!/bin/bash
BACKUP_DIR="/opt/bioquest/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec -T postgres pg_dump -U bioquest bioquest | \
  gzip > "$BACKUP_DIR/bioquest_$TIMESTAMP.sql.gz"

# Keep only last 30 days
find $BACKUP_DIR -name "bioquest_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $TIMESTAMP"

# Make executable
chmod +x /opt/bioquest/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add line:
0 2 * * * /opt/bioquest/backup.sh >> /var/log/bioquest-backup.log 2>&1
```

#### **Step 9: Monitoring Setup**
```bash
# Install basic monitoring
apt install htop ncdu

# Setup log rotation
nano /etc/logrotate.d/bioquest
# Add:
/var/log/caddy/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 caddy caddy
    sharedscripts
    postrotate
        systemctl reload caddy
    endscript
}

# Check disk usage
df -h

# Check memory
free -h

# Check Docker containers
docker ps
docker stats --no-stream
```

#### **Step 10: Update Script**
```bash
# Create update script
nano /opt/bioquest/update.sh

# Add:
#!/bin/bash
cd /opt/bioquest/app
git pull origin main
docker-compose down
docker-compose up -d --build
echo "Update completed: $(date)"

# Make executable
chmod +x /opt/bioquest/update.sh

# To update: ./update.sh
```

**Monthly Cost:** €4.15 FIXED (no surprises)

---

### **Setup 2: Sherpa.sh (Simplest)**

#### **Step 1: Sign Up**
```bash
# Go to https://www.sherpa.sh/
# Sign up with GitHub
# Connect your repository
```

#### **Step 2: Create New App**
```bash
# In Sherpa Dashboard:
1. Click "New App"
2. Select your bioquest repository
3. Configure:
   - Framework: Next.js
   - Node version: 20
   - Build command: npm run build
   - Start command: npm start
```

#### **Step 3: Add Database**
```bash
# In Sherpa Dashboard:
1. Go to your app → Resources
2. Click "Add Database"
3. Select PostgreSQL
4. Copy DATABASE_URL (automatically added to env vars)
```

#### **Step 4: Set Environment Variables**
```bash
# In Sherpa Dashboard → Settings → Environment
Add:
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-app.sherpa.sh
INATURALIST_CLIENT_ID=your_client_id
INATURALIST_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_APP_URL=https://your-app.sherpa.sh
NEXT_PUBLIC_APP_NAME=BioQuest
```

#### **Step 5: Deploy**
```bash
# Sherpa auto-deploys from main branch
# Or manually trigger:
git push origin main

# In Sherpa Dashboard → Deployments
# Watch build logs

# Once deployed, run migrations via Sherpa CLI or dashboard terminal:
npx prisma migrate deploy
npm run db:seed
```

#### **Step 6: Custom Domain (Optional)**
```bash
# In Sherpa Dashboard → Settings → Domains
1. Add your domain
2. Update DNS records as shown
3. Wait for SSL certificate (automatic)
```

**Monthly Cost:**
- Free tier: $0 (with auto-sleep)
- Pro: $29 (no auto-sleep)

---

### **Setup 3: Raspberry Pi + Cloudflare Tunnel**

#### **Hardware Setup**
```bash
# 1. Buy hardware:
- Raspberry Pi 5 (4GB) - $80
- Samsung microSD 64GB - $15
- Official Pi 5 power supply - $10
- Case with fan - $10

# 2. Install OS:
- Download Raspberry Pi Imager
- Select: Ubuntu Server 22.04 LTS (64-bit)
- Flash to microSD
- Boot Pi
```

#### **Step 1: Initial Pi Setup**
```bash
# SSH into Pi
ssh ubuntu@raspberrypi.local
# Default password: ubuntu (will prompt to change)

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo apt install docker-compose -y

# Install git
sudo apt install git -y
```

#### **Step 2: Clone and Setup App**
```bash
# Clone repository
cd ~
git clone https://github.com/yourusername/bioquest.git
cd bioquest

# Create docker-compose.yml (same as Hetzner)
nano docker-compose.yml
# Paste the docker-compose.yml from Hetzner section

# Create .env
nano .env
# Add all environment variables
```

#### **Step 3: Setup Cloudflare Tunnel (Free HTTPS)**
```bash
# Install cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
sudo dpkg -i cloudflared-linux-arm64.deb

# Login to Cloudflare
cloudflared tunnel login
# Opens browser - login to Cloudflare account

# Create tunnel
cloudflared tunnel create bioquest
# Save the tunnel ID shown

# Route DNS
cloudflared tunnel route dns bioquest yourdomain.com

# Create config
mkdir -p ~/.cloudflared
nano ~/.cloudflared/config.yml
```

**Cloudflare Tunnel Config:**
```yaml
tunnel: YOUR_TUNNEL_ID_HERE
credentials-file: /home/ubuntu/.cloudflared/YOUR_TUNNEL_ID_HERE.json

ingress:
  # Route your domain to local app
  - hostname: yourdomain.com
    service: http://localhost:3000

  # Catch-all rule (required)
  - service: http_status:404
```

#### **Step 4: Start Everything**
```bash
# Start app
cd ~/bioquest
docker-compose up -d

# Start Cloudflare tunnel
cloudflared tunnel run bioquest &

# Check logs
docker-compose logs -f
```

#### **Step 5: Run as Service**
```bash
# Create systemd service for Cloudflare tunnel
sudo nano /etc/systemd/system/cloudflared.service

# Add:
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
User=ubuntu
ExecStart=/usr/bin/cloudflared tunnel run bioquest
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target

# Enable and start
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
sudo systemctl status cloudflared
```

#### **Step 6: Auto-start Docker on Boot**
```bash
# Create systemd service for app
sudo nano /etc/systemd/system/bioquest.service

# Add:
[Unit]
Description=BioQuest App
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ubuntu/bioquest
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
User=ubuntu
Group=docker

[Install]
WantedBy=multi-user.target

# Enable
sudo systemctl enable bioquest
```

#### **Step 7: Monitoring & Updates**
```bash
# Check app status
docker-compose ps

# Check tunnel status
sudo systemctl status cloudflared

# View logs
docker-compose logs -f

# Update app
cd ~/bioquest
git pull
docker-compose down
docker-compose up -d --build
```

**Monthly Cost:** ~$2 electricity (no cloud bills)

---

### **Setup 4A: Cloudflare Pages + D1 (RECOMMENDED)**

#### **Step 1: Create D1 Database**
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

#### **Step 2: Schema Already Uses SQLite**
```prisma
// prisma/schema.prisma (already configured for SQLite!)
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// BioQuest is SQLite-native, no changes needed
```

#### **Step 3: Generate and Run Migrations**
```bash
# Generate migration SQL
npx prisma migrate dev --name init

# Upload schema to D1
wrangler d1 execute bioquest --file=./prisma/migrations/XXXXXX_init/migration.sql

# Or run Prisma commands directly
wrangler d1 execute bioquest --command="$(cat prisma/migrations/*/migration.sql)"
```

#### **Step 4: Setup Cloudflare Pages**
```bash
# Go to https://dash.cloudflare.com
# Pages → Create a project
# Connect to Git (GitHub/GitLab)
# Select bioquest repository

# Build settings:
Framework preset: Next.js
Build command: npm run build
Build output directory: .next

# Environment variables:
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=https://your-project.pages.dev
INATURALIST_CLIENT_ID=your_id
INATURALIST_CLIENT_SECRET=your_secret
NEXT_PUBLIC_APP_URL=https://your-project.pages.dev
NEXT_PUBLIC_APP_NAME=BioQuest
```

#### **Step 5: Bind D1 to Pages**
```bash
# In Cloudflare Dashboard:
# Pages → Your Project → Settings → Functions
# D1 database bindings → Add binding
# Variable name: DB
# D1 database: bioquest
```

#### **Step 6: Deploy**
```bash
# Push to main branch
git push origin main

# Cloudflare auto-builds and deploys
# Access at: your-project.pages.dev
```

#### **Step 7: Seed Database (Optional)**
```bash
# Run seed script against D1
wrangler d1 execute bioquest --command="$(node scripts/generate-seed-sql.js)"

# Or manually insert initial data
wrangler d1 execute bioquest --command="INSERT INTO Badge (code, name, ...) VALUES (...);"
```

#### **Step 8: Custom Domain (Optional)**
```bash
# In Cloudflare Pages → Custom domains
# Add your domain
# Cloudflare handles DNS automatically (if domain on Cloudflare)
```

**Monthly Cost:** $0 (truly free)

**D1 Free Tier Limits:**
- ✅ 10 GB storage
- ✅ 5 million reads/day
- ✅ 100,000 writes/day
- (More than enough for most apps!)

---

### **Setup 4B: Cloudflare Pages + Neon (Alternative)**

Use this if you specifically need PostgreSQL instead of SQLite.

#### **Step 1: Setup Neon Database**
```bash
# Go to https://neon.tech
# Sign up (free)
# Create project: "bioquest"
# Create database: "bioquest"
# Copy connection string
# Save as: postgresql://user:pass@host/bioquest?sslmode=require
```

#### **Step 2: Setup Cloudflare Pages**
```bash
# Go to https://dash.cloudflare.com
# Pages → Create a project
# Connect to Git (GitHub/GitLab)
# Select bioquest repository

# Build settings:
Framework preset: Next.js
Build command: npm run build
Build output directory: .next

# Environment variables:
DATABASE_URL=your_neon_connection_string
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=https://your-project.pages.dev
INATURALIST_CLIENT_ID=your_id
INATURALIST_CLIENT_SECRET=your_secret
NEXT_PUBLIC_APP_URL=https://your-project.pages.dev
NEXT_PUBLIC_APP_NAME=BioQuest
```

#### **Step 3: Deploy**
```bash
# Push to main branch
git push origin main

# Watch build in Cloudflare dashboard
# Once deployed, access at: your-project.pages.dev
```

#### **Step 4: Run Migrations**
```bash
# From your local machine:
DATABASE_URL="your_neon_connection_string" npx prisma migrate deploy
DATABASE_URL="your_neon_connection_string" npm run db:seed
```

#### **Step 5: Custom Domain (Optional)**
```bash
# In Cloudflare Pages → Custom domains
# Add your domain
# Cloudflare handles DNS automatically (if domain on Cloudflare)
```

**Monthly Cost:** $0 (truly free)

**Neon Free Tier Limits:**
- ⚠️ Only 0.5 GB storage (vs D1's 10 GB)
- ⚠️ Auto-suspend after 5 min inactivity
- ⚠️ Slower cold starts
- (Use D1 unless you specifically need PostgreSQL features)

---

### **Setup 5: Railway (with Spending Limits)**

#### **Step 1: Sign Up and Set Limits**
```bash
# Go to https://railway.app
# Sign up with GitHub
# Go to Settings → Usage
# Set spending limit: $10/month (or whatever you're comfortable with)
```

#### **Step 2: Create New Project**
```bash
# Dashboard → New Project
# "Deploy from GitHub repo"
# Select bioquest repository
```

#### **Step 3: Add Database**
```bash
# In Railway project:
# Click "New" → "Database" → "PostgreSQL"
# Railway auto-creates database
# Connection string automatically available as DATABASE_URL
```

#### **Step 4: Set Environment Variables**
```bash
# In Railway → Your app → Variables
# Add:
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=${{RAILWAY_PUBLIC_DOMAIN}} (Railway provides this)
INATURALIST_CLIENT_ID=your_id
INATURALIST_CLIENT_SECRET=your_secret
NEXT_PUBLIC_APP_URL=${{RAILWAY_PUBLIC_DOMAIN}}
NEXT_PUBLIC_APP_NAME=BioQuest
```

#### **Step 5: Deploy**
```bash
# Railway auto-deploys
# Watch logs in dashboard

# Once deployed, open shell in Railway dashboard:
# Run migrations:
npx prisma migrate deploy
npm run db:seed
```

#### **Step 6: Custom Domain (Optional)**
```bash
# In Railway → Settings → Networking
# Add custom domain
# Update DNS records as shown
```

**Monthly Cost:** $5-15 (with $10 hard limit set)

---

## 📊 Feature Comparison

| Feature | Hetzner | Sherpa.sh | Raspberry Pi | Cloudflare | Railway |
|---------|---------|-----------|--------------|------------|---------|
| **Fixed Cost** | ✅ €4.15 | ✅ $0-29 | ✅ ~$2 | ✅ $0 | ⚠️ Variable |
| **Surprise Bills** | ❌ Impossible | ❌ Impossible | ❌ Impossible | ❌ Impossible | ⚠️ Possible (set limits) |
| **Setup Difficulty** | ⭐⭐⭐ | ⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐ |
| **Auto HTTPS** | ✅ Caddy | ✅ Included | ✅ Cloudflare | ✅ Included | ✅ Included |
| **Database** | Self-hosted | ✅ Included | Self-hosted | Neon Free | ✅ Included |
| **Scaling** | Manual upgrade | Easy | Hardware limit | Limited free | Easy |
| **Backups** | DIY | ✅ Included | DIY | Manual | ✅ Included |
| **Monitoring** | DIY | ✅ Included | DIY | Limited | ✅ Included |
| **Support** | Docs only | Email | Community | Docs | Community |
| **Vendor Lock-in** | None | Low (Docker) | None | Medium | Low |

---

## 🎯 Final Recommendation for BioQuest

### **Best Choice: Hetzner VPS**

**Why:**
1. ✅ **Fixed €4.15/month** - zero surprise bill risk
2. ✅ **Professional hosting** - not a toy
3. ✅ **20TB bandwidth** - more than enough
4. ✅ **Full control** - you own everything
5. ✅ **EU-based** - great for privacy
6. ✅ **Easy to scale** - upgrade anytime

**Second Choice: Sherpa.sh Pro ($29/month)**
- If you value simplicity over cost
- Don't want to manage servers
- Want built-in backups and monitoring

**Third Choice: Raspberry Pi**
- If you want to learn
- Have stable internet
- Want zero ongoing costs
- Don't need 24/7 uptime

**For Free Forever: Cloudflare Pages + D1**
- MVP validation AND production-ready
- Can't spend any money (hard limits)
- Actually room to grow (10 GB storage, 5M reads/day)
- Ultra-fast (same network as your app)
- (Or use Neon if you need PostgreSQL specifically)

---

## 📊 Cloudflare D1 vs Neon Comparison

When using Cloudflare Pages, you have two database options. Here's the honest comparison:

| Feature | Cloudflare D1 ⭐ | Neon PostgreSQL |
|---------|------------------|-----------------|
| **Free Storage** | 10 GB | 0.5 GB (20x less!) |
| **Free Reads** | 5 million/day | Unlimited |
| **Free Writes** | 100,000/day | Unlimited |
| **Database Type** | SQLite | PostgreSQL |
| **Network** | Same as Pages (ultra-fast) | Separate (added latency) |
| **Cold Starts** | Instant | Slow (auto-suspend) |
| **Hard Limits** | ✅ Yes | ✅ Yes |
| **Complexity** | Low | Medium |
| **Best For** | Most apps | Apps needing PostgreSQL features |

### **When to use D1:**
- ✅ You want 20x more storage (10 GB vs 0.5 GB)
- ✅ You want instant response times (same network)
- ✅ You don't need advanced PostgreSQL features
- ✅ SQLite is fine (Prisma handles both equally well)
- ✅ You want the simplest setup

### **When to use Neon:**
- You specifically need PostgreSQL extensions
- You're already familiar with PostgreSQL
- You need specific PostgreSQL data types
- You're okay with 0.5 GB limit and slow cold starts

**For BioQuest:** D1 is the clear winner. The app works perfectly with SQLite via Prisma, and you get 20x more storage with better performance.

---

## 🚨 What NOT to Do

### ❌ Don't use Vercel for production
- DDoS attack risk is real
- Bandwidth overages can be massive
- Hard to set true limits
- Horror stories on X/Twitter are not exaggerated

### ❌ Don't use AWS/GCP/Azure without DevOps team
- Complex billing
- Easy to misconfigure
- Surprise bills common
- Only for enterprises

### ❌ Don't use any platform without hard limits
- "Pay per use" = unpredictable bills
- Always set spending limits
- Test with low limits first

---

## 📝 Checklist Before Going Live

### Security:
- [ ] Change all default passwords
- [ ] Enable firewall (UFW or equivalent)
- [ ] Disable SSH password auth (use keys only)
- [ ] Setup fail2ban or similar
- [ ] Enable automatic security updates
- [ ] Setup HTTPS (Caddy/Cloudflare/Let's Encrypt)
- [ ] Set security headers
- [ ] Regular backups configured

### Monitoring:
- [ ] Setup health checks
- [ ] Configure log rotation
- [ ] Monitor disk space
- [ ] Monitor memory usage
- [ ] Setup uptime monitoring (UptimeRobot free tier)
- [ ] Test backup restoration

### Performance:
- [ ] Enable compression (gzip/brotli)
- [ ] Database indexes created
- [ ] Connection pooling configured
- [ ] Cache headers set

### Cost Control:
- [ ] Spending limits set (if platform supports)
- [ ] Usage alerts configured
- [ ] Backup costs calculated
- [ ] Scaling costs understood

---

## 💡 Pro Tips

### For Hetzner:
- Use snapshots for testing (€0.012/GB/month)
- Enable backups (€0.83/month) - worth it
- Use Cloud Firewall (free) instead of UFW
- Check Hetzner Status page for maintenance

### For Sherpa.sh:
- Start with free tier for testing
- Upgrade to Pro only when needed
- Use built-in monitoring
- Docker-based = easy to migrate later

### For Raspberry Pi:
- Get a UPS for power protection ($40)
- Use SSD instead of SD card for better performance
- Monitor temperature
- Keep it physically secure

### For All Platforms:
- Test disaster recovery before you need it
- Document your setup
- Keep secrets in environment variables
- Use git tags for production releases
- Monitor error rates daily

---

## 🆘 Support Resources

### Hetzner:
- Docs: https://docs.hetzner.com
- Community: https://community.hetzner.com
- Status: https://status.hetzner.com

### Sherpa.sh:
- Docs: https://docs.sherpa.sh
- Discord: (check their website)
- Email: support@sherpa.sh

### Raspberry Pi:
- Forums: https://forums.raspberrypi.com
- Docs: https://www.raspberrypi.com/documentation

### Cloudflare:
- Docs: https://developers.cloudflare.com
- Community: https://community.cloudflare.com
- Status: https://www.cloudflarestatus.com

### Railway:
- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway
- Status: https://status.railway.app

---

## 📅 Maintenance Schedule

### Daily:
- Check error logs
- Monitor disk space
- Verify app is responding

### Weekly:
- Review access logs
- Check for security updates
- Test backup restoration
- Review costs/usage

### Monthly:
- Update dependencies
- Security audit
- Performance review
- Cost optimization

---

**Last Updated:** 2025-10-22
**Maintained by:** BioQuest Team
**Questions?** Open an issue on GitHub
