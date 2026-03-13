# 🍊 Saffron Catering

A full-stack premium catering website with customer-facing landing page, real-time menu, event booking system, cart + ordering, and a full admin dashboard.

**Stack:** React · Node.js · Express · MySQL

---

## 📁 Project Structure

```
saffron-catering/
├── saffron-backend/      → Node.js + Express REST API
└── saffron-frontend/     → React single-page application
```

---

## ✨ Features

### Customer Side
- 🏠 Landing page — hero, services, about, gallery, testimonials
- 🍽️ Live menu — loaded from database, filterable by category
- 🛒 Cart + checkout — places real orders saved to MySQL
- 📅 Event booking form — saves to DB, sends confirmation email
- 👤 User accounts — register, login, JWT auth
- 📋 User dashboard — view own bookings & orders

### Admin Panel
- 📊 Dashboard — live stats, monthly booking chart
- 📅 Bookings — confirm/reject, assign team, email notifications
- 🍽️ Menu — add/edit/delete items with image upload
- 👥 Customers — view, suspend/activate accounts
- 💳 Payments — track and verify transactions
- 🖼️ Gallery — upload/delete images
- 📝 Blog — create/publish/draft posts

---

## 🚀 Quick Start

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/saffron-catering.git
cd saffron-catering
```

### 2. Set up the backend
```bash
cd saffron-backend
npm install
cp .env.example .env
# Edit .env with your MySQL credentials
npm run dev
```

### 3. Set up the frontend
```bash
cd ../saffron-frontend
npm install
npm start
```

The app will be running at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Default admin login
```
Email:    admin@saffron.com
Password: admin123
```
> Change this immediately after first login.

---

## ⚙️ Environment Variables

Copy `saffron-backend/.env.example` to `saffron-backend/.env` and fill in:

| Variable | Description |
|---|---|
| `DB_HOST` | MySQL host (default: localhost) |
| `DB_USER` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | Database name (default: saffron_catering) |
| `JWT_SECRET` | Long random string for signing tokens |
| `EMAIL_USER` | Gmail address for sending emails |
| `EMAIL_PASS` | Gmail App Password (not your regular password) |

---

## 🗄️ Database

Tables are **auto-created** on first server start. No migration files needed.

Tables created:
`users` · `menu_items` · `bookings` · `orders` · `order_items` · `payments` · `gallery` · `blog_posts` · `saved_items`

---

## 🌐 API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | — | Register |
| POST | /api/auth/login | — | Login |
| GET | /api/auth/me | ✅ | My profile |
| GET | /api/menu | — | All menu items |
| POST | /api/bookings | Optional | Submit booking |
| GET | /api/bookings/my | ✅ | My bookings |
| POST | /api/orders | Optional | Place order |
| GET | /api/orders/my | ✅ | My orders |
| GET | /api/customers/stats/dashboard | 👑 | Admin stats |

Full API docs in `saffron-backend/DEPLOYMENT.md`

---

## 🚢 Deployment

See `saffron-backend/DEPLOYMENT.md` for full guides on:
- Railway (easiest, free tier)
- DigitalOcean / VPS with Nginx + PM2
- Vercel (frontend)
- SSL with Let's Encrypt

---

## 🛠️ Tech Stack

**Backend**
- Node.js + Express
- MySQL2 (connection pool)
- JWT + bcryptjs (auth)
- Multer (file uploads)
- Nodemailer (emails)
- Helmet + express-rate-limit (security)

**Frontend**
- React 18
- Context API (auth state)
- Fetch API (no extra libraries)
- Google Fonts (Playfair Display + DM Sans)

---

## 📄 License

MIT — free to use and modify.
