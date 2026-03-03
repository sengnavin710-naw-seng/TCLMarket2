# TCLMarket2 — Deploy Guide

## 🏗️ Architecture
```
Frontend (Vercel)   ←──HTTP──→   Backend (Render.com)   ←──SDK──→   Supabase
```

---

## 🔧 Backend → Render.com

### ขั้นตอน:
1. Push โค้ดขึ้น GitHub
2. ไปที่ [render.com](https://render.com) → **New → Web Service**
3. เชื่อม GitHub repo → เลือก folder `backend/`
4. ตั้งค่า:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Region:** Singapore
5. เพิ่ม **Environment Variables:**

| Key | Value |
|-----|-------|
| `PORT` | `5000` |
| `SUPABASE_URL` | `https://osqwujpulwjolffislng.supabase.co` |
| `SUPABASE_SERVICE_KEY` | *(service_role key จาก Supabase)* |
| `CLIENT_URL` | `https://tclmarket2.vercel.app` *(URL จาก Vercel)* |

6. กด **Deploy** รอ ~3 นาที
7. ทดสอบที่ `https://tclmarket2-api.onrender.com/health`

---

## 🎨 Frontend → Vercel

### ขั้นตอน:
1. ไปที่ [vercel.com](https://vercel.com) → **New Project**
2. Import GitHub repo → เลือก folder `frontend/`
3. Framework: **Vite** (auto detect)
4. เพิ่ม **Environment Variables:**

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://osqwujpulwjolffislng.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | *(anon key จาก Supabase)* |
| `VITE_API_URL` | `https://tclmarket2-api.onrender.com` *(URL จาก Render)* |

5. กด **Deploy**

---

## 💻 Local Development

### รัน Backend:
```bash
cd backend
npm run dev
# รันที่ http://localhost:5000
```

### รัน Frontend:
```bash
cd frontend
npm run dev
# รันที่ http://localhost:5173
# Proxy /api/* → http://localhost:5000 อัตโนมัติ
```

---

## 📁 File Structure
```
TCLMarket2/
├── backend/
│   ├── src/
│   │   ├── config/supabase.js
│   │   ├── middleware/auth.js
│   │   └── routes/
│   ├── .env                  ← local dev (ไม่ push GitHub!)
│   ├── render.yaml           ← Render.com config
│   └── package.json
├── frontend/
│   ├── src/
│   ├── .env                  ← local dev (ไม่ push GitHub!)
│   ├── .env.production       ← Vercel production URL
│   ├── vercel.json           ← Vercel SPA routing
│   └── package.json
└── .gitignore
```
