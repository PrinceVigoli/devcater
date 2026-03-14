const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('saffron_token');
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  };
  if (options.body instanceof FormData) delete config.headers['Content-Type'];

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `HTTP error ${response.status}`);
  return data;
};

export const authAPI = {
  register:       (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login:          (body) => request('/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
  me:             ()     => request('/auth/me'),
  updateProfile:  (body) => request('/auth/profile',  { method: 'PUT',  body: JSON.stringify(body) }),
  changePassword: (body) => request('/auth/password', { method: 'PUT',  body: JSON.stringify(body) }),
  saveToken: (t) => localStorage.setItem('saffron_token', t),
  getToken:  ()  => localStorage.getItem('saffron_token'),
  logout:    ()  => localStorage.removeItem('saffron_token'),
  isLoggedIn:()  => !!localStorage.getItem('saffron_token'),
};

export const menuAPI = {
  getAll:  (p = {})   => request(`/menu?${new URLSearchParams(p)}`),
  getOne:  (id)       => request(`/menu/${id}`),
  create:  (fd)       => request('/menu',       { method: 'POST',   body: fd }),
  update:  (id, fd)   => request(`/menu/${id}`, { method: 'PUT',    body: fd }),
  delete:  (id)       => request(`/menu/${id}`, { method: 'DELETE' }),
};

export const bookingAPI = {
  submit:       (body)  => request('/bookings',           { method: 'POST', body: JSON.stringify(body) }),
  myBookings:   ()      => request('/bookings/my'),
  getAll:       (p = {})=> request(`/bookings?${new URLSearchParams(p)}`),
  getOne:       (id)    => request(`/bookings/${id}`),
  updateStatus: (id, b) => request(`/bookings/${id}/status`, { method: 'PUT', body: JSON.stringify(b) }),
  delete:       (id)    => request(`/bookings/${id}`,     { method: 'DELETE' }),
};

export const orderAPI = {
  place:        (body)  => request('/orders',           { method: 'POST', body: JSON.stringify(body) }),
  myOrders:     ()      => request('/orders/my'),
  getAll:       (p = {})=> request(`/orders?${new URLSearchParams(p)}`),
  getOne:       (id)    => request(`/orders/${id}`),
  updateStatus: (id, b) => request(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify(b) }),
  cancelOrder:  (id)    => request(`/orders/${id}/cancel`,  { method: 'PUT', body: JSON.stringify({}) }),
  delete:       (id)    => request(`/orders/${id}`,          { method: 'DELETE' }),
};

export const paymentAPI = {
  create:       (body)  => request('/payments',             { method: 'POST', body: JSON.stringify(body) }),
  getAll:       (p = {})=> request(`/payments?${new URLSearchParams(p)}`),
  myHistory:    ()      => request('/payments/my'),
  updateStatus: (id, b) => request(`/payments/${id}/status`,{ method: 'PUT', body: JSON.stringify(b) }),
};

export const customerAPI = {
  getAll:         (p={}) => request(`/customers?${new URLSearchParams(p)}`),
  getOne:         (id)   => request(`/customers/${id}`),
  updateStatus:   (id,b) => request(`/customers/${id}/status`, { method: 'PUT', body: JSON.stringify(b) }),
  dashboardStats: ()     => request('/customers/stats/dashboard'),
};

export const galleryAPI = {
  getAll: ()   => request('/gallery'),
  upload: (fd) => request('/gallery', { method: 'POST', body: fd }),
  delete: (id) => request(`/gallery/${id}`, { method: 'DELETE' }),
};

export const blogAPI = {
  getAll:   (p={}) => request(`/blog?${new URLSearchParams(p)}`),
  adminAll: ()     => request('/blog/admin/all'),
  getOne:   (slug) => request(`/blog/${slug}`),
  create:   (body) => request('/blog',     { method: 'POST',   body: JSON.stringify(body) }),
  update:   (id,b) => request(`/blog/${id}`,{ method: 'PUT',   body: JSON.stringify(b) }),
  delete:   (id)   => request(`/blog/${id}`,{ method: 'DELETE' }),
};