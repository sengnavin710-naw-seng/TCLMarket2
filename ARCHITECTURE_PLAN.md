# 🏆 TCLMarket2 — Prediction Market App (Architecture ฉบับ Supabase)
> แรงบันดาลใจจาก [Polymarket](https://polymarket.com) | อัปเดต: 20 Feb 2026
> Database: **Supabase** (PostgreSQL + Auth + Realtime) — ฟรี 100%

---

## 📦 Tech Stack

| ส่วน | เทคโนโลยี | เหตุผล |
|------|-----------|--------|
| **Frontend** | React + Vite | Fast, Component-based |
| **Styling** | Vanilla CSS | ควบคุมได้เต็มที่ |
| **Backend** | Node.js + Express | REST API + Business Logic |
| **Database** | Supabase (PostgreSQL) | ฟรี, SQL, มี Auth ในตัว |
| **Auth** | Supabase Auth | JWT อัตโนมัติ, ไม่ต้องเขียนเอง |
| **Real-time** | Supabase Realtime | Subscribe changes แทน Socket.io |
| **ORM/Client** | @supabase/supabase-js | Official Supabase Client |
| **Deploy** | Render.com + Vercel | ฟรีทั้งคู่ |

---

## 🗄️ Database Tables (PostgreSQL)

### 1. `users` *(จัดการโดย Supabase Auth + ตาราง public.users)*
```sql
CREATE TABLE public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id),
  username    TEXT UNIQUE NOT NULL,
  balance     NUMERIC(12,2) DEFAULT 1000.00,
  role        TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. `markets`
```sql
CREATE TABLE public.markets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  description  TEXT,
  category     TEXT,
  total_yes    NUMERIC(12,2) DEFAULT 0,
  total_no     NUMERIC(12,2) DEFAULT 0,
  total_pool   NUMERIC(12,2) DEFAULT 0,
  status       TEXT DEFAULT 'open'
               CHECK (status IN ('open','closed','resolved','cancelled')),
  result       TEXT CHECK (result IN ('yes','no',NULL)),
  closing_date TIMESTAMPTZ NOT NULL,
  resolved_at  TIMESTAMPTZ,
  created_by   UUID REFERENCES public.users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. `bets`
```sql
CREATE TABLE public.bets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id),
  market_id         UUID NOT NULL REFERENCES public.markets(id),
  side              TEXT NOT NULL CHECK (side IN ('yes','no')),
  stake             NUMERIC(12,2) NOT NULL CHECK (stake > 0),
  price_at_bet      NUMERIC(6,4) NOT NULL,
  potential_payout  NUMERIC(12,2) NOT NULL,
  actual_payout     NUMERIC(12,2),
  status            TEXT DEFAULT 'pending'
                    CHECK (status IN ('pending','won','lost','refunded')),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. `transactions`
```sql
CREATE TABLE public.transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id),
  type            TEXT NOT NULL CHECK (type IN ('deposit','bet','win','refund')),
  amount          NUMERIC(12,2) NOT NULL,
  balance_before  NUMERIC(12,2) NOT NULL,
  balance_after   NUMERIC(12,2) NOT NULL,
  reference_id    UUID,       -- bet_id หรือ market_id
  description     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

> ✅ **ไม่ต้องมี `sessions` table!** — Supabase Auth จัดการ JWT ให้ทั้งหมด

---

## 🔌 Supabase Features ที่ใช้

### 1. Supabase Auth (แทน JWT เขียนเอง)
```javascript
// สมัครสมาชิก
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
})

// เข้าสู่ระบบ
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})

// ออกจากระบบ
await supabase.auth.signOut()

// ดึง User ปัจจุบัน
const { data: { user } } = await supabase.auth.getUser()
```

### 2. Supabase Realtime (แทน Socket.io)
```javascript
// Frontend Subscribe การเปลี่ยนแปลง Odds
const channel = supabase
  .channel('market-odds')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'markets',
    filter: `id=eq.${marketId}`
  }, (payload) => {
    // payload.new มี totalYes, totalNo, totalPool ใหม่
    updateOddsChart(payload.new)
  })
  .subscribe()
```

