import { X } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Slide } from "../types";
import { cn } from "../lib/utils";

interface SlideThumbnailProps {
  slide: Slide;
  index: number;
  isActive: boolean;
  onClick: () => void;
  onDelete?: () => void;
  isDragging?: boolean;
}

export default function SlideThumbnail({
  slide,
  index,
  isActive,
  onClick,
  onDelete,
  isDragging,
}: SlideThumbnailProps) {
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
      <div className="bg-card border border-border rounded-lg overflow-hidden aspect-video">
        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs p-2">
          <span className="font-medium">Slide {index + 1}</span>
        </div>
      </div>

      <Badge className="absolute top-2 left-2 shadow-sm">{index + 1}</Badge>

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
