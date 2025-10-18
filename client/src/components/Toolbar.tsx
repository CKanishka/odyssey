import { useState } from "react";
import { FileText, Plus, Share2, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { useOthers } from "../lib/liveblocks";

interface ToolbarProps {
  presentationTitle: string;
  onTitleChange: (title: string) => void;
  onShare: () => void;
  onAddSlide: () => void;
  onBack?: () => void;
  isReadOnly?: boolean;
  isOwner?: boolean;
}

export default function Toolbar({
  presentationTitle,
  onTitleChange,
  onShare,
  onAddSlide,
  onBack,
  isReadOnly = false,
  isOwner = true,
}: ToolbarProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(presentationTitle);
  const others = useOthers();

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (title.trim() !== presentationTitle) {
      onTitleChange(title.trim());
    }
  };

  return (
    <div className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                title="Back to Home"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <FileText className="w-8 h-8 text-primary" />
            {isEditingTitle ? (
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTitleSubmit();
                  if (e.key === "Escape") {
                    setTitle(presentationTitle);
                    setIsEditingTitle(false);
                  }
                }}
                className="text-xl font-semibold border-b-2 border-primary outline-none px-2 py-1 h-auto"
                autoFocus
              />
            ) : (
              <h1
                className={`text-xl font-semibold px-2 py-1 ${
                  !isReadOnly
                    ? "cursor-pointer hover:text-primary transition-colors underline"
                    : ""
                }`}
                onClick={() => !isReadOnly && setIsEditingTitle(true)}
              >
                {presentationTitle}
              </h1>
            )}
            {isReadOnly && (
              <span className="text-sm text-muted-foreground bg-secondary px-2 py-1 rounded">
                View Only
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
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

          {/* Action buttons */}
          {!isReadOnly && (
            <Button onClick={onAddSlide} variant="secondary">
              <Plus className="mr-2 h-4 w-4" />
              Add Slide
            </Button>
          )}
          {isOwner && (
            <Button onClick={onShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
