import { Slide } from "../types";
import SlideThumbnail from "./SlideThumbnail";

interface SlidesPanelProps {
  slides: Slide[];
  activeIndex: number;
  onClick: (slide: Slide) => void;
  onDelete: (slide: Slide) => void;
}

const SlidesPanel = ({
  slides,
  activeIndex,
  onClick,
  onDelete,
}: SlidesPanelProps) => {
  return (
    <div className="w-64 bg-muted/30 border-r border-border overflow-y-auto p-4 space-y-4">
      <h3 className="font-semibold text-foreground mb-2">Slides</h3>
      {slides.map((slide, index) => (
        <SlideThumbnail
          key={slide.id}
          slide={slide}
          index={index}
          isActive={index === activeIndex}
          onClick={() => onClick(slide)}
          onDelete={() => onDelete(slide)}
        />
      ))}
    </div>
  );
};

export default SlidesPanel;
