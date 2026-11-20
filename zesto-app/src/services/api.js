import { Platform } from 'react-native';

// Android emulator reaches laptop at 10.0.2.2, web browser uses localhost
export const BASE_URL = Platform.select({
  web: 'http://localhost:8080',
  android: 'http://10.0.2.2:8080',
  default: 'http://localhost:8080',
});

async function request(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(BASE_URL + path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Something went wrong');
    }
    return data;
  } catch (e) {
    if (e.name === 'AbortError') {
      throw new Error('The server is taking too long to respond');
    }
    if (e.message === 'Network request failed') {
      throw new Error("Can't reach the Zesto server. Is the Java backend running?");
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  login: (name, email) =>
    request('/login', { method: 'POST', body: JSON.stringify({ name, email }) }),

  profile: (email) => request(`/profile?email=${encodeURIComponent(email)}`),

  updateAddress: (email, address) =>
    request('/profile', { method: 'POST', body: JSON.stringify({ email, address }) }),

  restaurants: (q = '', cuisine = '') =>
    request(`/restaurants?q=${encodeURIComponent(q)}` + (cuisine ? `&cuisine=${cuisine}` : '')),

  restaurant: (id) => request(`/restaurants/${id}`),

  items: (q = '') => request(`/items?q=${encodeURIComponent(q)}`),

  offers: () => request('/offers'),

  previewOrder: (payload) =>
    request('/orders/preview', { method: 'POST', body: JSON.stringify(payload) }),

  placeOrder: (payload) =>
    request('/orders', { method: 'POST', body: JSON.stringify(payload) }),

  orders: (email) => request(`/orders?email=${encodeURIComponent(email)}`),

  cancelOrder: (orderId, email) =>
    request('/orders/cancel', { method: 'POST', body: JSON.stringify({ orderId, email }) }),

  reviews: (restaurantId) => request(`/reviews?restaurantId=${encodeURIComponent(restaurantId)}`),

  submitReview: (payload) =>
    request('/reviews', { method: 'POST', body: JSON.stringify(payload) }),

  // Phase 2 & 3 Signature Endpoints
  recipe: (dishId) => request(`/dishes/${dishId}/recipe`),

  mealPlan: (payload) =>
    request('/meal-plan', { method: 'POST', body: JSON.stringify(payload) }),

  splitBill: (payload) =>
    request('/bill-split', { method: 'POST', body: JSON.stringify(payload) }),

  moodDishes: (mood) =>
    request(`/mood-dishes?mood=${encodeURIComponent(mood)}`),

  achievements: (email) =>
    request(`/achievements?email=${encodeURIComponent(email)}`),

  riderLocation: (orderId, lat, lon) =>
    request(`/orders/${orderId}/rider` + (lat && lon ? `?lat=${lat}&lon=${lon}` : '')),
};