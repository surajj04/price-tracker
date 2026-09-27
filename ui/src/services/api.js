import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

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

/* ---------------- Normalize raw API product ---------------- */
export const normalizeProduct = (raw) => {
  const currentPrice = raw.product_price;
  const mrp = raw.discount_price;

  const discount =
    mrp && currentPrice ? Math.round(((mrp - currentPrice) / mrp) * 100) : 0;

  return {
    id: raw.id,
    product_title: raw.product_title,
    brand_or_manufacturer: raw.brand_or_manufacturer,
    category: raw.category,
    platform: raw.platform,

    current_price: currentPrice,
    mrp: mrp,
    target_price: raw.target_price ?? null,
    lowest_price: raw.lowest_price ?? null,
    highest_price: raw.highest_price ?? null,
    discount_pct: discount,

    rating: raw.rating,
    reviews: raw.reviews,
    image: raw.image ?? null,
    created_at: raw.created_at,

    last_checked: raw.last_checked ?? null,
    schedule: raw.schedule ?? null,
    status: raw.status ?? "watching",

    _raw: raw,
  };
};