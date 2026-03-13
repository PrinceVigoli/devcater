# 🍊 Saffron Catering — Full Deployment Guide
## Node.js + Express + MySQL + React

---

## 📁 PROJECT STRUCTURE

```
saffron-project/
├── saffron-backend/          ← Node.js API server
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   ├── config/
│   │   ├── db.js             ← MySQL connection + table creation
│   │   └── mailer.js         ← Nodemailer email setup
│   ├── middleware/
│   │   └── auth.js           ← JWT verify + admin guard
│   ├── routes/
│   │   ├── auth.js           ← Register, login, profile
│   │   ├── menu.js           ← Menu CRUD + image upload
│   │   ├── bookings.js       ← Event bookings
│   │   ├── orders.js         ← Catering orders
│   │   ├── payments.js       ← Payment records
│   │   ├── customers.js      ← Customer management + stats
│   │   ├── gallery.js        ← Gallery upload/delete
│   │   └── blog.js           ← Blog posts CRUD
│   └── uploads/              ← Stored images (auto-created)
│
└── saffron-frontend/         ← React app (from catering-website.jsx)
    ├── src/
    │   ├── App.jsx           ← Main app (your existing file)
    │   ├── services/
    │   │   └── api.js        ← API client (api.js from this project)
    │   └── .env
    └── package.json
```

---

## ✅ PREREQUISITES

Install these on your machine before starting:

| Tool        | Version   | Download |
|-------------|-----------|----------|
| Node.js     | 18+       | https://nodejs.org |
| MySQL       | 8.0+      | https://dev.mysql.com/downloads/ |
| npm         | 9+        | Comes with Node.js |
| Git         | any       | https://git-scm.com |

---

## 🗄️ STEP 1 — Set Up MySQL Database

### Option A: MySQL Command Line
```sql
-- Open MySQL shell
mysql -u root -p

-- Create database and user
CREATE DATABASE saffron_catering CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'saffron_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON saffron_catering.* TO 'saffron_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Option B: Using MySQL Workbench
1. Open MySQL Workbench
2. Connect to your local server
3. Run the SQL above in the Query editor
4. Click ▶ Execute

> **Note:** Tables are created **automatically** when you start the backend server for the first time. No SQL migration files needed.

---

## ⚙️ STEP 2 — Set Up the Backend

```bash
# 1. Navigate to backend folder
cd saffron-backend

# 2. Install all dependencies
npm install

# 3. Copy and edit environment file
cp .env.example .env
```

### Edit your `.env` file:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# --- DATABASE ---
DB_HOST=localhost
DB_PORT=3306
DB_USER=saffron_user
DB_PASSWORD=your_strong_password
DB_NAME=saffron_catering

# --- JWT (change these to long random strings!) ---
JWT_SECRET=change_this_to_a_random_64_char_string_abcdef1234567890xyz
JWT_EXPIRES_IN=7d

# --- EMAIL (Gmail setup below) ---
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=Saffron Catering <your_gmail@gmail.com>
```

### Start the backend:
```bash
# Development (auto-restarts on changes)
npm run dev

# Production
npm start
```

### Verify it's working:
```
http://localhost:5000/api/health
```
You should see:
```json
{ "success": true, "message": "Saffron API is running" }
```

### Default admin credentials (auto-created):
```
Email:    admin@saffron.com
Password: admin123
```
> **Change this password immediately after first login!**

---

## 📧 STEP 3 — Set Up Gmail for Email Notifications

1. Go to your Google Account → **Security**
2. Enable **2-Factor Authentication**
3. Search for **"App Passwords"**
4. Generate a new app password for **"Mail"**
5. Copy the 16-character password into `.env` as `EMAIL_PASS`

```env
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx   ← your app password (no spaces)
```

---

## ⚛️ STEP 4 — Set Up the Frontend (React)

```bash
# Create React app
npx create-react-app saffron-frontend
cd saffron-frontend

# Copy your catering-website.jsx to src/App.jsx
# Copy api.js to src/services/api.js

# Create environment file
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
```

### Connect the frontend to the backend

In your `catering-website.jsx`, replace hardcoded data with API calls.

**Example: Login modal (replace fake submit):**
```jsx
import { authAPI } from './services/api';

// Inside LoginModal component, replace submit():
const submit = async () => {
  try {
    const { token, user } = await authAPI.login({ email, pass });
    authAPI.saveToken(token);
    notify(`Welcome back, ${user.name}!`);
    onClose();
  } catch (err) {
    notify(`Error: ${err.message}`);
  }
};
```

**Example: Booking form (replace fake submit):**
```jsx
import { bookingAPI } from './services/api';

// Inside BookingSection, replace submit():
const submit = async (e) => {
  e.preventDefault();
  try {
    const { booking_ref } = await bookingAPI.submit({
      name: form.name,
      email: form.email,
      phone: form.phone,
      event_type: form.event,
      event_date: form.date,
      guest_count: form.guests,
      message: form.message,
    });
    notify(`Booking submitted! Your ref: ${booking_ref}`);
    setForm({ name:'', email:'', phone:'', event:'', date:'', guests:'', message:'' });
  } catch (err) {
    notify(`Error: ${err.message}`);
  }
};
```

**Example: Load menu from API:**
```jsx
import { menuAPI } from './services/api';
import { useState, useEffect } from 'react';

function MenuSection({ cart, setCart, notify }) {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    menuAPI.getAll({ status: 'active' })
      .then(({ data }) => setMenuItems(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ... rest of component
}
```

