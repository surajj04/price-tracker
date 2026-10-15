import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";


export const registerUser = async (payload) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/user/register/`, payload);
    return response.data;
  } catch (error) {
    console.error("Error adding product to track:", error);
    throw error;
  }
};

export const loginUser = async (payload) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/user/login/`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};