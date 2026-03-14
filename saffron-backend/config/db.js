const mysql = require('mysql2/promise');
require('dotenv').config();

// ─── RAILWAY DETECTION ────────────────────────────────────────────────────────
// Railway injects these automatically when you add a MySQL plugin.
// Priority: MYSQL_URL → individual MYSQL* vars → local .env vars

let poolConfig;

if (process.env.MYSQL_URL || process.env.DATABASE_URL) {
  // Full connection string (Railway, PlanetScale, etc.)
  console.log('🔌 Using MYSQL_URL connection string');
  poolConfig = {
    uri: process.env.MYSQL_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  };

} else if (process.env.MYSQLHOST) {
  // Railway also injects individual vars: MYSQLHOST, MYSQLPORT, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE
  console.log(`🔌 Using Railway individual vars → ${process.env.MYSQLHOST}:${process.env.MYSQLPORT}`);
  poolConfig = {
    host:     process.env.MYSQLHOST,
    port:     parseInt(process.env.MYSQLPORT) || 3306,
    user:     process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    ssl:      { rejectUnauthorized: false },
  };

} else {
  // Local development
  console.log(`🔌 Using local DB → ${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || 3306}`);
  poolConfig = {
    host:     process.env.DB_HOST     || '127.0.0.1',
    port:     parseInt(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'saffron_catering',
  };
}

const pool = mysql.createPool({
  ...poolConfig,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           '+00:00',
});

// ─── TEST CONNECTION ──────────────────────────────────────────────────────────

const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL connected successfully');
    conn.release();
    await createTables();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    console.error('   Available DB env vars:', {
      MYSQL_URL:      !!process.env.MYSQL_URL,
      MYSQLHOST:      process.env.MYSQLHOST,
      MYSQLPORT:      process.env.MYSQLPORT,
      DB_HOST:        process.env.DB_HOST,
    });
    process.exit(1);
  }
};

// ─── CREATE TABLES ────────────────────────────────────────────────────────────

const createTables = async () => {
  const queries = [

    `CREATE TABLE IF NOT EXISTS users (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      name         VARCHAR(100) NOT NULL,
      email        VARCHAR(150) NOT NULL UNIQUE,
      password     VARCHAR(255) NOT NULL,
      phone        VARCHAR(20),
      role         ENUM('customer','admin') DEFAULT 'customer',
      status       ENUM('active','suspended') DEFAULT 'active',
      avatar       VARCHAR(255),
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS menu_items (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      name         VARCHAR(150) NOT NULL,
      description  TEXT,
      price        DECIMAL(10,2) NOT NULL,
      category     ENUM('Appetizers','Main Courses','Desserts','Beverages','Catering Packages') NOT NULL,
      image        VARCHAR(255),
      status       ENUM('active','inactive') DEFAULT 'active',
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS bookings (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      booking_ref   VARCHAR(20) NOT NULL UNIQUE,
      user_id       INT,
      name          VARCHAR(100) NOT NULL,
      email         VARCHAR(150) NOT NULL,
      phone         VARCHAR(20),
      event_type    ENUM('Wedding','Corporate Event','Birthday Party','Private Event','Other') NOT NULL,
      event_date    DATE NOT NULL,
      guest_count   INT NOT NULL,
      message       TEXT,
      status        ENUM('pending','confirmed','rejected','cancelled') DEFAULT 'pending',
      assigned_team VARCHAR(100),
      total_amount  DECIMAL(10,2) DEFAULT 0.00,
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )`,

    `CREATE TABLE IF NOT EXISTS orders (
      id                INT AUTO_INCREMENT PRIMARY KEY,
      order_ref         VARCHAR(20) NOT NULL UNIQUE,
      user_id           INT,
      booking_id        INT,
      name              VARCHAR(100) NOT NULL,
      email             VARCHAR(150) NOT NULL,
      event_date        DATE,
      delivery_location TEXT,
      special_notes     TEXT,
      subtotal          DECIMAL(10,2) DEFAULT 0.00,
      tax               DECIMAL(10,2) DEFAULT 0.00,
      total             DECIMAL(10,2) DEFAULT 0.00,
      status            ENUM('pending','confirmed','preparing','delivered','cancelled') DEFAULT 'pending',
      created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE SET NULL,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
    )`,

    `CREATE TABLE IF NOT EXISTS order_items (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      order_id     INT NOT NULL,
      menu_item_id INT NOT NULL,
      name         VARCHAR(150) NOT NULL,
      price        DECIMAL(10,2) NOT NULL,
      quantity     INT NOT NULL DEFAULT 1,
      subtotal     DECIMAL(10,2) NOT NULL,
      FOREIGN KEY (order_id)     REFERENCES orders(id)     ON DELETE CASCADE,
      FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE RESTRICT
    )`,

    `CREATE TABLE IF NOT EXISTS payments (
      id             INT AUTO_INCREMENT PRIMARY KEY,
      payment_ref    VARCHAR(50) NOT NULL UNIQUE,
      order_id       INT,
      booking_id     INT,
      user_id        INT,
      amount         DECIMAL(10,2) NOT NULL,
      method         ENUM('paypal','credit_card','bank_transfer','cash') NOT NULL,
      status         ENUM('pending','completed','failed','refunded') DEFAULT 'pending',
      transaction_id VARCHAR(255),
      notes          TEXT,
      paid_at        TIMESTAMP NULL,
      created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE SET NULL,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
      FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE SET NULL
    )`,

    `CREATE TABLE IF NOT EXISTS gallery (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      title      VARCHAR(150),
      filename   VARCHAR(255) NOT NULL,
      category   VARCHAR(50) DEFAULT 'General',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS blog_posts (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      title        VARCHAR(200) NOT NULL,
      slug         VARCHAR(200) NOT NULL UNIQUE,
      content      LONGTEXT NOT NULL,
      excerpt      TEXT,
      image        VARCHAR(255),
      category     VARCHAR(50),
      author_id    INT,
      status       ENUM('draft','published') DEFAULT 'draft',
      published_at TIMESTAMP NULL,
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
    )`,

    `CREATE TABLE IF NOT EXISTS saved_items (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      user_id      INT NOT NULL,
      menu_item_id INT NOT NULL,
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_saved (user_id, menu_item_id),
      FOREIGN KEY (user_id)      REFERENCES users(id)      ON DELETE CASCADE,
      FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
    )`,
  ];

  for (const q of queries) {
    await pool.execute(q);
  }

  await seedDefaultAdmin();
  console.log('✅ Database tables ready');
};

// ─── SEED DEFAULT ADMIN ───────────────────────────────────────────────────────

const seedDefaultAdmin = async () => {
  const bcrypt = require('bcryptjs');
  const [rows] = await pool.execute("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  if (rows.length === 0) {
    const hashed = await bcrypt.hash('admin123', 12);
    await pool.execute(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')",
      ['Admin User', 'admin@saffron.com', hashed]
    );
    console.log('✅ Default admin created → admin@saffron.com / admin123');
  }
};

module.exports = { pool, testConnection };
