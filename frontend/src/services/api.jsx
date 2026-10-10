
import { auth } from "./firebase";

const API_URL = "https://delivery-y1yc.onrender.com";

export async function api(path, options = {}) {
  const user = auth.currentUser;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (user) {
    const token = await user.getIdToken(true);
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers,
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.error ||
        data.message ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
}

