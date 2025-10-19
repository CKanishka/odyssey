import { useEffect, useState, Suspense, useCallback, useMemo } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useMachine } from "@xstate/react";
import { toast } from "sonner";
import * as Y from "yjs";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import { presentationMachine } from "../machines/presentationMachine";
import { api } from "../lib/api";
import { RoomProvider, useRoom } from "../lib/liveblocks";
import Toolbar from "../components/Toolbar";
import ShareModal from "../components/ShareModal";
import CollaborativeEditor from "../components/CollaborativeEditor";
import SlidesPanel from "../components/SlidesPanel";
import { AlertCircle } from "lucide-react";
import {
  initializeSlidesFromDatabase,
  yjsSlidesArrayToPlainSlides,
  addSlideToYDoc,
  deleteSlideFromYDoc,
  reorderSlideInYDoc,
  getSlidesArray,
} from "../lib/slidesSync";
import { Presentation, Slide } from "../types";

function PresentationContent() {
  const { presentationId } = useParams<{ presentationId: string }>();
  const [searchParams] = useSearchParams();
  const shareId = searchParams.get("share");
  const navigate = useNavigate();

  const [state, send] = useMachine(presentationMachine);

  const room = useRoom();
  const [yDoc, setYDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<LiveblocksYjsProvider | null>(null);

  const [initialSlidesSet, setInitialSlidesSet] = useState<Set<string>>(
    new Set()
  );
  const [error, setError] = useState<string | null>(null);
  const [liveblocksReady, setLiveblocksReady] = useState(false);

  const accessLevel = useMemo(() => {
    return state.context.presentation?.accessLevel || "owner";
  }, [state.context.presentation?.accessLevel]);

  const isSelectiveSlideAccess = useMemo(() => {
    return state.context.presentation?.shareType === "SLIDE";
  }, [state.context.presentation?.shareType]);

  const hasAddAndDeleteAccess = useMemo(() => {
    return accessLevel !== "view" && !isSelectiveSlideAccess;
  }, [accessLevel, isSelectiveSlideAccess]);

  useEffect(() => {
    if (!room) return;

    const doc = new Y.Doc();
    const liveblocksProvider = new LiveblocksYjsProvider(room as any, doc);

    // Wait for initial sync from Liveblocks before proceeding
    liveblocksProvider.on("synced", () => {
      console.log("Liveblocks: Initial sync complete");
      setLiveblocksReady(true);
    });

    setYDoc(doc);
    setProvider(liveblocksProvider);

    return () => {
      liveblocksProvider.destroy();
      doc.destroy();
    };
  }, [room]);

  const loadPresentation = useCallback(async () => {
    if (!presentationId || !yDoc || !liveblocksReady) {
      return;
    }

    try {
      const data: Presentation = await api.getPresentation(
        presentationId,
        shareId || undefined
      );

      // Initialize Y.Doc with database data (only if empty after Liveblocks sync)
      initializeSlidesFromDatabase(yDoc, data.slides);

      // Needed for selective slide access
      setInitialSlidesSet(new Set(data?.slides?.map((slide) => slide.id)));

      // Load the presentation into state machine
      send({ type: "LOAD_PRESENTATION", data });
      setError(null);
    } catch (error: any) {
      console.error("Error loading presentation:", error);
      setError(error.message || "Failed to load presentation");
      send({
        type: "ERROR",
        error: error.message || "Failed to load presentation",
      });
    }
  }, [presentationId, yDoc, shareId, send, liveblocksReady]);

  // Load presentation data
  useEffect(() => {
    loadPresentation();
  }, [loadPresentation]);

  // Subscribe to Y.Doc slides changes for real-time sync
  useEffect(() => {
    if (!yDoc || !state.context.presentation) return;

    const slidesArray = getSlidesArray(yDoc);

    // Observer for array changes
    const observer = () => {
      const updatedSlides = yjsSlidesArrayToPlainSlides(yDoc);

      if (isSelectiveSlideAccess) {
        // Filter slides to only include the slides with access
        const selectiveSlides = updatedSlides.filter((slide) =>
          initialSlidesSet.has(slide.id)
        );
        send({
          type: "LOAD_PRESENTATION",
          data: {
            ...state.context.presentation!,
            slides: selectiveSlides as Slide[],
          },
        });
      } else {
        send({
          type: "LOAD_PRESENTATION",
          data: {
            ...state.context.presentation!,
            slides: updatedSlides as Slide[],
          },
        });
      }
    };

    observer();

    // Listen to changes
    slidesArray.observe(observer);

    const unobservers: (() => void)[] = [() => slidesArray.unobserve(observer)];

    // Deep observe to catch changes within Y.Maps
    slidesArray.forEach((slideMap) => {
      slideMap.observe(observer);
      unobservers.push(() => slideMap.unobserve(observer));
    });

    return () => {
      unobservers.forEach((unobserve) => unobserve());
    };
  }, [
    yDoc,
    state.context.presentation?.id,
    send,
    isSelectiveSlideAccess,
    initialSlidesSet,
  ]);

  const handleTitleChange = async (title: string) => {
    if (!presentationId || accessLevel === "view") return;

    try {
      await api.updatePresentation(presentationId, title, shareId || undefined);
      send({ type: "UPDATE_TITLE", title });
    } catch (error: any) {
      console.error("Error updating title:", error);
      toast.error("Failed to update title", {
        description:
          error.message ||
          "You may not have permission to edit this presentation",
      });
    }
  };

  const handleAddSlide = async () => {
    if (!presentationId || !yDoc || !hasAddAndDeleteAccess) return;

    try {
      // Use Y.Doc array length if available, otherwise use state machine
      const slidesArray = getSlidesArray(yDoc);
      const position = slidesArray.length;

      // Create slide in database
      const newSlide = await api.createSlide(
        presentationId,
        position,
        shareId || undefined
      );

      // Add to Y.Doc
      addSlideToYDoc(yDoc, {
        id: newSlide.id,
        presentationId: newSlide.presentationId,
        position: newSlide.position,
        createdAt: newSlide.createdAt,
        updatedAt: newSlide.updatedAt,
        content: newSlide.content,
      });

      // Select the new slide
      send({ type: "SELECT_SLIDE", slideId: newSlide.id });
    } catch (error: any) {
      console.error("Error adding slide:", error);
      toast.error("Failed to add slide", {
        description:
          error.message ||
          "You may not have permission to add slides to this presentation",
      });
    }
  };

  const handleDeleteSlide = async (slideId: string) => {
    if (!yDoc || !hasAddAndDeleteAccess) return;

    // Check slide count from Y.Doc
    const slidesArray = getSlidesArray(yDoc);
    if (slidesArray.length <= 1) {
      toast.warning("Cannot delete the last slide", {
        description: "A presentation must have at least one slide.",
      });
      return;
    }

    try {
      await api.deleteSlide(slideId, shareId || undefined);
      // Delete from Y.Doc
      deleteSlideFromYDoc(yDoc, slideId);
    } catch (error: any) {
      console.error("Error deleting slide:", error);
      toast.error("Failed to delete slide", {
        description:
          error.message ||
          "You may not have permission to delete slides from this presentation",
      });
      // Reload to recover from error
      loadPresentation();
    }
  };

  const handleSlideReorder = useCallback(
    async (dragIndex: number, hoverIndex: number) => {
      if (!yDoc || accessLevel === "view") return;

      // Get slides from Y.Doc for more accurate data
      const currentSlides = yjsSlidesArrayToPlainSlides(yDoc);
      const draggedSlide = currentSlides[dragIndex];
      if (!draggedSlide) return;

      try {
        // Update backend
        await api.updateSlidePosition(draggedSlide.id, hoverIndex);

        reorderSlideInYDoc(yDoc, draggedSlide.id, hoverIndex);
      } catch (error: any) {
        console.error("Error reordering slide:", error);
        toast.error("Failed to reorder slide", {
          description:
            error.message ||
            "You may not have permission to edit this presentation",
        });
        // Reload to recover from error
        loadPresentation();
      }
    },
    [yDoc, accessLevel]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      send({ type: "PREVIOUS_SLIDE" });
    } else if (e.key === "ArrowRight") {
      send({ type: "NEXT_SLIDE" });
    }
  };

  const displaySlides = state.context.presentation?.slides || [];

  const [currentSlideIndex, currentSlide] = useMemo(() => {
    return displaySlides.reduce(
      (acc, slide, index) => {
        if (slide.id === state.context.currentSlideId) {
          return [index, slide];
        }
        return acc;
      },
      [0, null] as [number, Slide | null]
    );
  }, [displaySlides, state.context.currentSlideId]);

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Failed to Load Presentation
          </h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!state.context.presentation || !yDoc || !provider) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading presentation...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-screen flex flex-col bg-background"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <Toolbar
        presentationTitle={state.context.presentation.title}
        onTitleChange={handleTitleChange}
        onShare={
          accessLevel === "owner"
            ? () => send({ type: "OPEN_SHARE_MODAL" })
            : undefined
        }
        onAddSlide={hasAddAndDeleteAccess ? handleAddSlide : undefined}
        onBack={() => navigate("/")}
        isReadOnly={accessLevel === "view"}
      />

      <div className="flex-1 flex overflow-hidden">
        <SlidesPanel
          slides={displaySlides}
          activeSlideId={currentSlide?.id || null}
          yDoc={yDoc}
          onClick={(slide) => send({ type: "SELECT_SLIDE", slideId: slide.id })}
          onDelete={
            hasAddAndDeleteAccess
              ? (slide) => handleDeleteSlide(slide.id)
              : undefined
          }
          onReorder={accessLevel !== "view" ? handleSlideReorder : undefined}
        />

        {/* Main editor area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto">
              <div className="bg-card rounded-xl shadow-lg border border-border p-8">
                {currentSlide ? (
                  <>
                    <div className="mb-4 pb-4 border-b border-border flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-foreground">
                        Slide {currentSlideIndex + 1} of {displaySlides.length}
                      </h2>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => send({ type: "PREVIOUS_SLIDE" })}
                          disabled={currentSlideIndex === 0}
                          className="p-2 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 19l-7-7 7-7"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => send({ type: "NEXT_SLIDE" })}
                          disabled={
                            currentSlideIndex === displaySlides.length - 1
                          }
                          className="p-2 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <CollaborativeEditor
                      key={currentSlide.id}
                      slideId={currentSlide.id}
                      yDoc={yDoc}
                      provider={provider}
                      isReadOnly={accessLevel === "view"}
                    />
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No slide selected</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {state.context.isShareModalOpen && accessLevel === "owner" && (
        <ShareModal
          presentationId={state.context.presentation.id}
          currentSlideId={currentSlide?.id || null}
          onClose={() => send({ type: "CLOSE_SHARE_MODAL" })}
        />
      )}
    </div>
  );
}

export default function PresentationPage() {
  const { presentationId } = useParams<{ presentationId: string }>();

  if (!presentationId) {
    return <div>Invalid presentation ID</div>;
  }

  const roomId = `presentation-${presentationId}`;

  return (
    <RoomProvider
      id={roomId}
      initialPresence={{
        cursor: null,
        name: "Anonymous",
        color: "#000000",
      }}
      initialStorage={{}}
    >
      <Suspense
        fallback={
          <div className="h-screen flex items-center justify-center bg-background">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">
                Connecting to collaboration server...
              </p>
            </div>
          </div>
        }
      >
        <PresentationContent />
      </Suspense>
    </RoomProvider>
  );
}
