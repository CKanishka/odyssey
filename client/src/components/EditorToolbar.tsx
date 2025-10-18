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
} from "lucide-react";
import { toggleMark, setBlockType } from "prosemirror-commands";
import { customProseMirrorSchema } from "../lib/proseMirror";
import { Command, EditorState } from "prosemirror-state";
import { wrapInList } from "prosemirror-schema-list";

interface EditorToolbarProps {
  editorState: EditorState | null;
  applyCommand: (command: Command) => void;
  isReadOnly: boolean;
}

export default function EditorToolbar({
  editorState,
  applyCommand,
  isReadOnly,
}: EditorToolbarProps) {
  if (!editorState || isReadOnly) return null;

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

  return (
    <div className="flex items-center gap-1 p-2 border-b border-border bg-card/50 flex-wrap">
      {/* Text Formatting */}
      <div className="flex items-center gap-1 px-2 border-r border-border">
        <ToolbarButton
          onClick={() =>
            applyCommand(toggleMark(customProseMirrorSchema.marks.strong))
          }
          active={isActive("mark", "strong")}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            applyCommand(toggleMark(customProseMirrorSchema.marks.em))
          }
          active={isActive("mark", "em")}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            applyCommand(toggleMark(customProseMirrorSchema.marks.underline))
          }
          active={isActive("mark", "underline")}
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Heading Levels */}
      <div className="flex items-center gap-1 px-2 border-r border-border">
        <ToolbarButton
          onClick={() =>
            applyCommand(setBlockType(customProseMirrorSchema.nodes.paragraph))
          }
          active={isActive("node", "paragraph")}
          title="Paragraph"
        >
          <Type className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            applyCommand(
              setBlockType(customProseMirrorSchema.nodes.heading, { level: 1 })
            )
          }
          active={isActive("node", "heading", { level: 1 })}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            applyCommand(
              setBlockType(customProseMirrorSchema.nodes.heading, { level: 2 })
            )
          }
          active={isActive("node", "heading", { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            applyCommand(
              setBlockType(customProseMirrorSchema.nodes.heading, { level: 3 })
            )
          }
          active={isActive("node", "heading", { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Lists */}
      <div className="flex items-center gap-1 px-2">
        <ToolbarButton
          onClick={() =>
            applyCommand(wrapInList(customProseMirrorSchema.nodes.bullet_list))
          }
          active={isActive("node", "bullet_list")}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            applyCommand(wrapInList(customProseMirrorSchema.nodes.ordered_list))
          }
          active={isActive("node", "ordered_list")}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
      </div>

      <div className="ml-auto text-xs text-muted-foreground px-2">
        Drag blocks to reorder
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
