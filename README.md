# 🍊 Saffron Catering

Full-stack premium catering website — React + Node.js + Express + MySQL

---

## 📁 Structure

```
saffron-catering/
├── saffron-backend/    → Node.js + Express REST API
└── saffron-frontend/   → React single-page app
```

---

## 🚀 Deploy to Railway (Backend + MySQL)

### Step 1 — Push to GitHub first
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/saffron-catering.git
git push -u origin main
```

### Step 2 — Deploy backend on Railway
1. Go to https://railway.app → **New Project**
2. Click **Deploy from GitHub repo** → select your repo
3. Railway asks which folder → select **saffron-backend**
4. Click **Add Plugin** → **MySQL** — Railway creates a database and injects `MYSQL_URL` automatically
5. Go to **Variables** tab and add:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | any long random string |
| `FRONTEND_URL` | your Vercel URL (add after Step 3) |
| `EMAIL_USER` | your Gmail |
| `EMAIL_PASS` | your Gmail App Password |

6. Railway auto-deploys. Copy your backend URL: `https://xxxx.up.railway.app`

### Step 3 — Deploy frontend on Vercel
1. Go to https://vercel.com → **New Project** → import your GitHub repo
2. Set **Root Directory** to `saffron-frontend`
3. Add Environment Variable:

| Variable | Value |
|---|---|
| `REACT_APP_API_URL` | `https://xxxx.up.railway.app/api` |

4. Deploy. Copy your Vercel URL.
5. Go back to Railway → Variables → set `FRONTEND_URL` to your Vercel URL
6. Railway redeploys automatically.

### ✅ Done! Check your backend health:
```
https://xxxx.up.railway.app/api/health
```

---

## 💻 Local Development

### Backend
```bash
cd saffron-backend
npm install
cp .env.example .env    # fill in your MySQL credentials
npm run dev             # runs on http://localhost:5000
```

### Frontend
```bash
cd saffron-frontend
npm install
npm start               # runs on http://localhost:3000
```

### Default admin login
```
Email:    admin@saffron.com
Password: admin123
```

---

## 🔑 Railway Environment Variables

Railway **automatically injects** these when you add a MySQL plugin — you do NOT set these manually:
- `MYSQL_URL` — full connection string, used by the app automatically
- `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`

You **do** need to set manually:
- `NODE_ENV=production`
- `JWT_SECRET=<long random string>`
- `FRONTEND_URL=<your vercel URL>`
- `EMAIL_USER` and `EMAIL_PASS` (optional, for booking emails)

---

## 🛠️ Tech Stack

**Backend:** Node.js, Express, MySQL2, JWT, bcryptjs, Multer, Nodemailer, Helmet  
**Frontend:** React 18, Context API, Fetch API, Google Fonts
