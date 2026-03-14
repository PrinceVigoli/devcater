import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { menuAPI, bookingAPI, orderAPI, galleryAPI, customerAPI, paymentAPI, blogAPI } from './services/api';

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
  :root {
    --orange:#E8682A; --orange-light:#F2845A; --orange-pale:#FDE8D8;
    --cream:#FBF6EF; --brown:#3D2314; --brown-mid:#6B3A1F;
    --white:#FFFFFF; --gray:#8A7968; --gray-light:#F0EBE3;
    --shadow:0 4px 24px rgba(61,35,20,.10); --shadow-lg:0 12px 48px rgba(61,35,20,.15);
  }
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'DM Sans',sans-serif;background:var(--white);color:var(--brown);overflow-x:hidden}
  h1,h2,h3,h4{font-family:'Playfair Display',serif}
  ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-track{background:var(--cream)} ::-webkit-scrollbar-thumb{background:var(--orange-light);border-radius:3px}

  /* NAV */
  .nav{position:fixed;top:0;left:0;right:0;z-index:1000;padding:20px 60px;display:flex;align-items:center;justify-content:space-between;transition:all .4s}
  .nav.scrolled{background:rgba(251,246,239,.96);backdrop-filter:blur(20px);padding:14px 60px;box-shadow:var(--shadow)}
  .nav-logo{font-family:'Playfair Display',serif;font-size:26px;font-weight:700;color:#fff;cursor:pointer}
  .nav.scrolled .nav-logo{color:var(--brown)}
  .nav-links{display:flex;gap:36px}
  .nav-links a{color:rgba(255,255,255,.9);text-decoration:none;font-size:15px;font-weight:500;cursor:pointer;transition:color .2s}
  .nav.scrolled .nav-links a{color:var(--brown)}
  .nav-links a:hover{color:var(--orange-light)}
  .nav-cta{background:var(--orange);color:#fff;padding:10px 24px;border-radius:50px;border:none;cursor:pointer;font-size:14px;font-weight:600;transition:all .2s;font-family:'DM Sans',sans-serif}
  .nav-cta:hover{background:var(--orange-light);transform:translateY(-1px)}
  .nav-user{display:flex;align-items:center;gap:12px}
  .nav-user-name{font-size:14px;font-weight:600;color:var(--brown)}
  .nav-logout{background:transparent;border:1px solid var(--gray-light);color:var(--gray);padding:8px 18px;border-radius:50px;cursor:pointer;font-size:13px;font-family:'DM Sans',sans-serif;transition:all .2s}
  .nav-logout:hover{border-color:var(--orange);color:var(--orange)}

  /* HERO */
  .hero{height:100vh;min-height:700px;background:linear-gradient(135deg,rgba(61,35,20,.7) 0%,rgba(107,58,31,.4) 100%),url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=90') center/cover no-repeat;display:flex;align-items:center;justify-content:center;text-align:center;position:relative}
  .hero::after{content:'';position:absolute;bottom:0;left:0;right:0;height:120px;background:linear-gradient(to top,var(--white),transparent)}
  .hero-content{position:relative;z-index:2;padding:0 20px}
  .hero-eyebrow{display:inline-block;background:rgba(232,104,42,.25);border:1px solid rgba(232,104,42,.5);color:#FFB38A;font-size:13px;font-weight:600;letter-spacing:3px;text-transform:uppercase;padding:8px 20px;border-radius:50px;margin-bottom:28px;backdrop-filter:blur(8px)}
  .hero h1{font-size:clamp(42px,7vw,84px);color:#fff;font-weight:900;line-height:1.05;margin-bottom:24px;letter-spacing:-2px}
  .hero h1 span{color:var(--orange-light)}
  .hero-sub{font-size:18px;color:rgba(255,255,255,.8);max-width:560px;margin:0 auto 44px;line-height:1.7;font-weight:300}
  .hero-btns{display:flex;gap:16px;justify-content:center;flex-wrap:wrap}
  .btn-primary{background:var(--orange);color:#fff;padding:16px 36px;border-radius:50px;border:none;cursor:pointer;font-size:16px;font-weight:600;transition:all .25s;font-family:'DM Sans',sans-serif}
  .btn-primary:hover{background:var(--orange-light);transform:translateY(-2px);box-shadow:0 8px 24px rgba(232,104,42,.4)}
  .btn-outline{background:transparent;color:#fff;padding:16px 36px;border-radius:50px;border:2px solid rgba(255,255,255,.6);cursor:pointer;font-size:16px;font-weight:600;transition:all .25s;font-family:'DM Sans',sans-serif}
  .btn-outline:hover{border-color:#fff;background:rgba(255,255,255,.1);transform:translateY(-2px)}

  /* SECTIONS */
  .section{padding:100px 60px} .section-sm{padding:70px 60px}
  .section-eyebrow{font-size:12px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:var(--orange);margin-bottom:16px}
  .section-title{font-size:clamp(32px,4vw,52px);font-weight:700;color:var(--brown);line-height:1.1;letter-spacing:-1px}
  .section-sub{font-size:17px;color:var(--gray);line-height:1.7;max-width:560px;margin-top:16px}
  .section-header{text-align:center;margin-bottom:64px} .section-header .section-sub{margin:16px auto 0}
  .menu-bg{background:var(--cream)} .gallery-bg{background:var(--cream)}

  /* SERVICES */
  .services-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:28px;max-width:1200px;margin:0 auto}
  .service-card{border-radius:20px;overflow:hidden;box-shadow:var(--shadow);transition:all .35s;cursor:pointer;background:#fff}
  .service-card:hover{transform:translateY(-8px);box-shadow:var(--shadow-lg)}
  .service-card-img{height:200px;overflow:hidden} .service-card-img img{width:100%;height:100%;object-fit:cover;transition:transform .5s}
  .service-card:hover .service-card-img img{transform:scale(1.08)}
  .service-card-body{padding:24px} .service-icon{font-size:28px;margin-bottom:12px}
  .service-card h3{font-size:20px;font-weight:700;margin-bottom:8px;color:var(--brown)}
  .service-card p{font-size:14px;color:var(--gray);line-height:1.6;margin-bottom:16px}
  .service-link{color:var(--orange);font-size:14px;font-weight:600;cursor:pointer}

  /* MENU */
  .menu-tabs{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:48px}
  .menu-tab{padding:10px 24px;border-radius:50px;border:2px solid var(--gray-light);background:#fff;color:var(--brown);font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;font-family:'DM Sans',sans-serif}
  .menu-tab.active,.menu-tab:hover{background:var(--orange);border-color:var(--orange);color:#fff}
  .menu-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:24px;max-width:1200px;margin:0 auto}
  .menu-card{background:#fff;border-radius:18px;overflow:hidden;box-shadow:var(--shadow);transition:all .3s}
  .menu-card:hover{transform:translateY(-5px);box-shadow:var(--shadow-lg)}
  .menu-card-img{height:180px;overflow:hidden;position:relative}
  .menu-card-img img{width:100%;height:100%;object-fit:cover;transition:transform .4s}
  .menu-card:hover .menu-card-img img{transform:scale(1.06)}
  .menu-cat-badge{position:absolute;top:12px;left:12px;background:var(--orange);color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:50px;letter-spacing:1px;text-transform:uppercase}
  .menu-card-body{padding:20px}
  .menu-card h3{font-size:18px;font-weight:700;color:var(--brown);margin-bottom:6px}
  .menu-card p{font-size:13px;color:var(--gray);line-height:1.5;margin-bottom:16px}
  .menu-card-footer{display:flex;align-items:center;justify-content:space-between}
  .menu-price{font-size:22px;font-weight:700;color:var(--orange);font-family:'Playfair Display',serif}
  .add-btn{background:var(--orange-pale);color:var(--orange);border:none;padding:8px 18px;border-radius:50px;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;font-family:'DM Sans',sans-serif}
  .add-btn:hover{background:var(--orange);color:#fff}
  .loading-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:24px;max-width:1200px;margin:0 auto}
  .skeleton{background:linear-gradient(90deg,#f0ebe3 25%,#fde8d8 50%,#f0ebe3 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:18px;height:280px}
  @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

  /* ABOUT */
  .about-grid{display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center;max-width:1200px;margin:0 auto}
  .about-img-wrap{position:relative} .about-img-wrap img{width:100%;border-radius:24px;box-shadow:var(--shadow-lg)}
  .about-badge{position:absolute;bottom:-20px;right:-20px;background:var(--orange);color:#fff;padding:20px 28px;border-radius:16px;text-align:center;box-shadow:var(--shadow-lg)}
  .about-badge strong{display:block;font-size:36px;font-family:'Playfair Display',serif} .about-badge span{font-size:12px;font-weight:600;letter-spacing:1px}
  .about-features{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:36px}
  .about-feat{display:flex;gap:14px;align-items:flex-start}
  .about-feat-icon{width:44px;height:44px;border-radius:12px;background:var(--orange-pale);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
  .about-feat h4{font-size:15px;font-weight:600;color:var(--brown);margin-bottom:3px;font-family:'DM Sans',sans-serif}
  .about-feat p{font-size:13px;color:var(--gray);line-height:1.5}

  /* GALLERY */
  .gallery-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;max-width:1200px;margin:0 auto}
  .gallery-item{border-radius:16px;overflow:hidden;cursor:pointer;position:relative;aspect-ratio:4/3}
  .gallery-item img{width:100%;height:100%;object-fit:cover;transition:transform .5s}
  .gallery-item:hover img{transform:scale(1.06)}
  .gallery-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(61,35,20,.7) 0%,transparent 60%);opacity:0;transition:opacity .3s;display:flex;align-items:flex-end;padding:20px}
  .gallery-item:hover .gallery-overlay{opacity:1} .gallery-overlay span{color:#fff;font-size:14px;font-weight:600}
  .lightbox{position:fixed;inset:0;z-index:9999;background:rgba(20,10,5,.92);display:flex;align-items:center;justify-content:center;padding:20px}
  .lightbox img{max-width:90vw;max-height:85vh;border-radius:12px}
  .lightbox-close{position:absolute;top:24px;right:32px;color:#fff;font-size:36px;cursor:pointer}

  /* TESTIMONIALS */
  .testimonials-track{display:flex;gap:28px;max-width:1200px;margin:0 auto;overflow-x:auto;padding-bottom:8px}
  .testimonial-card{min-width:320px;flex:1;background:#fff;border-radius:20px;padding:32px;box-shadow:var(--shadow);border-top:3px solid var(--orange)}
  .test-stars{color:#F59E0B;font-size:16px;margin-bottom:16px}
  .test-text{font-size:15px;color:var(--gray);line-height:1.7;margin-bottom:24px;font-style:italic}
  .test-author{display:flex;align-items:center;gap:14px}
  .test-author img{width:48px;height:48px;border-radius:50%;object-fit:cover}
  .test-author strong{display:block;font-size:15px;color:var(--brown);font-family:'DM Sans',sans-serif} .test-author span{font-size:13px;color:var(--gray)}

  /* BOOKING FORM */
  .booking-bg{background:linear-gradient(135deg,var(--brown) 0%,var(--brown-mid) 100%)}
  .booking-wrap{max-width:760px;margin:0 auto}
  .booking-bg .section-title{color:#fff} .booking-bg .section-sub{color:rgba(255,255,255,.7)} .booking-bg .section-eyebrow{color:var(--orange-light)}
  .booking-form{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:40px}
  .booking-form .full{grid-column:1/-1}
  .form-group{display:flex;flex-direction:column;gap:8px}
  .form-group label{font-size:13px;font-weight:600;color:rgba(255,255,255,.8);letter-spacing:.5px}
  .form-group input,.form-group select,.form-group textarea{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#fff;padding:14px 18px;border-radius:12px;font-size:15px;font-family:'DM Sans',sans-serif;transition:all .2s;outline:none}
  .form-group input::placeholder,.form-group textarea::placeholder{color:rgba(255,255,255,.4)}
  .form-group input:focus,.form-group select:focus,.form-group textarea:focus{border-color:var(--orange-light);background:rgba(255,255,255,.15)}
  .form-group select option{background:var(--brown);color:#fff}
  .form-group textarea{resize:vertical;min-height:120px}
  .form-submit{width:100%;padding:18px;background:var(--orange);color:#fff;border:none;border-radius:50px;font-size:17px;font-weight:700;cursor:pointer;margin-top:8px;transition:all .25s;font-family:'DM Sans',sans-serif}
  .form-submit:hover{background:var(--orange-light);transform:translateY(-2px)}
  .form-submit:disabled{opacity:.6;cursor:not-allowed;transform:none}

  /* FOOTER */
  .footer{background:var(--brown);color:rgba(255,255,255,.7);padding:60px 60px 30px}
  .footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:48px;margin-bottom:48px}
  .footer-logo{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:#fff;margin-bottom:16px}
  .footer-about{font-size:14px;line-height:1.7}
  .footer-col h4{color:#fff;font-size:15px;font-weight:600;margin-bottom:18px;font-family:'DM Sans',sans-serif}
  .footer-col ul{list-style:none;display:flex;flex-direction:column;gap:10px}
  .footer-col ul li{font-size:14px;cursor:pointer;transition:color .2s} .footer-col ul li:hover{color:var(--orange-light)}
  .footer-bottom{border-top:1px solid rgba(255,255,255,.1);padding-top:24px;display:flex;justify-content:space-between;font-size:13px}
  .footer-admin-link{color:var(--orange-light);cursor:pointer}

  /* CART */
  .cart-badge{position:fixed;bottom:30px;right:30px;z-index:900;background:var(--orange);color:#fff;border:none;border-radius:50px;padding:14px 24px;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 6px 24px rgba(232,104,42,.45);display:flex;align-items:center;gap:10px;transition:all .2s;font-family:'DM Sans',sans-serif}
  .cart-badge:hover{transform:translateY(-2px)}

  /* MODALS */
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:2000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px)}
  .modal{background:#fff;border-radius:24px;padding:36px;max-width:500px;width:100%;box-shadow:0 24px 80px rgba(0,0,0,.25);position:relative}
  .modal h2{font-size:26px;color:var(--brown);margin-bottom:6px} .modal>p{color:var(--gray);font-size:15px;margin-bottom:28px}
  .modal-close{position:absolute;top:20px;right:24px;font-size:24px;cursor:pointer;color:var(--gray);background:none;border:none}
  .modal-input{width:100%;padding:14px 18px;border:2px solid var(--gray-light);border-radius:12px;font-size:15px;font-family:'DM Sans',sans-serif;outline:none;color:var(--brown);margin-bottom:14px;transition:border .2s}
  .modal-input:focus{border-color:var(--orange)}
  .modal-btn{width:100%;padding:15px;background:var(--orange);color:#fff;border:none;border-radius:50px;font-size:16px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s}
  .modal-btn:hover{background:var(--orange-light)} .modal-btn:disabled{opacity:.6;cursor:not-allowed}
  .modal-link{text-align:center;margin-top:16px;font-size:14px;color:var(--gray)}
  .modal-link span{color:var(--orange);cursor:pointer;font-weight:600}
  .modal-error{color:#EF4444;font-size:13px;margin-bottom:12px;text-align:center}

  /* NOTIFICATION */
  .notif{position:fixed;bottom:90px;right:30px;z-index:3000;background:var(--brown);color:#fff;padding:14px 24px;border-radius:12px;font-size:14px;font-weight:500;box-shadow:var(--shadow-lg);animation:slideup .3s ease}
  @keyframes slideup{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}

  /* DASHBOARD */
  .dashboard-wrap{max-width:900px;margin:0 auto;padding:120px 60px 60px}
  .dashboard-title{font-size:36px;font-weight:700;color:var(--brown);margin-bottom:8px}
  .dashboard-sub{color:var(--gray);font-size:16px;margin-bottom:40px}
  .dashboard-tabs{display:flex;gap:8px;margin-bottom:32px;flex-wrap:wrap}
  .dashboard-tab{padding:10px 20px;border-radius:10px;border:2px solid var(--gray-light);background:#fff;color:var(--brown);font-size:14px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s}
  .dashboard-tab.active,.dashboard-tab:hover{background:var(--orange);border-color:var(--orange);color:#fff}
  .booking-list{display:flex;flex-direction:column;gap:16px}
  .booking-item{background:#fff;border-radius:16px;padding:20px 24px;box-shadow:var(--shadow);display:flex;justify-content:space-between;align-items:center;border-left:4px solid var(--orange)}
  .booking-item-info h4{font-size:16px;font-weight:700;color:var(--brown);margin-bottom:4px;font-family:'DM Sans',sans-serif}
  .booking-item-info p{font-size:13px;color:var(--gray)}
  .status-badge{padding:4px 12px;border-radius:50px;font-size:12px;font-weight:700;display:inline-block}
  .status-pending{background:#FEF9C3;color:#854D0E} .status-confirmed{background:#DCFCE7;color:#15803D}
  .status-rejected{background:#FEE2E2;color:#B91C1C} .status-cancelled{background:var(--gray-light);color:var(--gray)}
  .empty-state{text-align:center;padding:60px 20px;color:var(--gray)}
  .empty-state h3{font-size:22px;color:var(--brown);margin-bottom:8px}

  /* ADMIN */
  .admin-wrap{display:flex;min-height:100vh;background:#F8F5F1;font-family:'DM Sans',sans-serif}
  .admin-sidebar{width:260px;background:var(--brown);color:#fff;display:flex;flex-direction:column;flex-shrink:0}
  .admin-sidebar-header{padding:28px 24px 20px;border-bottom:1px solid rgba(255,255,255,.1)}
  .admin-logo{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:#fff}
  .admin-badge-pill{font-size:11px;background:var(--orange);color:#fff;padding:2px 10px;border-radius:50px;margin-top:4px;display:inline-block}
  .admin-nav{flex:1;padding:20px 12px;display:flex;flex-direction:column;gap:4px}
  .admin-nav-item{display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:12px;cursor:pointer;transition:all .2s;font-size:14px;font-weight:500;color:rgba(255,255,255,.7)}
  .admin-nav-item:hover{background:rgba(255,255,255,.1);color:#fff} .admin-nav-item.active{background:var(--orange);color:#fff}
  .admin-nav-icon{font-size:18px}
  .admin-main{flex:1;overflow-y:auto}
  .admin-topbar{background:#fff;padding:16px 32px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 1px 8px rgba(0,0,0,.06)}
  .admin-topbar-title{font-size:22px;font-weight:700;color:var(--brown);font-family:'Playfair Display',serif}
  .admin-topbar-user{display:flex;align-items:center;gap:12px}
  .admin-avatar{width:38px;height:38px;border-radius:50%;background:var(--orange);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:16px}
  .admin-content{padding:32px}
  .stat-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-bottom:32px}
  .stat-card{background:#fff;border-radius:18px;padding:24px;box-shadow:var(--shadow);border-left:4px solid transparent}
  .stat-card.orange{border-left-color:var(--orange)} .stat-card.green{border-left-color:#22C55E}
  .stat-card.blue{border-left-color:#3B82F6} .stat-card.purple{border-left-color:#A855F7}
  .stat-label{font-size:13px;color:var(--gray);font-weight:500;margin-bottom:10px}
  .stat-value{font-size:32px;font-weight:700;color:var(--brown);font-family:'Playfair Display',serif;margin-bottom:4px}
  .stat-trend{font-size:12px;color:#22C55E;font-weight:600}
  .admin-table-wrap{background:#fff;border-radius:18px;padding:24px;box-shadow:var(--shadow);margin-bottom:24px}
  .admin-table-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
  .admin-table-title{font-size:18px;font-weight:700;color:var(--brown);font-family:'Playfair Display',serif}
  .admin-search{padding:10px 16px;border:2px solid var(--gray-light);border-radius:10px;font-size:14px;font-family:'DM Sans',sans-serif;outline:none;color:var(--brown);width:220px}
  .admin-search:focus{border-color:var(--orange)}
  table{width:100%;border-collapse:collapse}
  th{text-align:left;font-size:12px;font-weight:700;color:var(--gray);text-transform:uppercase;letter-spacing:1px;padding:12px 16px;border-bottom:2px solid var(--gray-light)}
  td{padding:14px 16px;font-size:14px;color:var(--brown);border-bottom:1px solid var(--gray-light)}
  tr:last-child td{border-bottom:none} tr:hover td{background:var(--cream)}
  .status-active{background:#DBEAFE;color:#1D4ED8} .status-suspended{background:#FEE2E2;color:#B91C1C}
  .status-inactive{background:var(--gray-light);color:var(--gray)}
  .action-btn{padding:6px 14px;border-radius:8px;border:none;cursor:pointer;font-size:12px;font-weight:600;margin-right:6px;font-family:'DM Sans',sans-serif;transition:all .2s}
  .action-edit{background:var(--orange-pale);color:var(--orange)} .action-edit:hover{background:var(--orange);color:#fff}
  .action-delete{background:#FEE2E2;color:#B91C1C} .action-delete:hover{background:#B91C1C;color:#fff}
  .action-view{background:#DBEAFE;color:#1D4ED8} .action-view:hover{background:#1D4ED8;color:#fff}
  .admin-add-btn{background:var(--orange);color:#fff;border:none;padding:10px 20px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:6px;transition:all .2s}
  .admin-add-btn:hover{background:var(--orange-light)}
  .chart-bars{display:flex;align-items:flex-end;gap:8px;height:120px;padding:0 8px}
  .chart-bar{flex:1;background:linear-gradient(to top,var(--orange),var(--orange-light));border-radius:6px 6px 0 0;min-width:20px;transition:opacity .2s} .chart-bar:hover{opacity:.75}
  .chart-labels{display:flex;gap:8px;padding:8px 8px 0}
  .chart-label{flex:1;text-align:center;font-size:11px;color:var(--gray)}

  @media(max-width:768px){
    .nav{padding:16px 20px} .nav.scrolled{padding:12px 20px} .nav-links{display:none}
    .section,.section-sm{padding:70px 20px}
    .about-grid{grid-template-columns:1fr;gap:40px} .about-badge{display:none}
    .gallery-grid{grid-template-columns:repeat(2,1fr)}
    .booking-form{grid-template-columns:1fr}
    .footer-grid{grid-template-columns:1fr 1fr}
    .stat-cards{grid-template-columns:1fr 1fr}
    .admin-sidebar{width:60px} .admin-nav-item span{display:none} .admin-logo,.admin-badge-pill{display:none}
    .dashboard-wrap{padding:100px 20px 60px}
  }
`;

// ─── STATIC DATA (fallback if API fails) ──────────────────────────────────────
const SERVICES = [
  { title:'Wedding Catering',  desc:'Exquisite dining for your most memorable day',      icon:'💍', image:'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=500&q=80' },
  { title:'Corporate Events',  desc:'Impress clients with refined business catering',    icon:'🏢', image:'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=500&q=80' },
  { title:'Birthday Parties',  desc:'Celebrate milestones with custom menus and flair', icon:'🎂', image:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80' },
  { title:'Private Events',    desc:'Intimate gatherings crafted to your exact vision',  icon:'🥂', image:'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=500&q=80' },
  { title:'Buffet Catering',   desc:'Abundant spreads for large-scale celebrations',     icon:'🍽️', image:'https://images.unsplash.com/photo-1555244162-803834f70033?w=500&q=80' },
];
const TESTIMONIALS = [
  { name:'Sarah Mitchell', role:'Bride',          rating:5, text:'Absolutely flawless service. Every guest complimented the food — our wedding was unforgettable.', avatar:'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80' },
  { name:'James Chen',    role:'CEO, TechCorp',  rating:5, text:'We've used Saffron for three corporate retreats. Consistently exceptional quality and professionalism.', avatar:'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80' },
  { name:'Maria Rodriguez',role:'Event Planner', rating:5, text:'My go-to catering partner. The attention to detail and flavor profiles are simply world-class.', avatar:'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80' },
  { name:'David Park',    role:'Birthday Host',  rating:5, text:'They turned my 50th into a culinary journey. Simply magical.', avatar:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80' },
];
const GALLERY_LABELS = ['Wedding Reception','Gala Dinner','Buffet Spread','Private Event','Seafood Bar','Formal Dinner'];
const STATIC_GALLERY = [
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=80',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80',
  'https://images.unsplash.com/photo-1555244162-803834f70033?w=600&q=80',
  'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&q=80',
  'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80',
  'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80',
];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const ADMIN_SECTIONS = [
  { id:'dashboard', label:'Dashboard',  icon:'📊' },
  { id:'bookings',  label:'Bookings',   icon:'📅' },
  { id:'menu',      label:'Menu',       icon:'🍽️' },
  { id:'customers', label:'Customers',  icon:'👥' },
  { id:'payments',  label:'Payments',   icon:'💳' },
  { id:'gallery',   label:'Gallery',    icon:'🖼️' },
  { id:'blog',      label:'Blog Posts', icon:'📝' },
];

// ─── TINY COMPONENTS ──────────────────────────────────────────────────────────
const Notification = ({ msg }) => msg ? <div className="notif">✓ {msg}</div> : null;
const Spinner = () => <div style={{textAlign:'center',padding:'40px',color:'var(--gray)',fontSize:'28px'}}>⏳</div>;

// ─── NAV ─────────────────────────────────────────────────────────────────────
function NavBar({ scrolled, onAdmin, onLoginClick, onDashboard }) {
  const { user, logout } = useAuth();
  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior:'smooth' });
  return (
    <nav className={`nav ${scrolled?'scrolled':''}`}>
      <div className="nav-logo">✦ Saffron</div>
      <div className="nav-links">
        <a onClick={()=>go('home')}>Home</a>
        <a onClick={()=>go('services')}>Services</a>
        <a onClick={()=>go('menu')}>Menu</a>
        <a onClick={()=>go('gallery')}>Gallery</a>
        <a onClick={()=>go('contact')}>Contact</a>
      </div>
      {user ? (
        <div className="nav-user">
          <span className="nav-user-name" style={{cursor:'pointer'}} onClick={onDashboard}>👤 {user.name.split(' ')[0]}</span>
          {user.role==='admin' && <button className="nav-cta" onClick={onAdmin}>Admin</button>}
          <button className="nav-logout" onClick={logout}>Logout</button>
        </div>
      ) : (
        <button className="nav-cta" onClick={onLoginClick}>Sign In</button>
      )}
    </nav>
  );
}

// ─── HERO ────────────────────────────────────────────────────────────────────
function HeroSection() {
  const go=(id)=>document.getElementById(id)?.scrollIntoView({behavior:'smooth'});
  return (
    <section id="home" className="hero">
      <div className="hero-content">
        <div className="hero-eyebrow">Est. 2010 · Award-Winning Catering</div>
        <h1>Premium Catering<br/>for <span>Every</span> Occasion</h1>
        <p className="hero-sub">High-quality catering services for weddings, corporate events, and private celebrations — crafted with passion by our master chefs.</p>
        <div className="hero-btns">
          <button className="btn-primary" onClick={()=>go('menu')}>View Menu</button>
          <button className="btn-outline" onClick={()=>go('contact')}>Book Catering</button>
        </div>
      </div>
    </section>
  );
}

// ─── SERVICES ────────────────────────────────────────────────────────────────
function ServicesSection() {
  return (
    <section id="services" className="section">
      <div className="section-header">
        <p className="section-eyebrow">What We Offer</p>
        <h2 className="section-title">Catering for Every Event</h2>
        <p className="section-sub">From intimate gatherings to grand celebrations, we craft unforgettable culinary experiences.</p>
      </div>
      <div className="services-grid">
        {SERVICES.map(s=>(
          <div className="service-card" key={s.title}>
            <div className="service-card-img"><img src={s.image} alt={s.title} loading="lazy"/></div>
            <div className="service-card-body">
              <div className="service-icon">{s.icon}</div>
              <h3>{s.title}</h3><p>{s.desc}</p>
              <div className="service-link">Learn More →</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── MENU (Live from API) ─────────────────────────────────────────────────────
function MenuSection({ cart, setCart, notify }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('All');
  const cats = ['All','Appetizers','Main Courses','Desserts','Beverages','Catering Packages'];

  useEffect(()=>{
    menuAPI.getAll({ status:'active' })
      .then(({data})=>setItems(data))
      .catch(()=>{
        // Fallback static data if backend not running
        setItems([
          {id:1,category:'Appetizers',name:'Bruschetta Trio',description:'Tomato, pesto & mushroom on toasted ciabatta',price:12,image:'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400&q=80'},
          {id:2,category:'Main Courses',name:'Beef Tenderloin',description:'Pan-seared with truffle butter & seasonal vegetables',price:45,image:'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80'},
          {id:3,category:'Desserts',name:'Chocolate Fondant',description:'Warm dark chocolate with vanilla bean ice cream',price:14,image:'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&q=80'},
          {id:4,category:'Beverages',name:'Sparkling Lemonade',description:'Fresh-squeezed with lavender syrup & mint',price:8,image:'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80'},
          {id:5,category:'Main Courses',name:'Pan-Roasted Salmon',description:'Atlantic salmon with lemon caper beurre blanc',price:38,image:'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&q=80'},
          {id:6,category:'Desserts',name:'Crème Brûlée',description:'Classic French custard with caramelized sugar',price:12,image:'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=400&q=80'},
        ]);
      })
      .finally(()=>setLoading(false));
  },[]);

  const filtered = tab==='All' ? items : items.filter(m=>m.category===tab);
  const addToCart = (item)=>{
    setCart(c=>{
      const ex=c.find(i=>i.id===item.id);
      if(ex) return c.map(i=>i.id===item.id?{...i,qty:i.qty+1}:i);
      return [...c,{...item,qty:1}];
    });
    notify(`${item.name} added to order!`);
  };

  return (
    <section id="menu" className="section menu-bg">
      <div className="section-header">
        <p className="section-eyebrow">Our Menu</p>
        <h2 className="section-title">Seasonal & Artisan Selections</h2>
        <p className="section-sub">Each dish is crafted from locally sourced ingredients and prepared fresh for your event.</p>
      </div>
      <div className="menu-tabs">
        {cats.map(c=><button key={c} className={`menu-tab${tab===c?' active':''}`} onClick={()=>setTab(c)}>{c}</button>)}
      </div>
      {loading ? (
        <div className="loading-grid">{[1,2,3,4].map(i=><div key={i} className="skeleton"/>)}</div>
      ) : (
        <div className="menu-grid">
          {filtered.map(item=>(
            <div className="menu-card" key={item.id}>
              <div className="menu-card-img">
                <img src={item.image||`https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80`} alt={item.name} loading="lazy"/>
                <span className="menu-cat-badge">{item.category}</span>
              </div>
              <div className="menu-card-body">
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <div className="menu-card-footer">
                  <span className="menu-price">${item.price}</span>
                  <button className="add-btn" onClick={()=>addToCart(item)}>+ Add</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── ABOUT ───────────────────────────────────────────────────────────────────
function AboutSection() {
  return (
    <section id="about" className="section">
      <div className="about-grid">
        <div className="about-img-wrap">
          <img src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=700&q=80" alt="Chef team"/>
          <div className="about-badge"><strong>15+</strong><span>YEARS OF EXCELLENCE</span></div>
        </div>
        <div>
          <p className="section-eyebrow">Our Story</p>
          <h2 className="section-title">Crafted with Passion, Served with Pride</h2>
          <p className="section-sub">Founded in 2010, Saffron Catering has grown from a family kitchen into one of the region's most celebrated catering companies.</p>
          <div className="about-features">
            {[['🌿','Fresh Ingredients','Locally sourced, seasonal produce in every dish'],['👨‍🍳','Master Chefs','Trained at Michelin-starred restaurants worldwide'],['⭐','Award-Winning','Best Catering Service 2023, regional awards'],['🎯','Tailored Service','Every menu customized to your vision']].map(([icon,title,desc])=>(
              <div className="about-feat" key={title}><div className="about-feat-icon">{icon}</div><div><h4>{title}</h4><p>{desc}</p></div></div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── GALLERY (Live from API) ──────────────────────────────────────────────────
function GallerySection() {
  const [images, setImages] = useState([]);
  const [lightbox, setLightbox] = useState(null);

  useEffect(()=>{
    galleryAPI.getAll()
      .then(({data})=>setImages(data.map(g=>({ src: `http://localhost:5000${g.filename}`, title: g.title||'Event' }))))
      .catch(()=>setImages(STATIC_GALLERY.map((src,i)=>({ src, title: GALLERY_LABELS[i] }))));
  },[]);

  const imgs = images.length ? images : STATIC_GALLERY.map((src,i)=>({ src, title: GALLERY_LABELS[i] }));

  return (
    <section id="gallery" className="section gallery-bg">
      <div className="section-header">
        <p className="section-eyebrow">Event Gallery</p>
        <h2 className="section-title">Moments We've Created</h2>
        <p className="section-sub">A glimpse into the exceptional events we've had the privilege of catering.</p>
      </div>
      <div className="gallery-grid">
        {imgs.map((img,i)=>(
          <div className="gallery-item" key={i} onClick={()=>setLightbox(img.src)}>
            <img src={img.src} alt={img.title} loading="lazy"/>
            <div className="gallery-overlay"><span>{img.title}</span></div>
          </div>
        ))}
      </div>
      {lightbox&&(
        <div className="lightbox" onClick={()=>setLightbox(null)}>
          <button className="lightbox-close" onClick={()=>setLightbox(null)}>×</button>
          <img src={lightbox} alt="Gallery" onClick={e=>e.stopPropagation()}/>
        </div>
      )}
    </section>
  );
}

// ─── TESTIMONIALS ─────────────────────────────────────────────────────────────
function TestimonialsSection() {
  return (
    <section id="testimonials" className="section">
      <div className="section-header">
        <p className="section-eyebrow">Testimonials</p>
        <h2 className="section-title">Words from Our Clients</h2>
        <p className="section-sub">The stories our clients share inspire us to keep raising the bar.</p>
      </div>
      <div className="testimonials-track">
        {TESTIMONIALS.map((t,i)=>(
          <div className="testimonial-card" key={i}>
            <div className="test-stars">{'★'.repeat(t.rating)}</div>
            <p className="test-text">"{t.text}"</p>
            <div className="test-author">
              <img src={t.avatar} alt={t.name}/>
              <div><strong>{t.name}</strong><span>{t.role}</span></div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── BOOKING FORM (Saves to DB) ───────────────────────────────────────────────
function BookingSection({ notify }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ name:user?.name||'', email:user?.email||'', phone:'', event:'', date:'', guests:'', message:'' });
  const [submitting, setSubmitting] = useState(false);
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { booking_ref } = await bookingAPI.submit({ name:form.name, email:form.email, phone:form.phone, event_type:form.event, event_date:form.date, guest_count:form.guests, message:form.message });
      notify(`Booking submitted! Your ref: ${booking_ref}`);
      setForm({ name:'', email:'', phone:'', event:'', date:'', guests:'', message:'' });
    } catch (err) {
      notify(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="section booking-bg">
      <div className="booking-wrap">
        <div className="section-header">
          <p className="section-eyebrow">Get in Touch</p>
          <h2 className="section-title">Request a Catering Quote</h2>
          <p className="section-sub">Tell us about your event and we'll craft a personalized proposal just for you.</p>
        </div>
        <form onSubmit={submit} className="booking-form">
          <div className="form-group"><label>Full Name</label><input value={form.name} onChange={set('name')} placeholder="John Smith" required/></div>
          <div className="form-group"><label>Email Address</label><input type="email" value={form.email} onChange={set('email')} placeholder="john@email.com" required/></div>
          <div className="form-group"><label>Phone Number</label><input value={form.phone} onChange={set('phone')} placeholder="+1 (555) 000-0000"/></div>
          <div className="form-group"><label>Event Type</label>
            <select value={form.event} onChange={set('event')} required>
              <option value="">Select event type</option>
              {['Wedding','Corporate Event','Birthday Party','Private Event','Other'].map(o=><option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Event Date</label><input type="date" value={form.date} onChange={set('date')} required/></div>
          <div className="form-group"><label>Number of Guests</label><input type="number" value={form.guests} onChange={set('guests')} placeholder="e.g. 100" required/></div>
          <div className="form-group full"><label>Message / Special Requests</label><textarea value={form.message} onChange={set('message')} placeholder="Tell us about your vision..."/></div>
          <button type="submit" className="form-submit full" disabled={submitting}>{submitting?'Submitting...':'Request Catering Quote ✦'}</button>
        </form>
      </div>
    </section>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer({ onAdmin }) {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <div className="footer-logo">✦ Saffron</div>
          <p className="footer-about">Award-winning catering services crafted with passion and precision. We bring culinary excellence to every occasion.</p>
        </div>
        <div className="footer-col"><h4>Services</h4><ul>{['Wedding Catering','Corporate Events','Birthday Parties','Private Events','Buffet Catering'].map(s=><li key={s}>{s}</li>)}</ul></div>
        <div className="footer-col"><h4>Company</h4><ul>{['About Us','Our Team','Blog','Careers','Contact'].map(s=><li key={s}>{s}</li>)}</ul></div>
        <div className="footer-col"><h4>Contact</h4><ul><li>📍 123 Culinary Ave, NY</li><li>📞 +1 (555) 123-4567</li><li>✉️ hello@saffron.com</li><li>🕐 Mon-Sat 9am–7pm</li></ul></div>
      </div>
      <div className="footer-bottom">
        <span>© 2025 Saffron Catering. All rights reserved.</span>
        <span className="footer-admin-link" onClick={onAdmin}>Admin Portal →</span>
      </div>
    </footer>
  );
}

// ─── CART MODAL ───────────────────────────────────────────────────────────────
function CartModal({ cart, setCart, onClose, notify }) {
  const { user } = useAuth();
  const total = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const [submitting, setSubmitting] = useState(false);

  const checkout = async () => {
    setSubmitting(true);
    try {
      const payload = { name: user?.name||'Guest', email: user?.email||'guest@guest.com', items: cart.map(i=>({ menu_item_id:i.id, quantity:i.qty })) };
      const { order_ref } = await orderAPI.place(payload);
      setCart([]); onClose();
      notify(`Order placed! Ref: ${order_ref}`);
    } catch (err) {
      notify(`Error: ${err.message}. Please sign in to place orders.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:560}}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Your Order</h2>
        <p>{cart.length} item{cart.length!==1?'s':''} selected</p>
        {cart.length===0
          ? <p style={{color:'var(--gray)',textAlign:'center',padding:'40px 0'}}>Your cart is empty</p>
          : <>
              {cart.map(item=>(
                <div key={item.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid var(--gray-light)'}}>
                  <div><div style={{fontWeight:600,color:'var(--brown)'}}>{item.name}</div><div style={{fontSize:13,color:'var(--gray)'}}>${item.price} each</div></div>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <button onClick={()=>setCart(c=>c.map(i=>i.id===item.id?{...i,qty:Math.max(1,i.qty-1)}:i))} style={{width:28,height:28,border:'1px solid var(--gray-light)',borderRadius:'50%',cursor:'pointer',background:'#fff',fontWeight:700}}>−</button>
                    <span style={{fontWeight:600}}>{item.qty}</span>
                    <button onClick={()=>setCart(c=>c.map(i=>i.id===item.id?{...i,qty:i.qty+1}:i))} style={{width:28,height:28,border:'1px solid var(--gray-light)',borderRadius:'50%',cursor:'pointer',background:'#fff',fontWeight:700}}>+</button>
                    <button onClick={()=>setCart(c=>c.filter(i=>i.id!==item.id))} style={{color:'#EF4444',border:'none',background:'none',cursor:'pointer',fontSize:18}}>×</button>
                  </div>
                </div>
              ))}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:24,marginBottom:20,fontSize:20,fontWeight:700,color:'var(--brown)'}}>
                <span>Total</span><span style={{color:'var(--orange)',fontFamily:'Playfair Display,serif'}}>${total.toLocaleString()}</span>
              </div>
              <button className="modal-btn" onClick={checkout} disabled={submitting}>{submitting?'Placing order...':'Proceed to Checkout →'}</button>
            </>
        }
      </div>
    </div>
  );
}

// ─── LOGIN / REGISTER MODAL ───────────────────────────────────────────────────
function LoginModal({ onClose, notify }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));

  const submit = async () => {
    setError(''); setLoading(true);
    try {
      if (mode==='login') {
        const user = await login(form.email, form.password);
        notify(`Welcome back, ${user.name}!`);
      } else {
        const user = await register(form.name, form.email, form.password, form.phone);
        notify(`Welcome to Saffron, ${user.name}!`);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>{mode==='login'?'Welcome Back':'Create Account'}</h2>
        <p>{mode==='login'?'Sign in to manage your bookings':'Join Saffron for exclusive access'}</p>
        {error && <div className="modal-error">{error}</div>}
        {mode==='register' && <input className="modal-input" placeholder="Full Name" value={form.name} onChange={set('name')}/>}
        <input className="modal-input" placeholder="Email Address" type="email" value={form.email} onChange={set('email')}/>
        {mode==='register' && <input className="modal-input" placeholder="Phone (optional)" value={form.phone} onChange={set('phone')}/>}
        <input className="modal-input" placeholder="Password" type="password" value={form.password} onChange={set('password')} onKeyDown={e=>e.key==='Enter'&&submit()}/>
        <button className="modal-btn" onClick={submit} disabled={loading}>{loading?'Please wait...':(mode==='login'?'Sign In':'Create Account')}</button>
        <div className="modal-link">
          {mode==='login'
            ? <span>Don't have an account? <span onClick={()=>setMode('register')}>Register</span></span>
            : <span>Already have an account? <span onClick={()=>setMode('login')}>Sign In</span></span>}
        </div>
      </div>
    </div>
  );
}

// ─── USER DASHBOARD ───────────────────────────────────────────────────────────
function UserDashboard({ onBack }) {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    Promise.all([bookingAPI.myBookings(), orderAPI.myOrders()])
      .then(([b,o])=>{ setBookings(b.data||[]); setOrders(o.data||[]); })
      .catch(console.error)
      .finally(()=>setLoading(false));
  },[]);

  return (
    <div style={{minHeight:'100vh',background:'var(--cream)'}}>
      <style>{css}</style>
      <div className="dashboard-wrap">
        <button onClick={onBack} style={{background:'none',border:'none',cursor:'pointer',color:'var(--orange)',fontWeight:600,fontSize:14,marginBottom:20,fontFamily:'DM Sans,sans-serif'}}>← Back to Home</button>
        <h1 className="dashboard-title">My Dashboard</h1>
        <p className="dashboard-sub">Welcome back, {user?.name} · {user?.email}</p>
        <div className="dashboard-tabs">
          <button className={`dashboard-tab${tab==='bookings'?' active':''}`} onClick={()=>setTab('bookings')}>📅 My Bookings</button>
          <button className={`dashboard-tab${tab==='orders'?' active':''}`} onClick={()=>setTab('orders')}>🛒 My Orders</button>
        </div>
        {loading ? <Spinner/> : tab==='bookings' ? (
          bookings.length===0
            ? <div className="empty-state"><h3>No bookings yet</h3><p>Submit a booking request from the main page</p></div>
            : <div className="booking-list">{bookings.map(b=>(
                <div className="booking-item" key={b.id}>
                  <div className="booking-item-info">
                    <h4>{b.event_type} · {b.booking_ref}</h4>
                    <p>{b.event_date} · {b.guest_count} guests</p>
                  </div>
                  <span className={`status-badge status-${b.status}`}>{b.status}</span>
                </div>
              ))}</div>
        ) : (
          orders.length===0
            ? <div className="empty-state"><h3>No orders yet</h3><p>Add items from the menu to place an order</p></div>
            : <div className="booking-list">{orders.map(o=>(
                <div className="booking-item" key={o.id}>
                  <div className="booking-item-info">
                    <h4>Order {o.order_ref}</h4>
                    <p>Total: ${o.total} · {o.event_date||'No date set'}</p>
                  </div>
                  <span className={`status-badge status-${o.status}`}>{o.status}</span>
                </div>
              ))}</div>
        )}
      </div>
    </div>
  );
}


// ─── GALLERY UPLOAD MODAL ─────────────────────────────────────────────────────
function GalleryUploadModal({ onClose, onSuccess }) {
  const [file, setFile]       = useState(null);
  const [title, setTitle]     = useState('');
  const [category, setCategory] = useState('General');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const onFile = e => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    if (!file) return setError('Please select an image');
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('title', title);
      fd.append('category', category);
      await galleryAPI.upload(fd);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:480}}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Upload Image</h2>
        <p>Add a photo to the gallery</p>
        {error && <div className="modal-error">{error}</div>}
        <div style={{border:'2px dashed var(--gray-light)',borderRadius:12,padding:24,textAlign:'center',marginBottom:16,cursor:'pointer',background:'var(--cream)'}} onClick={()=>document.getElementById('gallery-file').click()}>
          {preview
            ? <img src={preview} alt="preview" style={{maxHeight:160,borderRadius:8,maxWidth:'100%'}}/>
            : <div><div style={{fontSize:36,marginBottom:8}}>📷</div><div style={{color:'var(--gray)',fontSize:14}}>Click to select image</div></div>
          }
        </div>
        <input id="gallery-file" type="file" accept="image/*" style={{display:'none'}} onChange={onFile}/>
        <input className="modal-input" placeholder="Title (optional)" value={title} onChange={e=>setTitle(e.target.value)}/>
        <select className="modal-input" value={category} onChange={e=>setCategory(e.target.value)} style={{marginBottom:14}}>
          {['General','Wedding','Corporate','Birthday','Private Event','Buffet'].map(c=><option key={c}>{c}</option>)}
        </select>
        <button className="modal-btn" onClick={submit} disabled={loading}>{loading?'Uploading...':'Upload Image'}</button>
      </div>
    </div>
  );
}

// ─── BLOG POST MODAL ──────────────────────────────────────────────────────────
function BlogPostModal({ post, onClose, onSuccess }) {
  const [form, setForm] = useState({
    title:    post?.title    || '',
    content:  post?.content  || '',
    excerpt:  post?.excerpt  || '',
    category: post?.category || '',
    image:    post?.image    || '',
    status:   post?.status   || 'draft',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));

  const submit = async () => {
    if (!form.title || !form.content) return setError('Title and content are required');
    setLoading(true); setError('');
    try {
      if (post) await blogAPI.update(post.id, form);
      else      await blogAPI.create(form);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:600,maxHeight:'90vh',overflowY:'auto'}}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>{post ? 'Edit Post' : 'New Blog Post'}</h2>
        <p>{post ? 'Update this post' : 'Create a new blog post'}</p>
        {error && <div className="modal-error">{error}</div>}
        <input className="modal-input" placeholder="Post Title *" value={form.title} onChange={set('title')}/>
        <input className="modal-input" placeholder="Category (e.g. Tips, Events, Recipes)" value={form.category} onChange={set('category')}/>
        <input className="modal-input" placeholder="Featured Image URL (optional)" value={form.image} onChange={set('image')}/>
        <input className="modal-input" placeholder="Short excerpt / summary" value={form.excerpt} onChange={set('excerpt')}/>
        <textarea className="modal-input" placeholder="Post content *" value={form.content} onChange={set('content')} style={{minHeight:180,resize:'vertical'}}/>
        <select className="modal-input" value={form.status} onChange={set('status')} style={{marginBottom:14}}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
        <button className="modal-btn" onClick={submit} disabled={loading}>
          {loading ? 'Saving...' : (post ? 'Update Post' : 'Create Post')}
        </button>
      </div>
    </div>
  );
}

// ─── MENU ITEM MODAL ──────────────────────────────────────────────────────────
function MenuItemModal({ item, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name:        item?.name        || '',
    description: item?.description || '',
    price:       item?.price       || '',
    category:    item?.category    || 'Appetizers',
    status:      item?.status      || 'active',
  });
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(item?.image || null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));

  const onFile = e => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    if (!form.name || !form.price || !form.category) return setError('Name, price, and category are required');
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => fd.append(k, v));
      if (file) fd.append('image', file);
      if (item) await menuAPI.update(item.id, fd);
      else      await menuAPI.create(fd);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:520}}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>{item ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
        <p>{item ? 'Update this item' : 'Add a new item to the menu'}</p>
        {error && <div className="modal-error">{error}</div>}
        <div style={{border:'2px dashed var(--gray-light)',borderRadius:12,padding:16,textAlign:'center',marginBottom:14,cursor:'pointer',background:'var(--cream)'}} onClick={()=>document.getElementById('menu-file').click()}>
          {preview
            ? <img src={preview} alt="preview" style={{maxHeight:120,borderRadius:8,maxWidth:'100%'}}/>
            : <div><div style={{fontSize:28,marginBottom:4}}>🍽️</div><div style={{color:'var(--gray)',fontSize:13}}>Click to upload image (optional)</div></div>
          }
        </div>
        <input id="menu-file" type="file" accept="image/*" style={{display:'none'}} onChange={onFile}/>
        <input className="modal-input" placeholder="Item Name *" value={form.name} onChange={set('name')}/>
        <input className="modal-input" placeholder="Description" value={form.description} onChange={set('description')}/>
        <input className="modal-input" type="number" placeholder="Price (e.g. 12.99) *" value={form.price} onChange={set('price')}/>
        <select className="modal-input" value={form.category} onChange={set('category')} style={{marginBottom:14}}>
          {['Appetizers','Main Courses','Desserts','Beverages','Catering Packages'].map(c=><option key={c}>{c}</option>)}
        </select>
        <select className="modal-input" value={form.status} onChange={set('status')} style={{marginBottom:14}}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button className="modal-btn" onClick={submit} disabled={loading}>
          {loading ? 'Saving...' : (item ? 'Update Item' : 'Add to Menu')}
        </button>
      </div>
    </div>
  );
}

// ─── ADMIN PANEL ─────────────────────────────────────────────────────────────
function AdminPanel({ onExit }) {
  const { user } = useAuth();
  const [section, setSection] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [payments, setPayments] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [showBlogModal, setShowBlogModal]       = useState(false);
  const [showMenuModal, setShowMenuModal]       = useState(false);
  const [editingBlog, setEditingBlog]           = useState(null);
  const [editingMenu, setEditingMenu]           = useState(null);
  const [modalMsg, setModalMsg]                 = useState('');

  const notify = msg => { setModalMsg(msg); setTimeout(()=>setModalMsg(''), 4000); };

  useEffect(()=>{ loadSection(section); },[section]);

  const loadSection = async(s) => {
    setLoading(true);
    try {
      if(s==='dashboard') { const r=await customerAPI.dashboardStats(); setStats(r.data); }
      else if(s==='bookings') { const r=await bookingAPI.getAll(); setBookings(r.data||[]); }
      else if(s==='menu') { const r=await menuAPI.getAll({}); setMenuItems(r.data||[]); }
      else if(s==='customers') { const r=await customerAPI.getAll(); setCustomers(r.data||[]); }
      else if(s==='payments') { const r=await paymentAPI.getAll(); setPayments(r); }
      else if(s==='gallery') { const r=await galleryAPI.getAll(); setGallery(r.data||[]); }
      else if(s==='blog') { const r=await blogAPI.adminAll(); setBlogPosts(r.data||[]); }
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const renderContent = () => {
    if(loading) return <div className="admin-content"><Spinner/></div>;

    if(section==='dashboard') return (
      <div className="admin-content">
        <div className="stat-cards">
          <div className="stat-card orange"><div className="stat-label">Total Bookings</div><div className="stat-value">{stats?.total_bookings||0}</div><div className="stat-trend">↑ Live from DB</div></div>
          <div className="stat-card green"><div className="stat-label">Total Revenue</div><div className="stat-value">${Number(stats?.total_revenue||0).toLocaleString()}</div><div className="stat-trend">Completed payments</div></div>
          <div className="stat-card blue"><div className="stat-label">Total Customers</div><div className="stat-value">{stats?.total_customers||0}</div><div className="stat-trend">Registered accounts</div></div>
          <div className="stat-card purple"><div className="stat-label">Pending Bookings</div><div className="stat-value">{stats?.pending_bookings||0}</div><div className="stat-trend">Awaiting review</div></div>
        </div>
        {stats?.monthlyBookings?.length>0 && (
          <div className="admin-table-wrap">
            <div className="admin-table-header"><span className="admin-table-title">Monthly Bookings (This Year)</span></div>
            <div className="chart-bars">
              {stats.monthlyBookings.map(m=>{
                const max=Math.max(...stats.monthlyBookings.map(x=>x.count));
                return <div key={m.month} className="chart-bar" style={{height:`${(m.count/max)*100}%`}} title={`${MONTHS[m.month-1]}: ${m.count}`}/>;
              })}
            </div>
            <div className="chart-labels">{stats.monthlyBookings.map(m=><span key={m.month} className="chart-label">{MONTHS[m.month-1]}</span>)}</div>
          </div>
        )}
      </div>
    );

    if(section==='bookings') {
      const filtered = bookings.filter(b=>!search||b.name?.toLowerCase().includes(search.toLowerCase())||b.booking_ref?.includes(search));
      return (
        <div className="admin-content">
          <div className="admin-table-wrap">
            <div className="admin-table-header"><span className="admin-table-title">Event Bookings</span><input className="admin-search" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
            <table><thead><tr><th>Ref</th><th>Customer</th><th>Event</th><th>Date</th><th>Guests</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{filtered.map(b=>(
                <tr key={b.id}>
                  <td style={{fontWeight:600,color:'var(--orange)'}}>{b.booking_ref}</td>
                  <td>{b.name}</td><td>{b.event_type}</td><td>{b.event_date}</td><td>{b.guest_count}</td>
                  <td><span className={`status-badge status-${b.status}`}>{b.status}</span></td>
                  <td>
                    <button className="action-btn action-edit" onClick={async()=>{ await bookingAPI.updateStatus(b.id,{status:b.status==='pending'?'confirmed':'pending'}); loadSection('bookings'); }}>Toggle</button>
                    <button className="action-btn action-delete" onClick={async()=>{ await bookingAPI.delete(b.id); loadSection('bookings'); }}>Delete</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      );
    }

    if(section==='menu') return (
      <div className="admin-content">
        {showMenuModal && <MenuItemModal item={editingMenu} onClose={()=>{ setShowMenuModal(false); setEditingMenu(null); }} onSuccess={()=>{ setShowMenuModal(false); setEditingMenu(null); loadSection('menu'); notify(editingMenu?'Item updated!':'Item created!'); }}/>}
        <div className="admin-table-wrap">
          <div className="admin-table-header">
            <span className="admin-table-title">Menu Items</span>
            <button className="admin-add-btn" onClick={()=>{ setEditingMenu(null); setShowMenuModal(true); }}>+ Add Item</button>
          </div>
          <table><thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{menuItems.map(m=>(
              <tr key={m.id}>
                <td style={{fontWeight:600}}>{m.name}</td><td>{m.category}</td>
                <td style={{fontWeight:600}}>${m.price}</td>
                <td><span className={`status-badge status-${m.status}`}>{m.status}</span></td>
                <td>
                  <button className="action-btn action-edit" onClick={()=>{ setEditingMenu(m); setShowMenuModal(true); }}>Edit</button>
                  <button className="action-btn action-delete" onClick={async()=>{ await menuAPI.delete(m.id); loadSection('menu'); }}>Delete</button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    );

    if(section==='customers') {
      const filtered = customers.filter(c=>!search||c.name?.toLowerCase().includes(search.toLowerCase()));
      return (
        <div className="admin-content">
          <div className="admin-table-wrap">
            <div className="admin-table-header"><span className="admin-table-title">Customers</span><input className="admin-search" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
            <table><thead><tr><th>Name</th><th>Email</th><th>Bookings</th><th>Spent</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{filtered.map(c=>(
                <tr key={c.id}>
                  <td style={{fontWeight:600}}>{c.name}</td><td>{c.email}</td>
                  <td>{c.booking_count}</td><td style={{fontWeight:600}}>${Number(c.total_spent).toLocaleString()}</td>
                  <td><span className={`status-badge status-${c.status}`}>{c.status}</span></td>
                  <td><button className="action-btn action-edit" onClick={async()=>{ await customerAPI.updateStatus(c.id,{status:c.status==='active'?'suspended':'active'}); loadSection('customers'); }}>Toggle</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      );
    }

    if(section==='payments') return (
      <div className="admin-content">
        {payments?.stats && (
          <div className="stat-cards" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
            <div className="stat-card green"><div className="stat-label">Total Revenue</div><div className="stat-value">${Number(payments.stats.total_revenue||0).toLocaleString()}</div></div>
            <div className="stat-card orange"><div className="stat-label">Total Transactions</div><div className="stat-value">{payments.stats.total_transactions||0}</div></div>
            <div className="stat-card blue"><div className="stat-label">Completed</div><div className="stat-value">{payments.stats.completed_count||0}</div></div>
          </div>
        )}
        <div className="admin-table-wrap">
          <div className="admin-table-header"><span className="admin-table-title">Transactions</span></div>
          <table><thead><tr><th>Ref</th><th>Customer</th><th>Method</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{(payments?.data||[]).map(p=>(
              <tr key={p.id}>
                <td style={{fontWeight:600,color:'var(--orange)'}}>{p.payment_ref}</td>
                <td>{p.customer_name}</td><td>{p.method}</td>
                <td style={{fontWeight:600}}>${Number(p.amount).toLocaleString()}</td>
                <td><span className={`status-badge status-${p.status==='completed'?'confirmed':p.status==='pending'?'pending':'rejected'}`}>{p.status}</span></td>
                <td><button className="action-btn action-edit" onClick={async()=>{ await paymentAPI.updateStatus(p.id,{status:'completed'}); loadSection('payments'); }}>Verify</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    );

    if(section==='gallery') return (
      <div className="admin-content">
        {showGalleryModal && <GalleryUploadModal onClose={()=>setShowGalleryModal(false)} onSuccess={()=>{ setShowGalleryModal(false); loadSection('gallery'); notify('Image uploaded!'); }}/>}
        <div className="admin-table-wrap">
          <div className="admin-table-header">
            <span className="admin-table-title">Gallery</span>
            <button className="admin-add-btn" onClick={()=>setShowGalleryModal(true)}>+ Upload Image</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:16,marginTop:16}}>
            {gallery.map((img,i)=>{
              const API = process.env.REACT_APP_API_URL?.replace('/api','') || 'http://localhost:5000';
              return (
                <div key={i} style={{borderRadius:12,overflow:'hidden',position:'relative',aspectRatio:'4/3',boxShadow:'var(--shadow)'}}>
                  <img src={`${API}${img.filename}`} alt={img.title} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.src=STATIC_GALLERY[i%6]}/>
                  <div style={{position:'absolute',bottom:8,right:8}}>
                    <button className="action-btn action-delete" onClick={async()=>{ await galleryAPI.delete(img.id); loadSection('gallery'); }}>Delete</button>
                  </div>
                </div>
              );
            })}
            {gallery.length===0 && <p style={{color:'var(--gray)',padding:'20px 0'}}>No images uploaded yet. Click Upload Image to add photos.</p>}
          </div>
        </div>
      </div>
    );

    if(section==='blog') return (
      <div className="admin-content">
        {showBlogModal && <BlogPostModal post={editingBlog} onClose={()=>{ setShowBlogModal(false); setEditingBlog(null); }} onSuccess={()=>{ setShowBlogModal(false); setEditingBlog(null); loadSection('blog'); notify(editingBlog?'Post updated!':'Post created!'); }}/>}
        <div className="admin-table-wrap">
          <div className="admin-table-header">
            <span className="admin-table-title">Blog Posts</span>
            <button className="admin-add-btn" onClick={()=>{ setEditingBlog(null); setShowBlogModal(true); }}>+ New Post</button>
          </div>
          <table><thead><tr><th>Title</th><th>Category</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>{blogPosts.map(p=>(
              <tr key={p.id}>
                <td style={{fontWeight:600}}>{p.title}</td><td>{p.category||'—'}</td>
                <td><span className={`status-badge status-${p.status==='published'?'active':'inactive'}`}>{p.status}</span></td>
                <td>{p.created_at?.slice(0,10)}</td>
                <td>
                  <button className="action-btn action-edit" onClick={()=>{ setEditingBlog(p); setShowBlogModal(true); }}>Edit</button>
                  <button className="action-btn action-delete" onClick={async()=>{ await blogAPI.delete(p.id); loadSection('blog'); }}>Delete</button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    );

    return null;
  };

  return (
    <div className="admin-wrap">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header"><div className="admin-logo">✦ Saffron</div><div className="admin-badge-pill">Admin Panel</div></div>
        <nav className="admin-nav">
          {ADMIN_SECTIONS.map(s=>(
            <div key={s.id} className={`admin-nav-item${section===s.id?' active':''}`} onClick={()=>{ setSection(s.id); setSearch(''); }}>
              <span className="admin-nav-icon">{s.icon}</span><span>{s.label}</span>
            </div>
          ))}
          <div style={{flexGrow:1}}/>
          <div className="admin-nav-item" onClick={onExit}><span className="admin-nav-icon">🏠</span><span>Back to Site</span></div>
        </nav>
      </aside>
      <div className="admin-main">
        <div className="admin-topbar">
          <span className="admin-topbar-title">{ADMIN_SECTIONS.find(s=>s.id===section)?.label}</span>
          <div className="admin-topbar-user"><span style={{fontSize:14,color:'var(--gray)'}}>{user?.name}</span><div className="admin-avatar">{user?.name?.[0]||'A'}</div></div>
        </div>
        {renderContent()}
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
function AppInner() {
  const { user, loading: authLoading } = useAuth();
  const [page, setPage] = useState('home'); // home | admin | dashboard
  const [scrolled, setScrolled] = useState(false);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [notif, setNotif] = useState('');

  useEffect(()=>{
    const fn=()=>setScrolled(window.scrollY>60);
    window.addEventListener('scroll',fn);
    return ()=>window.removeEventListener('scroll',fn);
  },[]);

  // Redirect admin to admin panel when logging in
  useEffect(()=>{ if(user?.role==='admin' && page==='home') {} },[user]);

  const notify = msg => { setNotif(msg); setTimeout(()=>setNotif(''),4000); };
  const cartCount = cart.reduce((s,i)=>s+i.qty,0);

  if(authLoading) return <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32}}>⏳</div>;

  if(page==='admin') {
    if(!user) { setPage('home'); setShowLogin(true); return null; }
    if(user.role!=='admin') { setPage('home'); notify('Admin access only. Please login with an admin account.'); return null; }
    return <><style>{css}</style><AdminPanel onExit={()=>setPage('home')}/></>;
  }

  if(page==='dashboard') {
    if(!user) { setPage('home'); setShowLogin(true); return null; }
    return <><style>{css}</style><UserDashboard onBack={()=>setPage('home')}/></>;
  }

  return (
    <>
      <style>{css}</style>
      <NavBar scrolled={scrolled} onAdmin={()=>setPage('admin')} onLoginClick={()=>setShowLogin(true)} onDashboard={()=>setPage('dashboard')}/>
      <HeroSection/>
      <ServicesSection/>
      <MenuSection cart={cart} setCart={setCart} notify={notify}/>
      <AboutSection/>
      <GallerySection/>
      <TestimonialsSection/>
      <BookingSection notify={notify}/>
      <Footer onAdmin={()=>setPage('admin')}/>

      {cartCount>0 && (
        <button className="cart-badge" onClick={()=>setShowCart(true)}>
          🛒 {cartCount} item{cartCount!==1?'s':''} · ${cart.reduce((s,i)=>s+i.price*i.qty,0).toLocaleString()}
        </button>
      )}

      {showCart  && <CartModal cart={cart} setCart={setCart} onClose={()=>setShowCart(false)} notify={notify}/>}
      {showLogin && <LoginModal onClose={()=>setShowLogin(false)} notify={notify}/>}
      {notif     && <Notification msg={notif}/>}
    </>
  );
}

export default function App() {
  return <AuthProvider><AppInner/></AuthProvider>;
}