# 🥛 Amrit Pure Dairy & Local Milk Delivery Platform

A modern, production-ready **Local Milk Delivery & Subscription E-Commerce Platform** engineered with a modular monolith backend and high-performance standalone Angular frontend.

---

## 🌟 Key Features

- **🛍️ Customer Storefront & High-Speed Checkout**:
  - Instant One-Time Purchase & Daily Recurring Milk Subscriptions
  - 3-Step Interactive Subscription Wizard with monthly savings estimation
  - 30-Day Visual Calendar with 1-click delivery skip and date-range vacation pauses
  - Milk Wallet with instant auto-debit payments & bonus credits
  - Multi-step live order tracking (`Pending` → `Confirmed` → `Preparing` → `Out for Delivery` → `Delivered`)
  - Address book management & discount promo coupons (`FRESH20`, `WELCOME50`, `DAIRY100`)

- **👑 Seller / Admin Operations Hub**:
  - **Daily Milk Requirement & Farm Procurement Engine (Section 16 & 38)**: Computes exact morning liters required across subscriptions + orders (500ml, 1L, 2L, 200g, 400g) and compares against chiller stock to compute surplus/deficit.
  - Farm batch procurement logger with Fat % and SNF % lab records
  - Orders status pipeline & delivery partner assignment
  - Subscriptions Master with MRR analytics and admin override controls
  - Inventory management with stock ledger & low-stock alerts
  - Product catalog CRUD, Customer 360 CRM & sales analytics

- **🛵 Delivery Partner Run-Sheet (`/delivery-partner`)**:
  - Mobile-first morning delivery run-sheet
  - Doorstep sequence, customer delivery notes, phone call shortcuts
  - 1-Tap "Mark Delivered" action with confetti celebrations

- **👥 Interactive Demo Persona Switcher**:
  - 1-Click switching between Customer (*Rahul Sharma*, *Priya Patel*), Seller (*Ramesh Patel*), and Driver (*Suresh Kumar*).

---

## 🏗️ Technology Stack

- **Frontend**: Angular 17+ Standalone Architecture, TypeScript, RxJS, Angular CDK, Signals, Custom SCSS/CSS Design System
- **Backend**: Node.js, NestJS (Modular Monolith), TypeScript, Prisma ORM, PostgreSQL 16, Redis (with resilient in-memory fallback), JWT Auth
- **Infrastructure**: Docker Compose (`docker-compose.yml`), Multi-stage Dockerfiles, GitHub Actions CI/CD pipeline

---

## 🚀 Getting Started

### Option 1: Quickstart with Docker Compose (Recommended)
```bash
docker-compose up --build
```
- **Storefront & Admin**: [http://localhost:4200](http://localhost:4200)
- **Backend API & Swagger**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

### Option 2: Local Development

#### 1. Backend Setup
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed
npm run start:dev
```
Backend API will be running on `http://localhost:3000/api`

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm start
```
### Option 3: Deploy to Render.com ($0 Free Tier)
Deploy the full platform in 1 click using the included [`render.yaml`](file:///c:/Users/Sri/Documents/Antigravity%20Projects/milk/render.yaml) Blueprint or manual steps:
- **Guide**: [`RENDER_DEPLOYMENT.md`](file:///c:/Users/Sri/Documents/Antigravity%20Projects/milk/RENDER_DEPLOYMENT.md)
- **Supabase Guide**: [`DEPLOYMENT.md`](file:///c:/Users/Sri/Documents/Antigravity%20Projects/milk/DEPLOYMENT.md)

---

## 🧪 Testing

### Backend Unit & Integration Tests
```bash
cd backend
npm test
```

### Frontend Build
```bash
cd frontend
npm run build
```

---

## 👥 Default Demo Personas

| Persona | Role | Default Email | Password |
| :--- | :--- | :--- | :--- |
| **Rahul Sharma** | `CUSTOMER` | `rahul.sharma@example.com` | `password123` |
| **Priya Patel** | `CUSTOMER` | `priya.patel@example.com` | `password123` |
| **Ramesh Patel** | `SELLER / ADMIN` | `admin@amritpuredairy.com` | `password123` |
| **Suresh Kumar** | `DELIVERY_PERSON` | `suresh.kumar@amritpuredairy.com` | `password123` |

---

## 📄 License
UNLICENSED - Production Local Milk Delivery Platform
