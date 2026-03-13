# Saffron Catering — Backend API

Node.js + Express + MySQL REST API

## Setup

```bash
npm install
cp .env.example .env   # fill in your values
npm run dev            # development with auto-reload
npm start              # production
```

## Structure

```
saffron-backend/
├── server.js                 ← Entry point
├── config/
│   ├── db.js                 ← MySQL pool + auto table creation
│   └── mailer.js             ← Email templates (Nodemailer)
├── middleware/
│   └── auth.js               ← JWT verify, adminOnly, optionalAuth
├── controllers/
│   ├── authController.js     ← register, login, profile, password
│   ├── menuController.js     ← CRUD + image upload + stats
│   ├── bookingController.js  ← submit, manage, stats, email notify
│   ├── orderController.js    ← place order, line items, tax calc
│   ├── paymentController.js  ← record, verify, revenue stats
│   ├── customerController.js ← list, suspend, dashboard stats
│   ├── galleryController.js  ← upload, delete images
│   └── blogController.js     ← draft/publish posts
├── routes/
│   ├── auth.js
│   ├── menu.js
│   ├── bookings.js
│   ├── orders.js
│   ├── payments.js
│   ├── customers.js
│   ├── gallery.js
│   └── blog.js
└── uploads/                  ← Created automatically, gitignored
    ├── menu/
    ├── gallery/
    └── avatars/
```

## Health Check
```
GET http://localhost:5000/api/health
```

## Default Admin
```
Email:    admin@saffron.com
Password: admin123
```
