import { setup, assign } from "xstate";
import { Presentation, Slide } from "../types";

interface PresentationContext {
  presentation: Presentation | null;
  currentSlideIndex: number;
  error: string | null;
  isShareModalOpen: boolean;
}

type PresentationEvent =
  | { type: "LOAD_PRESENTATION"; data: Presentation }
  | { type: "UPDATE_TITLE"; title: string }
  | { type: "ADD_SLIDE"; slide: Slide }
  | { type: "DELETE_SLIDE"; slideId: string }
  | { type: "REORDER_SLIDE_POSITIONS"; dragIndex: number; hoverIndex: number }
  | { type: "SELECT_SLIDE"; index: number }
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
      currentSlideIndex: ({ event }) => {
        if (event.type === "SELECT_SLIDE") {
          return event.index;
        }
        return 0;
      },
    }),
    nextSlide: assign({
      currentSlideIndex: ({ context }) => {
        if (
          context.presentation &&
          context.currentSlideIndex < context.presentation.slides.length - 1
        ) {
          return context.currentSlideIndex + 1;
        }
        return context.currentSlideIndex;
      },
    }),
    previousSlide: assign({
      currentSlideIndex: ({ context }) => {
        if (context.currentSlideIndex > 0) {
          return context.currentSlideIndex - 1;
        }
        return context.currentSlideIndex;
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
      currentSlideIndex: ({ context, event }) => {
        if (event.type === "DELETE_SLIDE" && context.presentation) {
          const deletedSlideIndex = context.presentation.slides.findIndex(
            (slide) => slide.id === event.slideId
          );
          // If current slide is being deleted or is after the deleted slide, adjust index
          if (
            deletedSlideIndex !== -1 &&
            context.currentSlideIndex >= deletedSlideIndex
          ) {
            return Math.max(0, context.currentSlideIndex - 1);
          }
        }
        return context.currentSlideIndex;
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
    currentSlideIndex: 0,
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