```bash
# Start the frontend
npm start
```

---

## 🌐 COMPLETE API REFERENCE

### AUTH
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | ❌ | Register new user |
| POST | /api/auth/login | ❌ | Login, returns JWT |
| GET | /api/auth/me | ✅ | Get current user |
| PUT | /api/auth/profile | ✅ | Update name/phone |
| PUT | /api/auth/password | ✅ | Change password |

### MENU
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/menu | ❌ | Get all menu items |
| GET | /api/menu/:id | ❌ | Get single item |
| POST | /api/menu | 👑 Admin | Create item (multipart) |
| PUT | /api/menu/:id | 👑 Admin | Update item |
| DELETE | /api/menu/:id | 👑 Admin | Delete item |

Query params: `?category=Desserts&status=active`

### BOOKINGS
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/bookings | Optional | Submit booking |
| GET | /api/bookings/my | ✅ | My bookings |
| GET | /api/bookings | 👑 Admin | All bookings |
| GET | /api/bookings/:id | ✅ | Single booking |
| PUT | /api/bookings/:id/status | 👑 Admin | Update status |
| DELETE | /api/bookings/:id | 👑 Admin | Delete booking |

### ORDERS
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/orders | Optional | Place order |
| GET | /api/orders/my | ✅ | My orders |
| GET | /api/orders | 👑 Admin | All orders |
| GET | /api/orders/:id | ✅ | Order + items |
| PUT | /api/orders/:id/status | 👑 Admin | Update status |

### PAYMENTS
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/payments | ✅ | Record payment |
| GET | /api/payments | 👑 Admin | All payments + stats |
| GET | /api/payments/my | ✅ | My history |
| PUT | /api/payments/:id/status | 👑 Admin | Verify/update |

### CUSTOMERS (Admin only)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/customers | 👑 Admin | All customers |
| GET | /api/customers/:id | 👑 Admin | Customer detail |
| PUT | /api/customers/:id/status | 👑 Admin | Suspend/activate |
| GET | /api/customers/stats/dashboard | 👑 Admin | Dashboard stats |

### GALLERY
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/gallery | ❌ | All images |
| POST | /api/gallery | 👑 Admin | Upload image |
| DELETE | /api/gallery/:id | 👑 Admin | Delete image |

### BLOG
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/blog | ❌ | Published posts |
| GET | /api/blog/admin/all | 👑 Admin | All posts |
| GET | /api/blog/:slug | ❌ | Single post |
| POST | /api/blog | 👑 Admin | Create post |
| PUT | /api/blog/:id | 👑 Admin | Update post |
| DELETE | /api/blog/:id | 👑 Admin | Delete post |

---

## 🚀 PRODUCTION DEPLOYMENT

### Option A: Deploy to Railway (Easiest — Free tier available)

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. In your backend folder
cd saffron-backend
railway init
railway up

# 4. Add environment variables in Railway dashboard
# 5. Add a MySQL plugin from Railway dashboard
```

### Option B: Deploy to VPS (DigitalOcean / Linode)

**1. Server setup (Ubuntu 22.04):**
```bash
# Connect to your server
ssh root@your_server_ip

# Update packages
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install MySQL
apt install -y mysql-server
mysql_secure_installation

# Install PM2 (process manager)
npm install -g pm2
```

**2. Upload your backend code:**
```bash
# On your local machine
scp -r ./saffron-backend root@your_server_ip:/var/www/saffron-backend
```

**3. Configure and start:**
```bash
# On the server
cd /var/www/saffron-backend
npm install
cp .env.example .env
nano .env  # ← Edit with production values

# Start with PM2
pm2 start server.js --name saffron-api
pm2 startup          # Auto-start on reboot
pm2 save
```

**4. Set up Nginx reverse proxy:**
```bash
apt install -y nginx

cat > /etc/nginx/sites-available/saffron << 'EOF'
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads/ {
        alias /var/www/saffron-backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
EOF

ln -s /etc/nginx/sites-available/saffron /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx
```

**5. Add SSL with Let's Encrypt (free HTTPS):**
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d api.yourdomain.com
```

### Option C: Deploy Frontend to Vercel (Free)
```bash
cd saffron-frontend

# Update .env for production
echo "REACT_APP_API_URL=https://api.yourdomain.com/api" > .env.production

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

---

## 🔒 SECURITY CHECKLIST

Before going live, make sure you:

- [ ] Change `JWT_SECRET` to a random 64+ character string
- [ ] Change default admin password (`admin@saffron.com` / `admin123`)
- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Use a real database password (not blank)
- [ ] Enable HTTPS (SSL certificate)
- [ ] Update `FRONTEND_URL` in `.env` to your real domain
- [ ] Set up regular database backups
- [ ] Review CORS settings in `server.js`

---

## 🐛 TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| `ER_ACCESS_DENIED_ERROR` | Check DB_USER and DB_PASSWORD in .env |
| `ECONNREFUSED` on DB | Make sure MySQL is running: `sudo service mysql start` |
| `Token expired` errors | Check JWT_EXPIRES_IN in .env |
| Emails not sending | Enable 2FA on Gmail, use App Password not regular password |
| CORS errors in browser | Update FRONTEND_URL in .env to match your React URL |
| Images not loading | Check that /uploads folder exists and has write permissions |

---

## 📞 SUPPORT

- Backend runs on: `http://localhost:5000`
- Frontend runs on: `http://localhost:3000`
- Health check: `http://localhost:5000/api/health`
- Admin login: `admin@saffron.com` / `admin123`
