const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (res) => {
  if (res.status === 401) {
    // Session expired or unauthorized
    sessionStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    window.location.href = "/login";
    return { error: "Sessiya muddati tugadi!", status: 401 };
  }
  
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const data = await res.json();
    if (!res.ok) {
      return { error: data.message || "Xatolik yuz berdi!", status: res.status };
    }
    return data;
  } else {
    if (!res.ok) {
      return { error: "Xatolik yuz berdi!", status: res.status };
    }
    return { success: true };
  }
};

export const api = {
  get: async (endpoint) => {
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "GET",
        headers: getHeaders(),
      });
      return await handleResponse(res);
    } catch (err) {
      console.error(`GET ${endpoint} failed:`, err);
      return { error: "Tarmoq ulanishida xatolik!" };
    }
  },
  post: async (endpoint, data) => {
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return await handleResponse(res);
    } catch (err) {
      console.error(`POST ${endpoint} failed:`, err);
      return { error: "Tarmoq ulanishida xatolik!" };
    }
  },
  put: async (endpoint, data) => {
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return await handleResponse(res);
    } catch (err) {
      console.error(`PUT ${endpoint} failed:`, err);
      return { error: "Tarmoq ulanishida xatolik!" };
    }
  },
  delete: async (endpoint) => {
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      return await handleResponse(res);
    } catch (err) {
      console.error(`DELETE ${endpoint} failed:`, err);
      return { error: "Tarmoq ulanishida xatolik!" };
    }
  },
};
export default api;
