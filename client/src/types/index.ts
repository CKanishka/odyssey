export interface Presentation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  slides: Slide[];
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
