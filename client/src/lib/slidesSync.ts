import * as Y from "yjs";
import { Slide } from "../types";

/**
 *
 * Get or create the slide Yjs XML fragment
 */
export function getSlideYXmlFragment(yDoc: Y.Doc, slideId: string) {
  return yDoc.getXmlFragment(`slide-${slideId}`);
}

/**
 * Get or create the slides metadata Y.Array
 */
export function getSlidesArray(yDoc: Y.Doc) {
  return yDoc.getArray<Y.Map<string | number>>("slides-metadata");
}

/**
 * Initialize slides array from database data (first load)
 */
export function initializeSlidesFromDatabase(
  yDoc: Y.Doc,
  slides: Slide[]
): void {
  const slidesArray = getSlidesArray(yDoc);

  // Only initialize if empty
  if (slidesArray.length === 0) {
    yDoc.transact(() => {
      slides.forEach((slide) => {
        const slideMap = new Y.Map<string | number>();
        slideMap.set("id", slide.id);
        slideMap.set("presentationId", slide.presentationId);
        slideMap.set("position", slide.position);
        slideMap.set("createdAt", slide.createdAt);
        slideMap.set("updatedAt", slide.updatedAt);
        slidesArray.push([slideMap]);
      });
    });
  }
}

/**
 * Convert Y.Array to plain JavaScript Slide array
 */
export function yjsSlidesArrayToPlainSlides(
  yDoc: Y.Doc
): Omit<Slide, "content">[] {
  const slidesArray = getSlidesArray(yDoc);

  const slides = slidesArray.map((slideMap) => {
    return {
      id: slideMap.get("id") as string,
      presentationId: slideMap.get("presentationId") as string,
      position: slideMap.get("position") as number,
      createdAt: slideMap.get("createdAt") as string,
      updatedAt: slideMap.get("updatedAt") as string,
    };
  });

  // Sort by position
  return slides.sort((a, b) => a.position - b.position);
}

/**
 * Add a slide - conflict-free
 */
export function addSlideToYDoc(yDoc: Y.Doc, slide: Slide): void {
  const slidesArray = getSlidesArray(yDoc);

  yDoc.transact(() => {
    const position = slide.position ?? slidesArray.length;

    const slideMap = new Y.Map<any>();
    slideMap.set("id", slide.id);
    slideMap.set("presentationId", slide.presentationId);
    slideMap.set("position", position);
    slideMap.set("createdAt", slide.createdAt || new Date().toISOString());
    slideMap.set("updatedAt", slide.updatedAt || new Date().toISOString());

    // Insert at the correct position
    slidesArray.insert(position, [slideMap]);

    // Update positions of subsequent slides
    for (let i = position + 1; i < slidesArray.length; i++) {
      const s = slidesArray.get(i);
      s.set("position", i);
    }
  });
}

/**
 * Cleanup slide content when deleted
 */
export function cleanupSlideContent(yDoc: Y.Doc, slideId: string): void {
  const fragment = getSlideYXmlFragment(yDoc, slideId);
  yDoc.transact(() => {
    while (fragment.length > 0) {
      fragment.delete(0, fragment.length);
    }
  });
}

/**
 * Delete a slide - conflict-free
 */
export function deleteSlideFromYDoc(yDoc: Y.Doc, slideId: string): boolean {
  const slidesArray = getSlidesArray(yDoc);

  let deleteIndex = -1;
  slidesArray.forEach((slideMap, index) => {
    if (slideMap.get("id") === slideId) {
      deleteIndex = index;
    }
  });

  if (deleteIndex === -1) return false;

  yDoc.transact(() => {
    slidesArray.delete(deleteIndex, 1);

    // Update positions of subsequent slides
    for (let i = deleteIndex; i < slidesArray.length; i++) {
      const s = slidesArray.get(i);
      s.set("position", i);
    }

    cleanupSlideContent(yDoc, slideId);
  });

  return true;
}

/**
 * Reorder a slide - conflict-free
 */
export function reorderSlideInYDoc(
  yDoc: Y.Doc,
  slideId: string,
  newPosition: number
): boolean {
  const slidesArray = getSlidesArray(yDoc);

  let currentPosition = -1;

  slidesArray.forEach((slideMap) => {
    if (slideMap.get("id") === slideId) {
      currentPosition = slideMap.get("position") as number;
    }
  });

  if (currentPosition === -1 || currentPosition === newPosition) return false;

  yDoc.transact(() => {
    const movingUp = newPosition < currentPosition;

    slidesArray.forEach((slideMap) => {
      const pos = slideMap.get("position") as number;

      if (slideMap.get("id") === slideId) {
        // Update the slide being moved
        slideMap.set("position", newPosition);
        slideMap.set("updatedAt", new Date().toISOString());
      } else if (movingUp && pos >= newPosition && pos < currentPosition) {
        // Shift slides down when moving up
        slideMap.set("position", pos + 1);
        slideMap.set("updatedAt", new Date().toISOString());
      } else if (!movingUp && pos > currentPosition && pos <= newPosition) {
        // Shift slides up when moving down
        slideMap.set("position", pos - 1);
        slideMap.set("updatedAt", new Date().toISOString());
      }
    });
  });

  return true;
}

/**
 * Get a single slide by ID
 */
export function getSlideById(yDoc: Y.Doc, slideId: string) {
  const slidesArray = getSlidesArray(yDoc);

  slidesArray.forEach((slideMap) => {
    if (slideMap.get("id") === slideId) {
      return {
        id: slideMap.get("id") as string,
        presentationId: slideMap.get("presentationId") as string,
        position: slideMap.get("position") as number,
        createdAt: slideMap.get("createdAt") as string,
        updatedAt: slideMap.get("updatedAt") as string,
      };
    }
  });

  return null;
}