### 3. Row Level Security (RLS) — ความปลอดภัย
```sql
-- ผู้ใช้ดูได้เฉพาะ Bets ของตัวเอง
CREATE POLICY "Users can view own bets"
  ON public.bets FOR SELECT
  USING (auth.uid() = user_id);

-- Admin เท่านั้น Resolve Market ได้
CREATE POLICY "Admin can update markets"
  ON public.markets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

## 🔌 API Routes (Backend — Node.js + Express)

> **หมายเหตุ:** Backend ยังคงใช้ Express เพื่อจัดการ Business Logic พิเศษ
> เช่น Atomic Bet Placement, Resolve/Cancel, Odds Calculation
> ส่วน CRUD ทั่วไปสามารถเรียก Supabase โดยตรงจาก Frontend ได้

### 🔐 Auth — ใช้ Supabase Auth โดยตรงจาก Frontend
| Action | วิธี |
|--------|------|
| Register | `supabase.auth.signUp()` — Frontend |
| Login | `supabase.auth.signInWithPassword()` — Frontend |
| Logout | `supabase.auth.signOut()` — Frontend |
| Get Session | `supabase.auth.getSession()` — Frontend |

### 🏪 Market Routes `/api/markets` (Express Backend)
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/` | ดู Markets + Odds (ผ่าน Supabase) | ❌ |
| GET | `/:id` | ดู Market detail | ❌ |
| POST | `/` | สร้าง Market | ✅ Admin |
| PATCH | `/:id/close` | ปิดรับ Bet | ✅ Admin |
| PATCH | `/:id/resolve` | ประกาศผล + แจก Winnings | ✅ Admin |
| PATCH | `/:id/cancel` | ยกเลิก + Refund ทั้งหมด | ✅ Admin |

### 💰 Bet Routes `/api/bets` (Express Backend)
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/` | วาง Bet (Atomic via Supabase RPC) | ✅ User |
| GET | `/my` | ดู Bet ของตัวเอง | ✅ User |
| GET | `/market/:id` | ดู Bets ทั้งหมดใน Market | ✅ Admin |

### 👤 User Routes `/api/users` (Express Backend)
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/me` | ดู Profile + Balance | ✅ User |
| GET | `/me/transactions` | Transaction History | ✅ User |
| GET | `/` | ดู Users ทั้งหมด | ✅ Admin |

---

## 📐 Odds Calculation (AMM)

### สูตร
```
totalPool = total_yes + total_no

priceYes = total_yes / totalPool    ← ความน่าจะเป็น (0.0 - 1.0)
priceNo  = total_no  / totalPool

potentialPayout = stake / price_at_bet   ← snapshot ตอนวาง Bet
```

### ตัวอย่าง
```
total_yes = 650, total_no = 350, totalPool = 1000

priceYes = 0.65 (65%)
priceNo  = 0.35 (35%)

Stake 100 units → Payout = 100 / 0.65 = 153.85 units
กำไร = 53.85 units

⚠️ Odds เปลี่ยนทุกครั้งที่มี Bet ใหม่เข้ามา
```

### หลัง Resolve
```
ผล = Yes:
  Winners (side=yes): actualPayout = stake / price_at_bet → เพิ่มใน balance
  Losers  (side=no):  status = 'lost' → ไม่ได้อะไร

ผล = Cancelled:
  ทุกคน: คืน stake กลับ (refund)
```

---

## 🔄 Bet Placement Flow (Atomic ด้วย Supabase RPC)

```
User กด "Place Bet"
      ↓
[Frontend] เรียก POST /api/bets + Supabase Auth Token
      ↓
[Backend Middleware] ตรวจสอบ Token กับ Supabase
      ↓
[Backend] เรียก Supabase RPC function 'place_bet'
      ↓
[Supabase PostgreSQL Function] — Atomic Transaction:
  1. ตรวจ market.status = 'open'
  2. ตรวจ user.balance >= stake
  3. คำนวณ price_at_bet, potential_payout
  4. INSERT INTO bets
  5. UPDATE users SET balance = balance - stake  ← atomic
  6. UPDATE markets SET total_yes/total_no/total_pool  ← atomic
  7. INSERT INTO transactions (type='bet')
      ↓
[Supabase Realtime] Broadcast market UPDATE → Frontend รับอัตโนมัติ
      ↓
[Frontend] อัปเดต Odds Chart แบบ Real-time
```

### Supabase RPC Function (ป้องกัน Race Condition)
```sql
CREATE OR REPLACE FUNCTION place_bet(
  p_user_id    UUID,
  p_market_id  UUID,
  p_side       TEXT,
  p_stake      NUMERIC
) RETURNS JSON AS $$
DECLARE
  v_market     markets%ROWTYPE;
  v_user       users%ROWTYPE;
  v_price      NUMERIC;
  v_payout     NUMERIC;
BEGIN
  -- Lock row เพื่อกัน Race Condition
  SELECT * INTO v_market FROM markets
    WHERE id = p_market_id AND status = 'open'
    FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'MARKET_NOT_OPEN';
  END IF;

  -- ตรวจ Balance
  SELECT * INTO v_user FROM users
    WHERE id = p_user_id AND balance >= p_stake
    FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'INSUFFICIENT_BALANCE';
  END IF;

  -- คำนวณ Odds
  v_price  := CASE WHEN p_side = 'yes'
              THEN v_market.total_yes / NULLIF(v_market.total_pool, 0)
              ELSE v_market.total_no  / NULLIF(v_market.total_pool, 0) END;
  v_price  := COALESCE(v_price, 0.5);  -- ถ้ายังไม่มี Pool เริ่มที่ 50/50
  v_payout := p_stake / v_price;

  -- Atomic Updates
  UPDATE users SET balance = balance - p_stake WHERE id = p_user_id;

  UPDATE markets SET
    total_yes  = CASE WHEN p_side='yes' THEN total_yes + p_stake ELSE total_yes END,
    total_no   = CASE WHEN p_side='no'  THEN total_no  + p_stake ELSE total_no  END,
    total_pool = total_pool + p_stake
  WHERE id = p_market_id;

  INSERT INTO bets (user_id, market_id, side, stake, price_at_bet, potential_payout)
  VALUES (p_user_id, p_market_id, p_side, p_stake, v_price, v_payout);

  INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, description)
  VALUES (p_user_id, 'bet', p_stake, v_user.balance, v_user.balance - p_stake,
          'Bet on market: ' || p_market_id);

  RETURN json_build_object('success', true, 'payout', v_payout, 'price', v_price);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🛡️ Market Lifecycle

```
           สร้าง Market
               ↓
            [OPEN]  ← User วาง Bet ได้, Realtime Odds Update
               ↓
           [CLOSED] ← Admin ปิด
            ↙     ↘
     [RESOLVED]  [CANCELLED]
    (แจก Winnings) (Refund ทั้งหมด)
