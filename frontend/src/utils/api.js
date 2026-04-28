const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const apiRequest = async (endpoint, method = 'GET', body = null) => {
  const token = localStorage.getItem("token");
  
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const options = {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    
    if (response.status === 401) {
      localStorage.removeItem("token");
      if (!window.location.pathname.includes('/login')) {
        window.location.href = "/login";
      }
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Something went wrong");
    }
    return data;
  } catch (error) {
    console.error(`API Error [${method} ${endpoint}]:`, error);
    throw error;
  }
};
export const fileUpload = async (endpoint, file) => {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("file", file);

  const options = {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Upload failed");
    return data;
  } catch (error) {
    console.error(`Upload Error [${endpoint}]:`, error);
    throw error;
  }
};
