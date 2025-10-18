import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "react-router-dom";
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

function PresentationContent() {
  const { presentationId } = useParams<{ presentationId: string }>();
  const [searchParams] = useSearchParams();
  const shareId = searchParams.get("share");

  const [state, send] = useMachine(presentationMachine);
  const room = useRoom();

  const [yDoc, setYDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<LiveblocksYjsProvider | null>(null);
  const [accessLevel, setAccessLevel] = useState<"owner" | "edit" | "view">(
    "owner"
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPresentation();
  }, [presentationId, shareId]);

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
      const data = await api.getPresentation(
        presentationId,
        shareId || undefined
      );
      setAccessLevel(data.accessLevel || "owner");
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
  };

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
    if (
      !presentationId ||
      !state.context.presentation ||
      accessLevel === "view"
    )
      return;

    try {
      const position = state.context.presentation.slides.length;
      const newSlide = await api.createSlide(presentationId, position);
      // Add the slide to the state machine
      send({ type: "ADD_SLIDE", slide: newSlide });
      send({ type: "SELECT_SLIDE", index: position });
    } catch (error: any) {
      console.error("Error adding slide:", error);
      toast.error("Failed to add slide", {
        description:
          error.message ||
          "You may not have permission to edit this presentation",
      });
    }
  };

  const handleDeleteSlide = async (slideId: string) => {
    if (
      !state.context.presentation ||
      state.context.presentation.slides.length <= 1 ||
      accessLevel === "view"
    ) {
      toast.warning("Cannot delete the last slide", {
        description: "A presentation must have at least one slide.",
      });
      return;
    }

    try {
      await api.deleteSlide(slideId, shareId || undefined);
      // Update the state machine to remove the slide
      send({ type: "DELETE_SLIDE", slideId });
    } catch (error: any) {
      console.error("Error deleting slide:", error);
      toast.error("Failed to delete slide", {
        description:
          error.message ||
          "You may not have permission to edit this presentation",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      send({ type: "PREVIOUS_SLIDE" });
    } else if (e.key === "ArrowRight") {
      send({ type: "NEXT_SLIDE" });
    }
  };

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

  const currentSlide =
    state.context.presentation.slides[state.context.currentSlideIndex];

  return (
    <div
      className="h-screen flex flex-col bg-background"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <Toolbar
        presentationTitle={state.context.presentation.title}
        onTitleChange={handleTitleChange}
        onShare={() => send({ type: "OPEN_SHARE_MODAL" })}
        onAddSlide={handleAddSlide}
        isReadOnly={accessLevel === "view"}
        isOwner={accessLevel === "owner"}
      />

      <div className="flex-1 flex overflow-hidden">
        <SlidesPanel
          slides={state.context.presentation.slides}
          activeIndex={state.context.currentSlideIndex}
          onClick={(slide) =>
            send({ type: "SELECT_SLIDE", index: slide.position })
          }
          onDelete={
            accessLevel !== "view"
              ? (slide) => handleDeleteSlide(slide.id)
              : undefined
          }
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
                  key={currentSlide?.id}
                  slideId={currentSlide?.id}
                  yDoc={yDoc}
                  provider={provider}
                  isReadOnly={accessLevel === "view"}
                />
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
          <div className="h-screen flex items-center justify-center bg-background">
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
