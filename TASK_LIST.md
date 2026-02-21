# ✅ TCLMarket2 — Master Task List (Supabase Edition)
> ทำตาม Phase ทีละขั้น อย่าข้ามครับ!
> Database: Supabase (PostgreSQL + Auth + Realtime) | อัปเดต: 20 Feb 2026

---

## 📦 Phase 0 — Project Setup (เตรียมโปรเจกต์)

### 0.1 Supabase Setup *(ทำก่อนสุด!)*
- [ ] สมัครที่ [supabase.com](https://supabase.com) (ฟรี ใช้ Google/GitHub)
- [ ] กด **"New Project"**
- [ ] ตั้งชื่อ Project: `tclmarket2`
- [ ] ตั้ง Database Password (จดเก็บไว้)
- [ ] เลือก Region: **Southeast Asia (Singapore)**
- [ ] รอสัก 2 นาที → Project พร้อมใช้
- [ ] ไปที่ **Settings → API** → คัดลอก:
  - `Project URL` → `SUPABASE_URL`
  - `anon public key` → `SUPABASE_ANON_KEY`
  - `service_role key` → `SUPABASE_SERVICE_KEY` (Backend ใช้)

### 0.2 Database: สร้าง Tables (SQL Editor)
- [ ] เปิด **SQL Editor** ใน Supabase Dashboard
- [ ] รัน SQL สร้าง `users` table
- [ ] รัน SQL สร้าง `markets` table
- [ ] รัน SQL สร้าง `bets` table
- [ ] รัน SQL สร้าง `transactions` table
- [ ] ตรวจสอบ Tables ปรากฏใน **Table Editor**

### 0.3 Database: Row Level Security (RLS)
- [ ] เปิด RLS ให้ทุก Table ใน Authentication → Policies
- [ ] สร้าง Policy: ผู้ใช้ดู/แก้ไขได้เฉพาะข้อมูลตัวเอง
- [ ] สร้าง Policy: Admin เข้าถึงได้ทุกอย่าง
- [ ] สร้าง Policy: Market อ่านได้ทุกคน (Public)

### 0.4 Database: RPC Functions
- [ ] สร้าง Function `place_bet(...)` — Atomic Bet + Balance deduct
- [ ] สร้าง Function `resolve_market(...)` — แจก Winnings
- [ ] สร้าง Function `cancel_market(...)` — Refund ทั้งหมด
- [ ] ทดสอบ Functions ใน SQL Editor

### 0.5 Database: เปิด Realtime
- [ ] ไปที่ **Database → Replication**
- [ ] เปิด Realtime ให้ Table `markets`
- [ ] เปิด Realtime ให้ Table `users`

### 0.6 โครงสร้างโฟลเดอร์
- [ ] สร้างโฟลเดอร์ `backend/` และ `frontend/` ใน `TCLMarket2/`
- [ ] สร้างโฟลเดอร์ `supabase/migrations/` เก็บ SQL files
- [ ] สร้าง `README.md`
- [ ] สร้าง `.gitignore` (node_modules, .env)
- [ ] `git init` → commit แรก: "Initial project setup"

### 0.7 Backend Init
- [ ] `cd backend` → `npm init -y`
- [ ] ติดตั้ง packages:
  ```
  npm install express @supabase/supabase-js dotenv cors express-validator
  npm install -D nodemon
  ```
- [ ] สร้างไฟล์ `backend/.env`:
  ```
  PORT=5000
  SUPABASE_URL=https://xxxx.supabase.co
  SUPABASE_SERVICE_KEY=service_role_key_here
  CLIENT_URL=http://localhost:5173
  ```
- [ ] สร้างโครงสร้างโฟลเดอร์:
  ```
  backend/src/
  ├── routes/
  ├── controllers/
  ├── middleware/
  ├── services/
  └── supabaseClient.js
  ```
- [ ] สร้าง `backend/app.js` ทดสอบ Express รันได้

### 0.8 Frontend Init
- [ ] `cd frontend` → `npm create vite@latest . -- --template react`
- [ ] ติดตั้ง packages:
  ```
  npm install @supabase/supabase-js react-router-dom axios
  ```
- [ ] สร้างไฟล์ `frontend/.env`:
  ```
  VITE_SUPABASE_URL=https://xxxx.supabase.co
  VITE_SUPABASE_ANON_KEY=anon_key_here
  VITE_API_URL=http://localhost:5000
  ```
- [ ] ลบไฟล์ template ที่ไม่ใช้
- [ ] สร้างโครงสร้างโฟลเดอร์:
  ```
  frontend/src/
  ├── components/
  ├── pages/
  ├── context/
  ├── hooks/
  ├── services/
  └── supabaseClient.js
  ```
- [ ] สร้าง `supabaseClient.js` ทั้ง Frontend และ Backend

---

## 🔐 Phase 1 — Authentication (Supabase Auth)

> ✅ Supabase จัดการ JWT, Hashing, Session ให้ทั้งหมด!

### 1.1 Backend Auth Middleware
- [ ] สร้าง `backend/src/middleware/auth.js`
  - [ ] ดึง Token จาก `Authorization: Bearer <token>` header
  - [ ] เรียก `supabase.auth.getUser(token)` ตรวจสอบ
  - [ ] ดึง role จาก `public.users` table
  - [ ] Middleware: `requireAuth` — ตรวจ Login
  - [ ] Middleware: `requireAdmin` — ตรวจ role = admin

### 1.2 Frontend Auth Context
- [ ] สร้าง `frontend/src/context/AuthContext.jsx`
  - [ ] State: `user`, `session`, `loading`
  - [ ] Function: `signUp(email, password, username)`
    - สมัครด้วย `supabase.auth.signUp()`
    - INSERT ข้อมูลลง `public.users` (username, balance=1000)
  - [ ] Function: `signIn(email, password)`
  - [ ] Function: `signOut()`
  - [ ] `onAuthStateChange` listener คอย Track Session
  - [ ] Wrap `App` ด้วย `<AuthContext.Provider>`

### 1.3 Protected Routes
- [ ] สร้าง `ProtectedRoute` component → redirect `/login` ถ้าไม่ได้ login
- [ ] สร้าง `AdminRoute` component → redirect `/` ถ้าไม่ใช่ admin

### 1.4 หน้า Login (`/login`)
- [ ] Form: email + password
- [ ] เรียก `signIn()` → redirect Dashboard
- [ ] แสดง Error message ถ้า Login ไม่สำเร็จ
- [ ] Link ไปหน้า Register

### 1.5 หน้า Register (`/register`)
- [ ] Form: username + email + password
- [ ] เรียก `signUp()` → auto login → redirect Dashboard
- [ ] Validate: username ไม่ซ้ำ, password min 6 ตัว

### 1.6 ทดสอบ Auth
- [ ] Register ผู้ใช้ใหม่ → ดู User ใน Supabase Dashboard
- [ ] Login → ได้ Session
- [ ] Logout → Session หาย
- [ ] Protected Route ทำงานถูกต้อง

---

## 🏪 Phase 2 — Markets API

### 2.1 Backend: Market Controller
- [ ] สร้าง `backend/src/controllers/market.controller.js`
- [ ] **GET /** — ดึง Markets ทั้งหมด + คำนวณ priceYes/priceNo
  ```javascript
  // ดึงจาก Supabase
  const { data } = await supabase.from('markets').select('*')
  // คำนวณ Odds
  markets.map(m => ({
    ...m,
    priceYes: m.total_yes / m.total_pool || 0.5,
    priceNo:  m.total_no  / m.total_pool || 0.5
  }))
  ```
- [ ] **GET /:id** — ดึง Market เดียว + Bets count
- [ ] **POST /** (Admin) — สร้าง Market ใหม่ status='open'
- [ ] **PATCH /:id/close** (Admin) — เปลี่ยน status → 'closed'
- [ ] **PATCH /:id/resolve** (Admin) — เรียก `resolveService`
- [ ] **PATCH /:id/cancel** (Admin) — เรียก `cancelService`

### 2.2 Backend: Market Routes
- [ ] สร้าง `backend/src/routes/market.routes.js`
- [ ] ใส่ middleware: requireAuth, requireAdmin ให้ถูก Route

### 2.3 Backend: Odds Service
- [ ] สร้าง `backend/src/services/oddsService.js`
  - [ ] `calculateOdds(market)` → `{ priceYes, priceNo }`
  - [ ] `calculatePayout(stake, priceAtBet)` → `payout`

### 2.4 ทดสอบ Markets API
- [ ] GET /api/markets → ได้ list + odds
- [ ] POST /api/markets (Admin token) → สร้าง Market
- [ ] GET /api/markets/:id → ได้ detail

---

## 💰 Phase 3 — Bet Placement (Core Logic)

### 3.1 Supabase: RPC Function `place_bet`
- [ ] เขียน SQL Function `place_bet` ใน Supabase SQL Editor
  - [ ] Parameter: user_id, market_id, side, stake
  - [ ] ตรวจ market.status = 'open' (พร้อม Row Lock)
  - [ ] ตรวจ user.balance >= stake (พร้อม Row Lock)
  - [ ] คำนวณ price_at_bet, potential_payout
  - [ ] INSERT bets
  - [ ] UPDATE users.balance (atomic)
  - [ ] UPDATE markets totals (atomic)
  - [ ] INSERT transactions
  - [ ] RETURN JSON result
- [ ] ทดสอบ Function ใน SQL Editor ก่อน

### 3.2 Backend: Bet Controller
- [ ] สร้าง `backend/src/controllers/bet.controller.js`
- [ ] **POST /** — รับ marketId, side, stake
  - [ ] Validate input
  - [ ] เรียก `supabase.rpc('place_bet', {...})`
  - [ ] จัดการ Error (MARKET_NOT_OPEN, INSUFFICIENT_BALANCE)
  - [ ] Return ผลลัพธ์

- [ ] **GET /my** — ดู Bets ของตัวเอง + Market info
- [ ] **GET /market/:id** (Admin) — ดู Bets ทั้งหมดใน Market

### 3.3 Backend: Bet Routes
- [ ] สร้าง `backend/src/routes/bet.routes.js`

### 3.4 ทดสอบ Bet Placement
- [ ] POST /api/bets → Bet สำเร็จ, Balance ลด
- [ ] POST /api/bets insufficient balance → Error
- [ ] ดู Supabase Dashboard ข้อมูลถูกต้อง

---

## 🏆 Phase 4 — Resolve & Cancel Service

### 4.1 Supabase: RPC Function `resolve_market`
- [ ] เขียน SQL Function ใน SQL Editor
  - [ ] Parameter: market_id, result ('yes'/'no')
  - [ ] UPDATE market: status='resolved', result=result
  - [ ] หา Bets ทั้งหมดใน Market
  - [ ] Winners: UPDATE bets status='won', actual_payout
  - [ ] Winners: UPDATE users.balance += actual_payout (atomic)
  - [ ] Winners: INSERT transactions (type='win')
  - [ ] Losers: UPDATE bets status='lost'
- [ ] ทดสอบใน SQL Editor

### 4.2 Supabase: RPC Function `cancel_market`
- [ ] เขียน SQL Function ใน SQL Editor
  - [ ] Parameter: market_id
  - [ ] UPDATE market: status='cancelled'
  - [ ] ทุก Bet: UPDATE status='refunded'
  - [ ] ทุก User: UPDATE balance += stake (คืนเงิน)
  - [ ] ทุก User: INSERT transactions (type='refund')
- [ ] ทดสอบใน SQL Editor

### 4.3 Backend: Resolve & Cancel Controllers
- [ ] อัปเดต `market.controller.js` ให้เรียก RPC Functions
- [ ] จัดการ Error cases

### 4.4 ทดสอบ
- [ ] Admin Resolve → ผู้ชนะได้เงิน, ผู้แพ้ไม่ได้
- [ ] Admin Cancel → ทุกคนได้ refund เท่ากับ stake

---

## ⚡ Phase 5 — Real-time (Supabase Realtime)

### 5.1 Frontend: useRealtime Hook
- [ ] สร้าง `frontend/src/hooks/useRealtime.js`
  ```javascript
  // Subscribe การเปลี่ยนแปลง Market
  supabase.channel('market-<id>')
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'markets',
      filter: `id=eq.${marketId}`
    }, handleOddsUpdate)
    .subscribe()
  ```
- [ ] Cleanup subscription เมื่อ component unmount

### 5.2 Frontend: User Balance Realtime
- [ ] Subscribe `users` table Update สำหรับ current user
- [ ] อัปเดต Balance ใน Navbar แบบ Real-time

### 5.3 ทดสอบ Realtime
- [ ] เปิด 2 Browser วาง Bet → อีกหน้าเห็น Odds เปลี่ยน
- [ ] Admin Resolve → ทุก Browser เห็น Market Resolved

---

## 👤 Phase 6 — User Routes

- [ ] **GET /api/users/me** — Profile + Balance
- [ ] **GET /api/users/me/transactions** — Transaction History (paginated)
- [ ] **GET /api/users** (Admin) — ดู Users ทั้งหมด

---

## 🎨 Phase 7 — Frontend: Design System

- [ ] เลือก Color Palette (Dark theme แบบ Polymarket)
- [ ] สร้าง CSS Variables ใน `index.css`:
  ```css
  :root {
    --bg-main: #0f1117;
    --bg-card: #1e293b;
    --primary: #3b82f6;
    --success: #10b981;
    --danger:  #ef4444;
    --warning: #f59e0b;
    --text-primary: #e2e8f0;
    --text-muted:   #64748b;
  }
  ```
- [ ] สร้าง Global styles: Button, Input, Card, Badge, Chip
- [ ] **Navbar Component** — Logo, Balance, Nav links, Logout
- [ ] **Layout Component** — Navbar + main content
- [ ] ตรวจสอบ Responsive บน Mobile

---

## 📊 Phase 8 — Frontend: Dashboard (Market List)

- [ ] สร้าง `frontend/src/services/marketService.js`
  - [ ] `getMarkets(filters)` — ดึง Markets + คำนวณ Odds
  - [ ] `getMarketById(id)` — ดึง Market เดียว

- [ ] **Dashboard Page** (`/`)
  - [ ] ดึง Markets จาก API
  - [ ] Filter Tabs: All / Open / Closed / Resolved
  - [ ] Search Box: ค้นหาจากชื่อ

- [ ] **MarketCard Component**
  - [ ] ชื่อ Market, category, วันปิด
  - [ ] Odds Bar: Yes% vs No% (animated gradient)
  - [ ] Total Pool, Status Badge
  - [ ] คลิก → ไป Market Detail

---

## 📈 Phase 9 — Frontend: Market Detail + Bet

- [ ] **Market Detail Page** (`/market/:id`)
  - [ ] ดึง Market ข้อมูล
  - [ ] Subscribe Realtime (useRealtime hook)
  - [ ] แสดง Odds Bar แบบ animated
  - [ ] Total Pool, จำนวน Bets

- [ ] **BetForm Component**
  - [ ] Toggle: Yes 🟢 / No 🔴
  - [ ] Input: Stake amount
  - [ ] Preview Payout (คำนวณ real-time ใน frontend)
  - [ ] ปุ่ม "Place Bet" → POST /api/bets
  - [ ] ซ่อน Form ถ้า Market ไม่ใช่ 'open'

- [ ] **Market Result Banner**
  - [ ] แสดงเมื่อ status = 'resolved' หรือ 'cancelled'
  - [ ] บอกผลลัพธ์ + สถานะ Bet ของ User

- [ ] ทดสอบ: วาง Bet → Odds เปลี่ยน Real-time

---

## 📋 Phase 10 — Frontend: My Bets & Profile

- [ ] **My Bets Page** (`/my-bets`)
  - [ ] ดึง Bets จาก GET /api/bets/my
  - [ ] ตาราง: Market, Side, Stake, Payout, Status
  - [ ] Status Badge: pending / won / lost / refunded
  - [ ] Transaction History Tab

- [ ] **Profile Page** (`/profile`)
  - [ ] Username, Email, Balance
  - [ ] Stats: Bets ทั้งหมด, ชนะ, แพ้

---

## 🛡️ Phase 11 — Frontend: Admin Panel

- [ ] **Admin Dashboard** (`/admin`)
  - [ ] Stats: Markets ทั้งหมด, Users ทั้งหมด, Total Pool

- [ ] **Create Market** (`/admin/markets/new`)
  - [ ] Form: title, description, category, closingDate
  - [ ] Submit → POST /api/markets

- [ ] **Manage Markets** (`/admin/markets`)
  - [ ] ตาราง + Status ทุก Market
  - [ ] ปุ่ม "Close" → PATCH /:id/close
  - [ ] ปุ่ม "Resolve" → Modal (Yes/No) → PATCH /:id/resolve
  - [ ] ปุ่ม "Cancel" → Confirm → PATCH /:id/cancel

- [ ] **Users Management** (`/admin/users`)
  - [ ] ตาราง Users: username, email, balance, role

---

## 🧪 Phase 12 — Testing & Polish

- [ ] ทดสอบ End-to-End ทั้งหมด:
  - [ ] Register → Login → ดู Market → วาง Bet → Balance ลด
  - [ ] Admin Resolve → ผู้ชนะได้เงิน Real-time
  - [ ] Admin Cancel → ทุกคนได้ Refund
- [ ] ทดสอบ Edge Cases:
  - [ ] Bet ใน Market ที่ปิดแล้ว → Error message
  - [ ] Balance ไม่พอ → Error message
  - [ ] Session หมดอายุ → Auto redirect Login
- [ ] ปรับ UI ให้สวยงาม, Hover effects, Animations
- [ ] ตรวจสอบ Mobile Responsive

---

## 🚀 Phase 13 — Deployment

- [ ] **Backend → Render.com**
  - [ ] Push code ขึ้น GitHub
  - [ ] สร้าง Web Service บน Render
  - [ ] ตั้ง Environment Variables (SUPABASE_URL, SUPABASE_SERVICE_KEY ฯลฯ)
  - [ ] Deploy + ทดสอบ API URL

- [ ] **Frontend → Vercel**
  - [ ] เชื่อม GitHub repo กับ Vercel
  - [ ] ตั้ง Environment Variables (VITE_SUPABASE_URL, VITE_API_URL)
  - [ ] Deploy + ทดสอบ Production URL

- [ ] ทดสอบ Production ครบทุก Feature
- [ ] (Optional) ตั้ง Custom Domain

---

## 📊 ภาพรวม Progress

| Phase | หัวข้อ | Tasks | สถานะ |
|-------|--------|-------|-------|
| **0** | 🔧 Project Setup + Supabase | ~20 | ⬜ ยังไม่เริ่ม |
| **1** | 🔐 Authentication | ~10 | ⬜ ยังไม่เริ่ม |
| **2** | 🏪 Markets API | ~8 | ⬜ ยังไม่เริ่ม |
| **3** | 💰 Bet Placement | ~8 | ⬜ ยังไม่เริ่ม |
| **4** | 🏆 Resolve & Cancel | ~6 | ⬜ ยังไม่เริ่ม |
| **5** | ⚡ Realtime | ~4 | ⬜ ยังไม่เริ่ม |
| **6** | 👤 User Routes | ~3 | ⬜ ยังไม่เริ่ม |
| **7** | 🎨 Design System | ~6 | ⬜ ยังไม่เริ่ม |
| **8** | 📊 Dashboard | ~6 | ⬜ ยังไม่เริ่ม |
| **9** | 📈 Market Detail + Bet | ~8 | ⬜ ยังไม่เริ่ม |
| **10** | 📋 My Bets & Profile | ~5 | ⬜ ยังไม่เริ่ม |
| **11** | 🛡️ Admin Panel | ~8 | ⬜ ยังไม่เริ่ม |
| **12** | 🧪 Testing & Polish | ~6 | ⬜ ยังไม่เริ่ม |
| **13** | 🚀 Deployment | ~6 | ⬜ ยังไม่เริ่ม |

**รวมทั้งหมด: ~104 Tasks ใน 13 Phases**

---

> 💡 **เริ่มที่ Phase 0 ก่อนเลยครับ!** สร้าง Supabase Project แล้วแจ้งผมได้เลย 🚀
