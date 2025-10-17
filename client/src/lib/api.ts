const API_URL =
  (import.meta as any).env.VITE_API_URL || "http://localhost:3001";

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_URL}/api${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
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
  // Presentations
  createPresentation: (title?: string) =>
    fetchAPI("/presentations", {
      method: "POST",
      body: JSON.stringify({ title }),
    }),

  getPresentation: (id: string) => fetchAPI(`/presentations/${id}`),

  updatePresentation: (id: string, title: string) =>
    fetchAPI(`/presentations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ title }),
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

  deleteSlide: (id: string) => fetchAPI(`/slides/${id}`, { method: "DELETE" }),

  // Shares
  createShare: (
    presentationId: string,
    slideId?: string,
    type?: "PRESENTATION" | "SLIDE"
  ) =>
    fetchAPI("/shares", {
      method: "POST",
      body: JSON.stringify({ presentationId, slideId, type }),
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
