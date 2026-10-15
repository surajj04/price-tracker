import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

/* ---------------- Fetch all products by user_id ---------------- */
export const getProductByUserID = async (userId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/product/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching products for user ${userId}:`, error);
    throw error;
  }
};

/* ---------------- Fetch single product by id ---------------- */
export const getProductById = async (productId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/product/detail/${productId}`
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching product ${productId}:`, error);
    throw error;
  }
};


/* ---------------- Scrape product from link ---------------- */
export const trackProduct = async (productLink) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/product/track/`, null, {
      params: { product_link: productLink },
    });
    return response.data;
  } catch (error) {
    console.error("Error tracking product:", error);
    throw error;
  }
};

/* ---------------- Save product to track ---------------- */
export const addProductToTrack = async (payload) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/product/add-product/`, payload);
    return response.data;
  } catch (error) {
    console.error("Error adding product to track:", error);
    throw error;
  }
};

export const updateProduct = async (id, payload) => {
  // Convert camelCase keys to snake_case for backend
  const normalizedPayload = {};
  for (const [key, value] of Object.entries(payload)) {
    const snakeKey = key.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase());
    normalizedPayload[snakeKey] = value;
  }

  console.log("🔍 Outgoing payload:", normalizedPayload);

  const res = await fetch(
    `${API_BASE_URL}/product/update-product/${id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalizedPayload),
    }
  );

  if (!res.ok) {
    const error = await res.json();
    console.error("FastAPI validation error:", error.detail);
    throw new Error(`Update failed: ${res.status}`);
  }

  return res.json();
};

export const deleteProduct = async (id) => {
  const res = await fetch(`${API_BASE_URL}/product/delete-product/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
  return true;
};


export const getLatestNotifications = async (user_id) => {
  const res = await axios.get(`${API_BASE_URL}/notification/latest/`, {
    params: {user_id },
  });
  return res.data;
};

export const getNotifications = async (user_id) => {
  const res = await axios.get(`${API_BASE_URL}/notification/`, {
    params: {user_id },
  });
  return res.data;
};

export const markNotificationRead = async (id) => {
  const res = await axios.patch(`${API_BASE_URL}/notification/${id}/read`);
  return res.data;
};

export const markAllNotificationsRead = async (user_id) => {
  const res = await axios.patch(`${API_BASE_URL}/notification/read-all/${user_id}`);
  return res.data;
};

/* ---------------- Normalize raw API product ---------------- */
export const normalizeProduct = (raw) => {
  const p1 = Number(raw.product_price) || 0;
  const p2 = Number(raw.discount_price) || 0;
  const currentPrice = Math.min(p1, p2) || p1 || p2 || 0;
  const mrp = Math.max(p1, p2) || currentPrice;

  const discount =
    mrp && currentPrice ? Math.round(((mrp - currentPrice) / mrp) * 100) : 0;

  return {
    id: raw.id,
    product_title: raw.product_title,
    brand_or_manufacturer: raw.brand_or_manufacturer,
    category: raw.category,
    platform: raw.platform,
    image: raw.product_image_link ?? null,

    current_price: currentPrice,
    mrp: mrp,
    target_price: raw.target_price ?? raw.target_price ?? null,
    lowest_price: raw.lowest_price ?? null,
    highest_price: raw.highest_price ?? null,
    discount_pct: discount,

    rating: raw.rating,
    reviews: raw.reviews,
    created_at: raw.created_at,

    last_checked: raw.last_checked ?? null,
    schedule: raw.check_frequency ?? raw.schedule ?? null,
    status: raw.status ?? "watching",

    _raw: raw,
  };
};