# Saffron Catering — Frontend

React 18 single-page application

## Setup

```bash
npm install
npm start        # development on http://localhost:3000
npm run build    # production build
```

## Structure

```
saffron-frontend/
├── public/
│   └── index.html
└── src/
    ├── index.js              ← React entry point
    ├── App.jsx               ← All pages + components
    ├── context/
    │   └── AuthContext.js    ← Global auth state (login/logout/user)
    └── services/
        └── api.js            ← All API calls to backend
```

## Environment

```env
REACT_APP_API_URL=http://localhost:5000/api
```

For production, change to your deployed backend URL.

## Pages

- `/` — Landing page (hero, services, menu, about, gallery, testimonials, booking)
- Dashboard — User's bookings & orders (click your name in nav)
- Admin Panel — Full admin dashboard (footer → Admin Portal)

## Key Components

| Component | Description |
|---|---|
| `NavBar` | Fixed nav, scroll-aware, auth-aware |
| `MenuSection` | Live menu from API, category tabs, add to cart |
| `BookingSection` | Event booking form, saves to DB, sends email |
| `CartModal` | Cart with qty controls, places real orders |
| `LoginModal` | Register / login with real JWT auth |
| `UserDashboard` | Bookings & orders history |
| `AdminPanel` | Full admin with 7 sections |
