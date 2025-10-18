import { cn } from "../lib/utils";
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  GripVertical,
} from "lucide-react";
import { toggleMark, setBlockType } from "prosemirror-commands";
import { setTextAlign } from "../lib/proseMirror";
import { Command, EditorState } from "prosemirror-state";
import { wrapInList } from "prosemirror-schema-list";
import { useMemo } from "react";
import { Schema } from "prosemirror-model";

interface EditorToolbarProps {
  editorState: EditorState | null;
  isReadOnly: boolean;
  schema: Schema | null;
  draggable: boolean;
  applyCommand: (command: Command) => void;
  onDraggableChange: (enabled: boolean) => void;
}

export default function EditorToolbar({
  editorState,
  isReadOnly,
  draggable,
  schema,
  applyCommand,
  onDraggableChange,
}: EditorToolbarProps) {
  if (!editorState || !schema || isReadOnly) return null;

  const isActive = (type: "mark" | "node", name: string, attrs?: any) => {
    const { $from } = editorState.selection;

    if (type === "mark") {
      const markType = editorState.schema.marks[name];
      if (!markType) return false;
      const { from, to, empty } = editorState.selection;
      if (empty) {
        return !!markType.isInSet(editorState.storedMarks || $from.marks());
      }
      return editorState.doc.rangeHasMark(from, to, markType);
    } else {
      const nodeType = editorState.schema.nodes[name];
      if (!nodeType) return false;

      // Check the parent block node where cursor is located
      let node = $from.parent;
      let depth = $from.depth;

      // Find the closest block node
      while (depth > 0 && node.type.name === "doc") {
        depth--;
        node = $from.node(depth);
      }

      // Check if it matches the type
      if (node.type !== nodeType) {
        return false;
      }

      // If attributes specified, check if they all match
      if (attrs) {
        return Object.keys(attrs).every(
          (key) => node.attrs[key] === attrs[key]
        );
      }
      return true;
    }
  };

  const currentAlignment = useMemo(() => {
    const { $from } = editorState.selection;
    const node = $from.parent;
    return (node.attrs.textAlign as "left" | "center" | "right") || "left";
  }, [editorState]);

  return (
    <div className="flex items-center gap-1 p-2 border-b border-border bg-card/50 flex-wrap">
      {/* Text Formatting */}
      <div className="flex items-center gap-1 px-2 border-r border-border">
        <ToolbarButton
          onClick={() => applyCommand(toggleMark(schema.marks.strong))}
          active={isActive("mark", "strong")}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => applyCommand(toggleMark(schema.marks.em))}
          active={isActive("mark", "em")}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => applyCommand(toggleMark(schema.marks.underline))}
          active={isActive("mark", "underline")}
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Heading Levels */}
      <div className="flex items-center gap-1 px-2 border-r border-border">
        <ToolbarButton
          onClick={() => applyCommand(setBlockType(schema.nodes.paragraph))}
          active={isActive("node", "paragraph")}
          title="Paragraph"
        >
          <Type className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            applyCommand(setBlockType(schema.nodes.heading, { level: 1 }))
          }
          active={isActive("node", "heading", { level: 1 })}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            applyCommand(setBlockType(schema.nodes.heading, { level: 2 }))
          }
          active={isActive("node", "heading", { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            applyCommand(setBlockType(schema.nodes.heading, { level: 3 }))
          }
          active={isActive("node", "heading", { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Lists */}
      <div className="flex items-center gap-1 px-2 border-r border-border">
        <ToolbarButton
          onClick={() => applyCommand(wrapInList(schema.nodes.bullet_list))}
          active={isActive("node", "bullet_list")}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => applyCommand(wrapInList(schema.nodes.ordered_list))}
          active={isActive("node", "ordered_list")}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Text Alignment */}
      <div className="flex items-center gap-1 px-2">
        <ToolbarButton
          onClick={() => applyCommand(setTextAlign("left"))}
          active={currentAlignment === "left"}
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => applyCommand(setTextAlign("center"))}
          active={currentAlignment === "center"}
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => applyCommand(setTextAlign("right"))}
          active={currentAlignment === "right"}
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>
      </div>

      <div className="ml-auto flex items-center gap-2 px-2">
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
          <input
            type="checkbox"
            checked={draggable}
            onChange={(e) => onDraggableChange(e.target.checked)}
            className="w-4 h-4 rounded border-border bg-background cursor-pointer"
          />
          <GripVertical className="w-4 h-4" />
          <span>Drag Mode</span>
        </label>
      </div>
    </div>
  );
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title: string;
}

function ToolbarButton({
  onClick,
  active,
  children,
  title,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "p-2 rounded hover:bg-accent transition-colors",
        active ? "bg-accent text-primary" : "text-muted-foreground"
      )}
    >
      {children}
    </button>
  );
}
