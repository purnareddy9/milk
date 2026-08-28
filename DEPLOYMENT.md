# 🚀 Amrit Pure Dairy Platform — Production Deployment Guide

This guide provides step-by-step instructions to deploy the entire fullstack platform (**Angular Frontend**, **NestJS Backend**, and **Free Supabase PostgreSQL Database**) into production at **$0 cost** using modern cloud free tiers, or on a single low-cost cloud VPS.

---

## 📑 Deployment Architecture Overview

```
+----------------------------------------------------------------------------------------------------+
|                                    PRODUCTION ARCHITECTURE ($0 COST)                               |
+------------------------------------+-----------------------------------+---------------------------+
| 🌐 Frontend (Angular 17 SPA)       | ⚙️ Backend (NestJS Monolith)       | 🗄️ Database (Supabase)    |
| • Hosted on: Vercel / Netlify /    | • Hosted on: Render / Railway /   | • Hosted on: Supabase     |
|   Cloudflare Pages (Free Tier)     |   Fly.io (Free Tier)              |   (Free Forever Tier)     |
| • Global CDN & Edge Caching        | • REST APIs & WebSocket Channels  | • 500 MB PostgreSQL 16    |
| • Automatic SSL/HTTPS              | • Swagger Documentation           | • Built-in Supavisor Pool |
+------------------------------------+-----------------------------------+---------------------------+
```

---

## 🗄️ Step 1: Set Up Free PostgreSQL Database on Supabase

Supabase provides a **100% Free Forever Tier** with 500 MB storage, connection pooling, automated backups, and zero server management.

### 1. Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and click **Start your project** (Sign up with GitHub or Google).
2. Click **New Project** and configure:
   - **Organization**: Your default organization.
   - **Name**: `amrit-pure-dairy`
   - **Database Password**: Choose a strong password (e.g., `AmritDairyProd#2026!`) and **save it safely**.
   - **Region**: Choose the region closest to your customers (e.g. `ap-south-1 (Mumbai, India)`).
   - **Pricing Plan**: `Free Tier ($0/month)`.
3. Click **Create new project** and wait ~1 minute for provisioning.

### 2. Retrieve Connection Strings
In your Supabase project dashboard:
1. Navigate to **Project Settings (Gear Icon)** → **Database**.
2. Scroll to the **Connection string** section and select the **URI** tab.
3. You will need two connection URLs:

#### A. Pooled Connection URL (`DATABASE_URL`) — For API Traffic
- Under **Connection pooling**, select **Mode: Transaction** (Port `6543`).
- Copy the URI and replace `[YOUR-PASSWORD]` with your database password:
  ```env
  DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
  ```

#### B. Direct Connection URL (`DIRECT_URL`) — For Prisma Migrations
- Under **Direct connection**, select **Session Mode** (Port `5432`).
- Copy the URI and replace `[YOUR-PASSWORD]`:
  ```env
  DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
  ```

### 3. Push Database Schema and Seed Data to Supabase
From your local terminal, apply all 18 tables and seed data directly to Supabase:

```powershell
cd backend

# 1. Generate Prisma Client
npx prisma generate

# 2. Push Schema to Supabase (creates all 18 PostgreSQL tables & indexes)
$env:DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
$env:DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
npx prisma db push

# 3. Seed Database with Dairy Catalog, Test Personas & Subscriptions
npm run prisma:seed
```
*Your Supabase database now contains all products, categories, active subscriptions, orders, and test users!*

---

## ⚙️ Step 2: Deploy Backend to Render (Free Tier)

[Render.com](https://render.com) offers a free web service tier ideal for hosting NestJS APIs.

1. Go to [https://render.com](https://render.com) and create a free account.
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository (`amrit-pure-dairy`).
4. Fill in the service details:
   - **Name**: `amrit-dairy-api`
   - **Region**: `Singapore` or `Frankfurt`
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `node dist/src/main`
   - **Instance Type**: `Free`
5. Under **Environment Variables**, add:
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Production mode |
   | `PORT` | `3000` | HTTP port |
   | `DATABASE_URL` | `postgresql://postgres.[REF]:[PASS]@...:6543/postgres?pgbouncer=true` | Supabase Pooled URL |
   | `DIRECT_URL` | `postgresql://postgres.[REF]:[PASS]@...:5432/postgres` | Supabase Direct URL |
   | `JWT_SECRET` | `super_secure_random_production_secret_key_2026` | Auth Token Signing |
   | `JWT_REFRESH_SECRET` | `super_secure_refresh_secret_key_2026` | Refresh Token Signing |
   | `RAZORPAY_KEY_ID` | `rzp_test_AmritDairy2026` | Razorpay Key ID |
   | `RAZORPAY_KEY_SECRET` | `your_razorpay_secret` | Razorpay Secret |
6. Click **Create Web Service**.
7. Once deployed, Render will provide a public URL like:
   `https://amrit-dairy-api.onrender.com`

---

## 🌐 Step 3: Deploy Frontend to Vercel (Free Tier)

[Vercel](https://vercel.com) provides lightning-fast global CDN edge hosting with free SSL for Angular applications.

1. Go to [https://vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New...** → **Project**.
3. Select your repository (`amrit-pure-dairy`).
4. Configure Project Settings:
   - **Framework Preset**: `Angular`
   - **Root Directory**: Click *Edit* and select `frontend`.
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/milk-delivery-frontend/browser`
5. Configure API URL Proxy (or update `api.service.ts` baseUrl with your Render backend URL `https://amrit-dairy-api.onrender.com/api`).
6. Click **Deploy**.
7. Vercel will build and deploy your live storefront in ~1 minute:
   `https://amrit-pure-dairy.vercel.app`

---

## 🐳 Step 4: Alternative — 1-Click Self-Hosted VPS (Docker Compose)

If you prefer to host everything on your own Linux VPS ($4–$5/month on DigitalOcean, Hetzner, Linode, or AWS Lightsail):

```bash
# 1. SSH into your VPS server
ssh root@your-server-ip

# 2. Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh

# 3. Clone repository
git clone https://github.com/your-username/amrit-pure-dairy.git
cd amrit-pure-dairy

# 4. Configure .env file
cp backend/.env.example backend/.env
nano backend/.env # Paste your Supabase or local postgres credentials

# 5. Start all containers in background
docker-compose up -d --build

# 6. Run database migrations and seed
docker exec -it milk_backend npx prisma db push
docker exec -it milk_backend npm run prisma:seed
```

Your app is now fully running on your server:
- **Frontend Storefront**: `http://your-server-ip:4200`
- **Backend API**: `http://your-server-ip:3000/api`

---

## 🔒 Step 5: Post-Deployment Production Checklist

- [ ] **SSL/HTTPS**: Enabled automatically on Vercel/Render, or use `certbot --nginx` on VPS.
- [ ] **CORS Configuration**: In `backend/src/main.ts`, ensure `origin` whitelist contains your frontend domain (`https://amrit-pure-dairy.vercel.app`).
- [ ] **Razorpay Live Keys**: Replace `rzp_test_...` with live Razorpay API keys from your Razorpay Dashboard.
- [ ] **Cron Job Schedule**: In your cloud provider or VPS crontab, configure a daily schedule at `22:00 (10:00 PM)` to run morning milk demand aggregation:
  ```bash
  0 22 * * * curl -X GET https://amrit-dairy-api.onrender.com/api/milk-requirement/daily -H "Authorization: Bearer <ADMIN_TOKEN>"
  ```
