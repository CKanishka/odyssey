import { useEffect, useState, Suspense } from "react";
import { useParams } from "react-router-dom";
import { FileText, AlertCircle } from "lucide-react";
import * as Y from "yjs";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { api } from "../lib/api";
import { RoomProvider, useRoom, useOthers } from "../lib/liveblocks";
import { Share } from "../types";
import CollaborativeEditor from "../components/CollaborativeEditor";
import SlideThumbnail from "../components/SlideThumbnail";

function SharedContent({ share }: { share: Share }) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const room = useRoom();
  const others = useOthers();
  const [yDoc, setYDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<LiveblocksYjsProvider | null>(null);

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

  if (!yDoc || !provider) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const slides =
    share.type === "SLIDE" && share.slide
      ? [share.slide]
      : share.presentation?.slides || [];
  const currentSlide = slides[currentSlideIndex];
  const title = share.presentation?.title || "Shared Presentation";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <FileText className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl font-semibold text-foreground">{title}</h1>
              <p className="text-sm text-muted-foreground">
                {share.type === "SLIDE"
                  ? "Shared Slide"
                  : "Shared Presentation"}
              </p>
            </div>
          </div>

          {/* Collaborators */}
          <div className="flex items-center space-x-2">
            <div className="flex -space-x-2">
              {others.slice(0, 3).map((other) => (
                <Avatar
                  key={other.connectionId}
                  className="w-8 h-8 border-2 border-background"
                >
                  <AvatarFallback
                    style={{ backgroundColor: other.info?.color || "#666" }}
                    className="text-white text-xs font-medium"
                    title={other.info?.name || "Anonymous"}
                  >
                    {(other.info?.name || "A")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {others.length > 3 && (
                <Avatar className="w-8 h-8 border-2 border-background">
                  <AvatarFallback className="bg-muted text-foreground text-xs font-medium">
                    +{others.length - 3}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
            {others.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {others.length} collaborator{others.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - only show if sharing entire presentation */}
        {share.type === "PRESENTATION" && slides.length > 1 && (
          <div className="w-64 bg-muted/30 border-r border-border overflow-y-auto p-4 space-y-4">
            <h3 className="font-semibold text-foreground mb-2">Slides</h3>
            {slides.map((slide, index) => (
              <SlideThumbnail
                key={slide.id}
                slide={slide}
                index={index}
                isActive={index === currentSlideIndex}
                onClick={() => setCurrentSlideIndex(index)}
              />
            ))}
          </div>
        )}

        {/* Main editor area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto">
              <div className="bg-card rounded-xl shadow-lg border border-border p-8">
                {share.type === "PRESENTATION" && slides.length > 1 && (
                  <div className="mb-4 pb-4 border-b border-border flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground">
                      Slide {currentSlideIndex + 1} of {slides.length}
                    </h2>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          setCurrentSlideIndex(
                            Math.max(0, currentSlideIndex - 1)
                          )
                        }
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
                        onClick={() =>
                          setCurrentSlideIndex(
                            Math.min(slides.length - 1, currentSlideIndex + 1)
                          )
                        }
                        disabled={currentSlideIndex === slides.length - 1}
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
                )}
                {currentSlide && (
                  <CollaborativeEditor
                    key={currentSlide.id}
                    slideId={currentSlide.id}
                    yDoc={yDoc}
                    provider={provider}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SharedPage() {
  const { shareId } = useParams<{ shareId: string }>();
  const [share, setShare] = useState<Share | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadShare();
  }, [shareId]);

  const loadShare = async () => {
    if (!shareId) return;

    try {
      const data = await api.getShare(shareId);
      setShare(data);
    } catch (error: any) {
      console.error("Error loading share:", error);
      setError(error.message || "Failed to load shared content");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading shared content...</p>
        </div>
      </div>
    );
  }

  if (error || !share) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Content Not Found
          </h2>
          <p className="text-muted-foreground">
            {error || "The shared link is invalid or has expired."}
          </p>
        </div>
      </div>
    );
  }

  const roomId =
    share.type === "SLIDE"
      ? `slide-${share.slideId}`
      : `presentation-${share.presentationId}`;

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
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Connecting...</p>
            </div>
          </div>
        }
      >
        <SharedContent share={share} />
      </Suspense>
    </RoomProvider>
  );
}
