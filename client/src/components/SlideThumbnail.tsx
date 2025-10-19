import { X, GripVertical } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { useEffect, useRef } from "react";
import { createProseMirrorViewForSlide } from "../lib/proseMirror";
import { useDrag, useDrop } from "react-dnd";
import * as Y from "yjs";

interface SlideThumbnailProps {
  slideId: string;
  yDoc: Y.Doc;
  index: number;
  isActive: boolean;
  onClick: () => void;
  onDelete?: () => void;
  onReorder?: (dragIndex: number, hoverIndex: number) => void;
}

export default function SlideThumbnail({
  slideId,
  yDoc,
  index,
  isActive,
  onClick,
  onDelete,
  onReorder,
}: SlideThumbnailProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const canDrag = typeof onReorder === "function";

  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: "SLIDE",
      item: { index, slideId },
      canDrag: () => canDrag,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [index, slideId, canDrag]
  );

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: "SLIDE",
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
      canDrop: (item: { index: number }) => {
        return item.index !== index;
      },
      drop: (item: { index: number }) => {
        if (onReorder) {
          onReorder(item.index, index);
        }
      },
    }),
    [index, onReorder]
  );

  // Connect drag to the entire component
  drag(containerRef);
  // Connect drop to the entire component
  drop(preview(containerRef));

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
      ref={containerRef}
      className={cn(
        "relative group transition-all duration-200 rounded-lg",
        isActive
          ? "ring-2 ring-primary shadow-lg"
          : "hover:ring-2 hover:ring-accent",
        isDragging && "opacity-30 scale-95",
        isOver && "ring-2 ring-blue-500"
      )}
    >
      <div className="cursor-pointer" onClick={onClick}>
        <div className="bg-card border border-border rounded-lg overflow-hidden aspect-video p-6">
          <div ref={editorRef} className="prose p-4" style={{ zoom: 0.4 }} />
        </div>

        <Badge className="absolute top-2 left-2 shadow-sm z-10">
          {index + 1}
        </Badge>

        {canDrag && (
          <div
            className="absolute top-2 left-10 h-6 w-6 bg-background/80 backdrop-blur-sm rounded border border-border opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing flex items-center justify-center"
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        )}

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
    </div>
  );
}
