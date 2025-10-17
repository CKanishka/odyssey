export interface User {
  id: string;
  name?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Presentation {
  id: string;
  title: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  slides: Slide[];
  accessLevel?: "owner" | "edit" | "view";
  shareType?: "PRESENTATION" | "SLIDE";
  sharedSlideId?: string;
}

export interface Slide {
  id: string;
  presentationId: string;
  position: number;
  content: any;
  createdAt: string;
  updatedAt: string;
}

export interface Share {
  id: string;
  shareId: string;
  presentationId: string;
  slideId: string | null;
  type: "PRESENTATION" | "SLIDE";
  permission: "edit" | "view";
  createdAt: string;
  expiresAt: string | null;
  presentation?: Presentation;
  slide?: Slide;
}

export type UserPresence = {
  cursor: { x: number; y: number } | null;
  name: string;
  color: string;
  [key: string]: any;
};
