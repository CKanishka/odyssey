import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Slide } from "../types";
import SlideThumbnail from "./SlideThumbnail";
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
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorder) return;

    let oldIndex = -1,
      newIndex = -1;
    slides.forEach((s, index) => {
      if (s.id === active.id) oldIndex = index;
      if (s.id === over.id) newIndex = index;
    });

    if (oldIndex !== -1 && newIndex !== -1) {
      onReorder(oldIndex, newIndex);
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="w-64 bg-muted/30 border-r border-border h-full flex flex-col">
        <h3 className="font-semibold text-foreground mb-2 px-4 pt-4">Slides</h3>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <SortableContext
            items={slides.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
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
          </SortableContext>
        </div>
      </div>
    </DndContext>
  );
};

export default SlidesPanel;
