// Mock API Client Structure for FastAPI Backend Integration
// Base URL would typically come from environment variables (e.g. NEXT_PUBLIC_API_URL)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Helper function for making authenticated API requests to the FastAPI backend.
 * Automatically adds the Bearer token if it exists in cookies/storage.
 */
export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  
  // Note: JWT token should be handled via HTTP-only cookies based on the requirements, 
  // so we might not need to manually attach it here if the browser handles it.
  // We specify credentials: "include" to ensure cookies are sent.
  headers.set("Content-Type", "application/json");

  const config = {
    ...options,
    headers,
    credentials: "include" as RequestCredentials,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Automatically parse JSON if the response is OK
    if (response.ok) {
      // Check if there is content to parse (e.g 204 No Content doesn't have body)
      if (response.status !== 204) {
         return await response.json();
      }
      return null;
    }

    // Handle standard HTTP errors
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || `API Request failed with status ${response.status}`);
    
  } catch (error) {
    console.error("API Fetch Error:", error);
    throw error;
  }
}

// Example specific endpoint callers
export const api = {
  auth: {
    register: (data: any) => fetchAPI("/auth/register", { method: "POST", body: JSON.stringify(data) }),
    login: (data: any) => fetchAPI("/auth/login", { method: "POST", body: JSON.stringify(data) }),
    logout: () => fetchAPI("/auth/logout", { method: "POST" }),
    me: () => fetchAPI("/auth/me"),
    updateProfile: (data: any) => fetchAPI("/auth/me", { method: "PUT", body: JSON.stringify(data) }),
    registerChild: (data: any) => fetchAPI("/auth/register/child", { method: "POST", body: JSON.stringify(data) }),
  },
  chores: {
    getAll: () => fetchAPI("/chores"),
    create: (data: any) => fetchAPI("/chores", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) => fetchAPI(`/chores/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    complete: (id: number) => fetchAPI(`/chores/${id}/complete`, { method: "PUT" }),
    approve: (id: number) => fetchAPI(`/chores/${id}/approve`, { method: "PUT" }),
    delete: (id: number) => fetchAPI(`/chores/${id}`, { method: "DELETE" }),
  },
  rewards: {
    getAll: () => fetchAPI("/rewards"),
    redeem: (userId: number, id: number) => fetchAPI(`/users/${userId}/redeem/${id}`, { method: "PUT" }),
  },
  users: {
    getAll: () => fetchAPI("/users"),
    getOptions: () => fetchAPI("/users"),
    invite: () => fetchAPI("/users/invite", { method: "POST" }),
  }
};
