import { X } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { useEffect, useRef } from "react";
import { createProseMirrorViewForSlide } from "../lib/proseMirror";
import * as Y from "yjs";
interface SlideThumbnailProps {
  slideId: string;
  yDoc: Y.Doc;
  index: number;
  isActive: boolean;
  onClick: () => void;
  onDelete?: () => void;
  isDragging?: boolean;
}

export default function SlideThumbnail({
  slideId,
  yDoc,
  index,
  isActive,
  onClick,
  onDelete,
  isDragging,
}: SlideThumbnailProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editorRef.current || !yDoc) return;

    const { view } = createProseMirrorViewForSlide({
      slideId,
      yDoc,
      editorRef,
      editorViewProps: {
        editable: () => false,
      },
    });

    return () => {
      view.destroy();
    };
  }, [slideId, yDoc]);

  return (
    <div
      className={cn(
        "relative group cursor-pointer transition-all duration-200 rounded-lg",
        isActive
          ? "ring-2 ring-primary shadow-lg"
          : "hover:ring-2 hover:ring-accent",
        isDragging ? "opacity-50" : "opacity-100"
      )}
      onClick={onClick}
    >
      <div className="bg-card border border-border rounded-lg overflow-hidden aspect-video p-6">
        <div ref={editorRef} className="prose p-4" style={{ zoom: 0.4 }} />
      </div>

      <Badge className="absolute top-2 left-2 shadow-sm z-10">
        {index + 1}
      </Badge>

      {onDelete && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Delete slide"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
