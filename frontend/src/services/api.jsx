import { auth } from "./firebase";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://delivery-y1yc.onrender.com"
).replace(/\/+$/, "");

export async function api(path, options = {}) {
  const user = auth.currentUser;

  const headers = {
    ...(options.body instanceof FormData
      ? {}
      : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };

  if (user) {
    const token = await user.getIdToken();
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