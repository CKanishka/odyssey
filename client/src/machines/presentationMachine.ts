import { setup, assign } from "xstate";
import { Presentation, Slide } from "../types";

interface PresentationContext {
  presentation: Presentation | null;
  currentSlideId: string | null;
  error: string | null;
  isShareModalOpen: boolean;
}

type PresentationEvent =
  | { type: "LOAD_PRESENTATION"; data: Presentation }
  | { type: "UPDATE_TITLE"; title: string }
  | { type: "ADD_SLIDE"; slide: Slide }
  | { type: "DELETE_SLIDE"; slideId: string }
  | { type: "REORDER_SLIDE_POSITIONS"; dragIndex: number; hoverIndex: number }
  | { type: "SELECT_SLIDE"; slideId: string }
  | { type: "NEXT_SLIDE" }
  | { type: "PREVIOUS_SLIDE" }
  | { type: "OPEN_SHARE_MODAL" }
  | { type: "CLOSE_SHARE_MODAL" }
  | { type: "ERROR"; error: string };

export const presentationMachine = setup({
  types: {
    context: {} as PresentationContext,
    events: {} as PresentationEvent,
  },
  actions: {
    loadPresentation: assign({
      presentation: ({ event }) => {
        if (event.type === "LOAD_PRESENTATION") {
          return event.data;
        }
        return null;
      },
      currentSlideId: ({ event, context }) => {
        if (event.type === "LOAD_PRESENTATION") {
          // Try to keep the current slide if it exists in the new data
          if (
            context.currentSlideId &&
            event.data.slides.some((s) => s.id === context.currentSlideId)
          ) {
            return context.currentSlideId;
          }
          // Otherwise, select the first slide
          return event.data.slides[0]?.id || null;
        }
        return context.currentSlideId;
      },
      error: null,
    }),
    updateTitle: assign({
      presentation: ({ context, event }) => {
        if (event.type === "UPDATE_TITLE" && context.presentation) {
          return {
            ...context.presentation,
            title: event.title,
          };
        }
        return context.presentation;
      },
    }),
    addSlide: assign({
      presentation: ({ context, event }) => {
        if (event.type === "ADD_SLIDE" && context.presentation) {
          return {
            ...context.presentation,
            slides: [...context.presentation.slides, event.slide],
          };
        }
        return context.presentation;
      },
    }),
    selectSlide: assign({
      currentSlideId: ({ event }) => {
        if (event.type === "SELECT_SLIDE") {
          return event.slideId;
        }
        return null;
      },
    }),
    nextSlide: assign({
      currentSlideId: ({ context }) => {
        if (!context.presentation || !context.currentSlideId) {
          return context.currentSlideId;
        }
        const currentIndex = context.presentation.slides.findIndex(
          (s) => s.id === context.currentSlideId
        );
        if (
          currentIndex !== -1 &&
          currentIndex < context.presentation.slides.length - 1
        ) {
          return context.presentation.slides[currentIndex + 1].id;
        }
        return context.currentSlideId;
      },
    }),
    previousSlide: assign({
      currentSlideId: ({ context }) => {
        if (!context.presentation || !context.currentSlideId) {
          return context.currentSlideId;
        }
        const currentIndex = context.presentation.slides.findIndex(
          (s) => s.id === context.currentSlideId
        );
        if (currentIndex > 0) {
          return context.presentation.slides[currentIndex - 1].id;
        }
        return context.currentSlideId;
      },
    }),
    openShareModal: assign({
      isShareModalOpen: true,
    }),
    closeShareModal: assign({
      isShareModalOpen: false,
    }),
    deleteSlide: assign({
      presentation: ({ context, event }) => {
        if (event.type === "DELETE_SLIDE" && context.presentation) {
          const updatedSlides = context.presentation.slides.filter(
            (slide) => slide.id !== event.slideId
          );
          // Update positions after deletion
          const slidesWithUpdatedPositions = updatedSlides.map(
            (slide, index) => ({
              ...slide,
              position: index,
            })
          );
          return {
            ...context.presentation,
            slides: slidesWithUpdatedPositions,
          };
        }
        return context.presentation;
      },
      currentSlideId: ({ context, event }) => {
        if (event.type === "DELETE_SLIDE" && context.presentation) {
          // If the current slide is being deleted, select a nearby slide
          if (context.currentSlideId === event.slideId) {
            const deletedSlideIndex = context.presentation.slides.findIndex(
              (slide) => slide.id === event.slideId
            );
            const remainingSlides = context.presentation.slides.filter(
              (slide) => slide.id !== event.slideId
            );
            // Select the slide at the same index, or the previous one if we're at the end
            const newIndex = Math.min(
              deletedSlideIndex,
              remainingSlides.length - 1
            );
            return remainingSlides[newIndex]?.id || null;
          }
        }
        return context.currentSlideId;
      },
    }),
    reorderSlidePositions: assign({
      presentation: ({ context, event }) => {
        if (event.type === "REORDER_SLIDE_POSITIONS" && context.presentation) {
          const { dragIndex, hoverIndex } = event;
          const slides = context.presentation.slides;

          // Update positions based on the move
          const updatedSlides = slides.map((slide, index) => {
            if (index === dragIndex) {
              // The dragged slide gets the new position
              return { ...slide, position: hoverIndex };
            } else if (dragIndex < hoverIndex) {
              // Moving down: decrement positions between old and new
              if (index > dragIndex && index <= hoverIndex) {
                return { ...slide, position: slide.position - 1 };
              }
            } else if (dragIndex > hoverIndex) {
              // Moving up: increment positions between new and old
              if (index >= hoverIndex && index < dragIndex) {
                return { ...slide, position: slide.position + 1 };
              }
            }
            return slide;
          });

          // Sort by position
          const sortedSlides = updatedSlides.sort(
            (a, b) => a.position - b.position
          );

          return {
            ...context.presentation,
            slides: sortedSlides,
          };
        }
        return context.presentation;
      },
    }),
    setError: assign({
      error: ({ event }) => {
        if (event.type === "ERROR") {
          return event.error;
        }
        return null;
      },
    }),
  },
}).createMachine({
  id: "presentation",
  initial: "idle",
  context: {
    presentation: null,
    currentSlideId: null,
    error: null,
    isShareModalOpen: false,
  },
  states: {
    idle: {
      on: {
        LOAD_PRESENTATION: {
          actions: "loadPresentation",
          target: "ready",
        },
      },
    },
    ready: {
      on: {
        LOAD_PRESENTATION: {
          actions: "loadPresentation",
        },
        UPDATE_TITLE: {
          actions: "updateTitle",
        },
        ADD_SLIDE: {
          actions: "addSlide",
        },
        DELETE_SLIDE: {
          actions: "deleteSlide",
        },
        REORDER_SLIDE_POSITIONS: {
          actions: "reorderSlidePositions",
        },
        SELECT_SLIDE: {
          actions: "selectSlide",
        },
        NEXT_SLIDE: {
          actions: "nextSlide",
        },
        PREVIOUS_SLIDE: {
          actions: "previousSlide",
        },
        OPEN_SHARE_MODAL: {
          actions: "openShareModal",
        },
        CLOSE_SHARE_MODAL: {
          actions: "closeShareModal",
        },
        ERROR: {
          actions: "setError",
          target: "error",
        },
      },
    },
    error: {
      on: {
        LOAD_PRESENTATION: {
          actions: "loadPresentation",
          target: "ready",
        },
      },
    },
  },
});
