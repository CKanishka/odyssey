import { DndProvider } from "react-dnd";
import { Slide } from "../types";
import SlideThumbnail from "./SlideThumbnail";
import { HTML5Backend } from "react-dnd-html5-backend";
import * as Y from "yjs";
interface SlidesPanelProps {
  slides: Slide[];
  activeIndex: number;
  yDoc: Y.Doc;
  onClick: (slide: Slide) => void;
  onDelete?: (slide: Slide) => void;
  onReorder?: (dragIndex: number, hoverIndex: number) => void;
}

const SlidesPanel = ({
  slides,
  activeIndex,
  yDoc,
  onClick,
  onDelete,
  onReorder,
}: SlidesPanelProps) => {
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="w-64 bg-muted/30 border-r border-border h-full flex flex-col">
        <h3 className="font-semibold text-foreground mb-2 px-4 pt-4">Slides</h3>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {slides.map((slide, index) => (
            <SlideThumbnail
              key={slide.id}
              slideId={slide.id}
              yDoc={yDoc}
              index={index}
              isActive={index === activeIndex}
              onClick={() => onClick(slide)}
              onDelete={onDelete ? () => onDelete(slide) : undefined}
              onReorder={onReorder}
            />
          ))}
        </div>
      </div>
    </DndProvider>
  );
};

export default SlidesPanel;
