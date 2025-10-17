import { useEffect, useState, Suspense } from "react";
import { useParams } from "react-router-dom";
import { useMachine } from "@xstate/react";
import { toast } from "sonner";
import * as Y from "yjs";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import { presentationMachine } from "../machines/presentationMachine";
import { api } from "../lib/api";
import { RoomProvider, useRoom } from "../lib/liveblocks";
import Toolbar from "../components/Toolbar";
import SlideThumbnail from "../components/SlideThumbnail";
import ShareModal from "../components/ShareModal";
import CollaborativeEditor from "../components/CollaborativeEditor";
import SlidesPanel from "../components/SlidesPanel";

function PresentationContent() {
  const { presentationId } = useParams<{ presentationId: string }>();

  const [state, send] = useMachine(presentationMachine);
  const room = useRoom();

  const [yDoc, setYDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<LiveblocksYjsProvider | null>(null);

  useEffect(() => {
    loadPresentation();
  }, [presentationId]);

  useEffect(() => {
    if (!room) return;

    const doc = new Y.Doc();
    const liveblocksProvider = new LiveblocksYjsProvider(room as any, doc);

    setYDoc(doc);
    setProvider(liveblocksProvider);

    return () => {
      liveblocksProvider.destroy();
      doc.destroy();
    };
  }, [room]);

  const loadPresentation = async () => {
    if (!presentationId) return;

    try {
      const data = await api.getPresentation(presentationId);
      send({ type: "LOAD_PRESENTATION", data });
    } catch (error) {
      console.error("Error loading presentation:", error);
      send({ type: "ERROR", error: "Failed to load presentation" });
    }
  };

  const handleTitleChange = async (title: string) => {
    if (!presentationId) return;

    try {
      await api.updatePresentation(presentationId, title);
      send({ type: "UPDATE_TITLE", title });
    } catch (error) {
      console.error("Error updating title:", error);
    }
  };

  const handleAddSlide = async () => {
    if (!presentationId || !state.context.presentation) return;

    try {
      const position = state.context.presentation.slides.length;
      await api.createSlide(presentationId, position);
      await loadPresentation();
      send({ type: "SELECT_SLIDE", index: position });
    } catch (error) {
      console.error("Error adding slide:", error);
    }
  };

  const handleDeleteSlide = async (slideId: string) => {
    if (
      !state.context.presentation ||
      state.context.presentation.slides.length <= 1
    ) {
      toast.warning("Cannot delete the last slide", {
        description: "A presentation must have at least one slide.",
      });
      return;
    }

    try {
      await api.deleteSlide(slideId);
      await loadPresentation();

      // Adjust current slide index if necessary
      if (
        state.context.currentSlideIndex >=
        state.context.presentation.slides.length - 1
      ) {
        send({
          type: "SELECT_SLIDE",
          index: Math.max(0, state.context.currentSlideIndex - 1),
        });
      }
    } catch (error) {
      console.error("Error deleting slide:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      send({ type: "PREVIOUS_SLIDE" });
    } else if (e.key === "ArrowRight") {
      send({ type: "NEXT_SLIDE" });
    }
  };

  if (!state.context.presentation || !yDoc || !provider) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading presentation...</p>
        </div>
      </div>
    );
  }

  const currentSlide =
    state.context.presentation.slides[state.context.currentSlideIndex];

  return (
    <div
      className="min-h-screen flex flex-col bg-background"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <Toolbar
        presentationTitle={state.context.presentation.title}
        onTitleChange={handleTitleChange}
        onShare={() => send({ type: "OPEN_SHARE_MODAL" })}
        onAddSlide={handleAddSlide}
      />

      <div className="flex-1 flex overflow-hidden">
        <SlidesPanel
          slides={state.context.presentation.slides}
          activeIndex={state.context.currentSlideIndex}
          onClick={(slide) =>
            send({ type: "SELECT_SLIDE", index: slide.position })
          }
          onDelete={(slide) => handleDeleteSlide(slide.id)}
        />

        {/* Main editor area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto">
              <div className="bg-card rounded-xl shadow-lg border border-border p-8">
                <div className="mb-4 pb-4 border-b border-border flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">
                    Slide {state.context.currentSlideIndex + 1} of{" "}
                    {state.context.presentation.slides.length}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => send({ type: "PREVIOUS_SLIDE" })}
                      disabled={state.context.currentSlideIndex === 0}
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
                        state.context.currentSlideIndex ===
                        state.context.presentation.slides.length - 1
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
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {state.context.isShareModalOpen && (
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

  return (
    <RoomProvider
      id={`presentation-${presentationId}`}
      initialPresence={{
        cursor: null,
        name: "Anonymous",
        color: "#000000",
      }}
      initialStorage={{}}
    >
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Connecting...</p>
            </div>
          </div>
        }
      >
        <PresentationContent />
      </Suspense>
    </RoomProvider>
  );
}
