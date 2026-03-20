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
  chores: {
    getAll: () => fetchAPI("/api/chores"),
    create: (data: any) => fetchAPI("/api/chores", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) => fetchAPI(`/api/chores/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) => fetchAPI(`/api/chores/${id}`, { method: "DELETE" }),
  },
  rewards: {
    getAll: () => fetchAPI("/api/rewards/active"),
    redeem: (id: number) => fetchAPI(`/api/rewards/redeem`, { method: "POST", body: JSON.stringify({ reward_id: id }) }),
  },
  users: {
    me: () => fetchAPI("/users/me"),
  }
};