```

---

## ⚡ Realtime Events (Supabase แทน Socket.io)

| Event | ช่องทาง | เมื่อไหร่ |
|-------|---------|----------|
| Odds เปลี่ยน | Supabase Realtime (markets UPDATE) | ทุกครั้งที่มี Bet ใหม่ |
| Market Resolved | Supabase Realtime (markets UPDATE status) | Admin กด Resolve |
| Balance เปลี่ยน | Supabase Realtime (users UPDATE) | Win / Refund |
| Market Cancelled | Supabase Realtime (markets UPDATE status) | Admin กด Cancel |

---

## 📁 โครงสร้างโฟลเดอร์

```
TCLMarket2/
├── frontend/                    ← React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── OddsBar.jsx
│   │   │   ├── BetForm.jsx
│   │   │   ├── MarketCard.jsx
│   │   │   └── Notification.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── MarketDetail.jsx
│   │   │   ├── MyBets.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── CreateMarket.jsx
│   │   │       └── ManageMarkets.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx   ← Supabase Auth Session
│   │   ├── hooks/
│   │   │   ├── useMarket.js
│   │   │   └── useRealtime.js    ← Supabase Realtime hook
│   │   ├── services/
│   │   │   ├── marketService.js
│   │   │   └── betService.js
│   │   └── supabaseClient.js     ← Supabase init
│   └── package.json
│
├── backend/                     ← Node.js + Express
│   ├── src/
│   │   ├── routes/
│   │   │   ├── market.routes.js
│   │   │   ├── bet.routes.js
│   │   │   └── user.routes.js
│   │   ├── controllers/
│   │   │   ├── market.controller.js
│   │   │   ├── bet.controller.js
│   │   │   └── user.controller.js
│   │   ├── middleware/
│   │   │   └── auth.js           ← ตรวจ Supabase Token
│   │   ├── services/
│   │   │   ├── oddsService.js
│   │   │   ├── resolveService.js
│   │   │   └── cancelService.js
│   │   └── supabaseClient.js     ← Supabase Admin Client
│   ├── app.js
│   └── package.json
│
├── supabase/
│   └── migrations/
│       ├── 001_create_tables.sql
│       ├── 002_rls_policies.sql
│       └── 003_functions.sql     ← place_bet RPC, resolve, cancel
│
├── ARCHITECTURE_PLAN.md
├── TASK_LIST.md
└── README.md
```

---

## 🚨 Error Handling

| Error | สาเหตุ | การจัดการ |
|-------|--------|----------|
| `INSUFFICIENT_BALANCE` | Balance ไม่พอ | 400 + message |
| `MARKET_NOT_OPEN` | Market ปิด/resolved แล้ว | 400 + message |
| `INVALID_TOKEN` | Supabase Token ไม่ถูกต้อง | 401 → Frontend redirect Login |
| `RACE_CONDITION` | PostgreSQL Row Lock จัดการให้ | Transparent |
| `MARKET_CANCELLED` | Admin ยกเลิก | Auto Refund + Realtime notify |

---

## ✅ Checklist ก่อน Build

- [ ] สมัคร Supabase ที่ [supabase.com](https://supabase.com) (ฟรี)
- [ ] สร้าง Project ใหม่ใน Supabase
- [ ] รัน SQL Migrations สร้าง Tables
- [ ] เปิด RLS + สร้าง Policies
- [ ] สร้าง RPC Functions (place_bet, resolve_market, cancel_market)
- [ ] เปิด Realtime สำหรับ markets และ users tables
- [ ] คัดลอก `SUPABASE_URL` และ `SUPABASE_ANON_KEY` ใส่ .env
- [ ] ทดสอบ Auth, Bet, Resolve ทำงานได้
