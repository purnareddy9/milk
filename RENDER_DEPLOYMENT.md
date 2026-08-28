# 🚀 Deploying Amrit Pure Dairy on Render.com (100% Free Tier Guide)

This guide provides the complete walkthrough to deploy both the **NestJS Backend API** and **Angular Frontend** onto **Render.com** linked with your free **Supabase PostgreSQL** database at **$0 / month**.

---

## 🏗️ Architecture on Render

```
+----------------------------------------------------------------------------------------------------+
|                                    RENDER.COM FREE TIER HOSTING                                    |
+-------------------------------------------------+--------------------------------------------------+
| 🌐 Frontend: `amrit-dairy-frontend`             | ⚙️ Backend: `amrit-dairy-backend`                 |
| • Type: Render Static Site (Free Forever)       | • Type: Render Web Service (Free Tier)           |
| • Global CDN Edge Hosting                       | • Runtime: Node.js 20                            |
| • Automatic SSL & SPA Rewrite (`/*` -> `/index`) | • Connected to: Supabase PostgreSQL              |
+-------------------------------------------------+--------------------------------------------------+
```

---

## 📋 Prerequisites
1. **GitHub Repository**: Your code pushed to GitHub (e.g. `https://github.com/your-username/amrit-pure-dairy`).
2. **Supabase Database**: A free project created at [https://supabase.com](https://supabase.com) (see Section 1 below).
3. **Render Account**: A free account at [https://render.com](https://render.com).

---

## 🗄️ Step 1: Get Supabase Free Database Connection Strings

1. Go to [https://supabase.com](https://supabase.com) → Your Project (`amrit-pure-dairy`).
2. Open **Project Settings (⚙️ icon)** → **Database**.
3. Under **Connection string** (URI tab), note down:

| Variable | Mode & Port | Example Format |
| :--- | :--- | :--- |
| **`DATABASE_URL`** | **Transaction Mode** (Port `6543`) | `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true` |
| **`DIRECT_URL`** | **Session Mode** (Port `5432`) | `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres` |

---

## ⚙️ Step 2: Deploy Backend API on Render

### 1. Create Web Service
1. In your Render Dashboard, click **New +** → **Web Service**.
2. Connect your GitHub repository: `amrit-pure-dairy`.
3. Configure the following settings:

| Setting Field | Value to Enter | Notes |
| :--- | :--- | :--- |
| **Name** | `amrit-dairy-backend` | Will give URL `https://amrit-dairy-backend.onrender.com` |
| **Region** | `Singapore` (or nearest to your users) | Fast latency for Asia/India |
| **Branch** | `main` | Production branch |
| **Root Directory** | `backend` | **Important: Specify `backend`** |
| **Runtime** | `Node` | Node.js environment |
| **Build Command** | `npm install && npx prisma generate && npm run build` | Installs deps, builds Prisma client & NestJS |
| **Start Command** | `node dist/src/main` | Runs production server |
| **Instance Type** | `Free` | $0/month (750 free hours) |

---

### 2. Configure Backend Environment Variables
Under the **Environment Variables** section on Render, add the following key-value pairs:

```env
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
JWT_SECRET=amrit_pure_dairy_jwt_super_secret_production_key_2026
JWT_REFRESH_SECRET=amrit_pure_dairy_refresh_super_secret_production_key_2026
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
RAZORPAY_KEY_ID=rzp_test_AmritDairy2026
RAZORPAY_KEY_SECRET=mock_razorpay_secret_key
RAZORPAY_WEBHOOK_SECRET=mock_razorpay_webhook_secret
```

---

### 3. Deploy & Run Database Seed
1. Click **Create Web Service**. Render will start the build.
2. Once the build completes and says **"Your service is live 🎉"**, open the Render **Shell** tab (or run locally with your Supabase URL):
   ```bash
   npx prisma db push
   npm run prisma:seed
   ```
3. Test your backend in your browser:
   `https://amrit-dairy-backend.onrender.com/api/categories` → returns status 200 with dairy categories!
   `https://amrit-dairy-backend.onrender.com/api/docs` → opens Swagger API documentation!

---

## 🌐 Step 3: Deploy Frontend on Render (Static Site)

### 1. Create Static Site
1. In Render Dashboard, click **New +** → **Static Site**.
2. Select your GitHub repository: `amrit-pure-dairy`.
3. Configure the following settings:

| Setting Field | Value to Enter | Notes |
| :--- | :--- | :--- |
| **Name** | `amrit-dairy-frontend` | Will give URL `https://amrit-dairy-frontend.onrender.com` |
| **Branch** | `main` | Production branch |
| **Root Directory** | `frontend` | **Important: Specify `frontend`** |
| **Build Command** | `npm install && npm run build` | Compiles Angular 17 SPA |
| **Publish Directory** | `dist/milk-delivery-frontend/browser` | **Important: Angular 17 browser output** |

---

### 2. Configure Angular Single-Page App (SPA) Rewrites
In Render Dashboard for your static site:
1. Navigate to **Redirects / Rewrites** tab.
2. Click **Add Rule**:
   - **Type**: `Rewrite`
   - **Source**: `/*`
   - **Destination**: `/index.html`
3. Click **Save Changes**. *(This guarantees that direct URLs like `/subscriptions`, `/seller/dashboard`, `/profile` load cleanly on page refresh without 404s).*

---

### 3. Connect Frontend to Backend API
In the **Environment Variables** tab for `amrit-dairy-frontend`, add:
```env
AMRIT_API_URL=https://amrit-dairy-backend.onrender.com/api
```
Click **Save & Deploy**.

---

## ⚡ Option 2: 1-Click Render Blueprint (`render.yaml`)

We have pre-configured a [`render.yaml`](file:///c:/Users/Sri/Documents/Antigravity%20Projects/milk/render.yaml) blueprint in the repository.

1. Go to [https://dashboard.render.com/blueprints](https://dashboard.render.com/blueprints).
2. Click **New Blueprint Instance**.
3. Select your repository. Render will automatically detect `render.yaml` and set up both the backend web service and the frontend static site with all build commands, start commands, rewrite rules, and security headers.
4. Input your `DATABASE_URL` and `DIRECT_URL` when prompted and click **Apply**!

---

## 🧪 Post-Deployment Verification

| Check | URL | Expected Result |
| :--- | :--- | :--- |
| **Frontend Storefront** | `https://amrit-dairy-frontend.onrender.com` | Full milk catalog, subscription wizard, cart drawer |
| **Seller Admin Hub** | `https://amrit-dairy-frontend.onrender.com/seller/dashboard` | KPI analytics, Section 16 daily milk demand |
| **Delivery Partner Sheet** | `https://amrit-dairy-frontend.onrender.com/delivery-partner` | Mobile doorstep run-sheet |
| **Backend Swagger Docs** | `https://amrit-dairy-backend.onrender.com/api/docs` | Interactive OpenAPI sandbox |
