const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── BASE TEMPLATE ────────────────────────────────────────────────────────────

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Arial', sans-serif; background: #FBF6EF; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(61,35,20,0.1); }
    .header { background: linear-gradient(135deg, #3D2314, #6B3A1F); padding: 36px 40px; text-align: center; }
    .logo { color: white; font-size: 28px; font-weight: bold; letter-spacing: -0.5px; }
    .body { padding: 40px; }
    h2 { color: #3D2314; font-size: 22px; margin-bottom: 16px; }
    p { color: #8A7968; font-size: 15px; line-height: 1.7; margin-bottom: 12px; }
    .detail-box { background: #FBF6EF; border-radius: 12px; padding: 20px 24px; margin: 24px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #F0EBE3; font-size: 14px; }
    .detail-row:last-child { border-bottom: none; }
    .label { color: #8A7968; }
    .value { color: #3D2314; font-weight: 600; }
    .btn { display: inline-block; background: #E8682A; color: white; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 15px; margin-top: 8px; }
    .footer { background: #3D2314; padding: 24px 40px; text-align: center; color: rgba(255,255,255,0.6); font-size: 13px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header"><div class="logo">✦ Saffron Catering</div></div>
    <div class="body">${content}</div>
    <div class="footer">© 2025 Saffron Catering · 123 Culinary Ave, New York · hello@saffron.com</div>
  </div>
</body>
</html>
`;

// ─── EMAIL SENDERS ────────────────────────────────────────────────────────────

const sendWelcomeEmail = async (user) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: 'Welcome to Saffron Catering 🍊',
    html: baseTemplate(`
      <h2>Welcome, ${user.name}!</h2>
      <p>Thank you for creating an account with <strong>Saffron Catering</strong>. We're thrilled to have you.</p>
      <p>You can now browse our menu, make event bookings, and track your orders — all from your dashboard.</p>
      <a href="${process.env.FRONTEND_URL}/dashboard" class="btn">Go to Dashboard</a>
    `),
  });
};

const sendBookingConfirmation = async (booking) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: booking.email,
    subject: `Booking Request Received — ${booking.booking_ref}`,
    html: baseTemplate(`
      <h2>We received your booking request!</h2>
      <p>Hi ${booking.name}, your catering request has been submitted. Our team will review and confirm within 24 hours.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="label">Booking Ref</span><span class="value">${booking.booking_ref}</span></div>
        <div class="detail-row"><span class="label">Event Type</span><span class="value">${booking.event_type}</span></div>
        <div class="detail-row"><span class="label">Event Date</span><span class="value">${booking.event_date}</span></div>
        <div class="detail-row"><span class="label">Guests</span><span class="value">${booking.guest_count}</span></div>
        <div class="detail-row"><span class="label">Status</span><span class="value">Pending Review</span></div>
      </div>
      <p>Questions? Reply to this email or call us at +1 (555) 123-4567.</p>
    `),
  });
};

const sendBookingStatusUpdate = async (booking) => {
  const statusMessages = {
    confirmed: { subject: 'Booking Confirmed! 🎉', msg: `Great news! Your booking <strong>${booking.booking_ref}</strong> has been confirmed.` },
    rejected:  { subject: 'Booking Update',        msg: `Unfortunately, we're unable to accommodate booking <strong>${booking.booking_ref}</strong> on the requested date.` },
  };
  const info = statusMessages[booking.status] || { subject: 'Booking Update', msg: `Your booking status has been updated to: ${booking.status}` };
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: booking.email,
    subject: info.subject,
    html: baseTemplate(`
      <h2>${info.subject}</h2>
      <p>Hi ${booking.name},</p>
      <p>${info.msg}</p>
      <div class="detail-box">
        <div class="detail-row"><span class="label">Booking Ref</span><span class="value">${booking.booking_ref}</span></div>
        <div class="detail-row"><span class="label">Event Date</span><span class="value">${booking.event_date}</span></div>
        <div class="detail-row"><span class="label">Status</span><span class="value">${booking.status.toUpperCase()}</span></div>
      </div>
      <a href="${process.env.FRONTEND_URL}/bookings" class="btn">View Booking</a>
    `),
  });
};

const sendOrderConfirmation = async (order) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: order.email,
    subject: `Order Confirmed — ${order.order_ref}`,
    html: baseTemplate(`
      <h2>Your order is confirmed!</h2>
      <p>Hi ${order.name}, thank you for your order.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="label">Order Ref</span><span class="value">${order.order_ref}</span></div>
        <div class="detail-row"><span class="label">Event Date</span><span class="value">${order.event_date}</span></div>
        <div class="detail-row"><span class="label">Total</span><span class="value">$${order.total}</span></div>
        <div class="detail-row"><span class="label">Status</span><span class="value">Confirmed</span></div>
      </div>
    `),
  });
};

module.exports = { sendWelcomeEmail, sendBookingConfirmation, sendBookingStatusUpdate, sendOrderConfirmation };
