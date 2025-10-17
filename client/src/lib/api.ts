const API_URL =
  (import.meta as any).env.VITE_API_URL || "http://localhost:3001";

// Get auth token from localStorage
function getAuthToken(): string | null {
  return localStorage.getItem("auth_token");
}

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "API request failed");
  }

  return response.json();
}

export const api = {
  // Authentication
  register: (name: string, email: string, password: string) =>
    fetchAPI("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email: string, password: string) =>
    fetchAPI("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    fetchAPI("/auth/logout", {
      method: "POST",
    }),

  getCurrentUser: () => fetchAPI("/auth/me"),

  changePassword: (oldPassword: string, newPassword: string) =>
    fetchAPI("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ oldPassword, newPassword }),
    }),

  // Presentations
  createPresentation: (title?: string) =>
    fetchAPI("/presentations", {
      method: "POST",
      body: JSON.stringify({ title }),
    }),

  getUserPresentations: () => fetchAPI("/presentations"),

  getPresentation: (id: string, shareId?: string) =>
    fetchAPI(`/presentations/${id}${shareId ? `?shareId=${shareId}` : ""}`),

  updatePresentation: (id: string, title: string, shareId?: string) =>
    fetchAPI(`/presentations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ title, shareId }),
    }),

  deletePresentation: (id: string) =>
    fetchAPI(`/presentations/${id}`, { method: "DELETE" }),

  // Slides
  createSlide: (presentationId: string, position: number) =>
    fetchAPI("/slides", {
      method: "POST",
      body: JSON.stringify({ presentationId, position }),
    }),

  getSlide: (id: string) => fetchAPI(`/slides/${id}`),

  updateSlideContent: (id: string, content: any) =>
    fetchAPI(`/slides/${id}/content`, {
      method: "PATCH",
      body: JSON.stringify({ content }),
    }),

  updateSlidePosition: (id: string, newPosition: number) =>
    fetchAPI(`/slides/${id}/position`, {
      method: "PATCH",
      body: JSON.stringify({ newPosition }),
    }),

  deleteSlide: (id: string, shareId?: string) =>
    fetchAPI(`/slides/${id}${shareId ? `?shareId=${shareId}` : ""}`, {
      method: "DELETE",
    }),

  // Shares
  createShare: (
    presentationId: string,
    slideId?: string,
    type?: "PRESENTATION" | "SLIDE",
    permission?: "edit" | "view"
  ) =>
    fetchAPI("/shares", {
      method: "POST",
      body: JSON.stringify({ presentationId, slideId, type, permission }),
    }),

  getShare: (shareId: string) => fetchAPI(`/shares/${shareId}`),

  getPresentationShares: (presentationId: string) =>
    fetchAPI(`/shares/presentation/${presentationId}`),

  deleteShare: (id: string) => fetchAPI(`/shares/${id}`, { method: "DELETE" }),

  // Liveblocks auth
  liveblocksAuth: (room: string | undefined, userId?: string) =>
    fetchAPI("/liveblocks/auth", {
      method: "POST",
      body: JSON.stringify({ room, userId }),
    }),
};
