import { useCallback, useEffect, useRef, useState } from "react";
import { EditorView } from "prosemirror-view";
import * as Y from "yjs";
import { useSelf } from "../lib/liveblocks";
import { Awareness } from "y-protocols/awareness";
import { api } from "../lib/api";
import { debounce } from "../lib/debounce";
import { createProseMirrorViewForSlide } from "../lib/proseMirror";
import EditorToolbar from "./EditorToolbar";
import { Command, EditorState } from "prosemirror-state";
import { Schema } from "prosemirror-model";

interface CollaborativeEditorProps {
  slideId: string;
  yDoc: Y.Doc;
  provider: any;
  isReadOnly?: boolean;
}

export default function CollaborativeEditor({
  slideId,
  yDoc,
  provider: _provider,
  isReadOnly = false,
}: CollaborativeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const self = useSelf();

  const viewRef = useRef<EditorView | null>(null);
  const schemaRef = useRef<Schema | null>(null);
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [draggable, setDraggable] = useState(false);

  const saveContent = useCallback(
    async (content: any) => {
      try {
        await api.updateSlideContent(slideId, content);
        console.log("Content saved to database");
      } catch (error) {
        console.error("Failed to save to database:", error);
      }
    },
    [slideId]
  );

  // Create debounced save function
  const debouncedSave = useCallback(debounce(saveContent, 3000), [saveContent]);

  useEffect(() => {
    return () => {
      // Flush any pending saves when component unmounts
      debouncedSave.flush();
    };
  }, []);

  useEffect(() => {
    if (!editorRef.current || !yDoc || !self) return;

    // Create awareness for collaborative cursors
    const awareness = new Awareness(yDoc);

    // Use user info from Liveblocks session
    awareness.setLocalStateField("user", {
      name: self.info?.name || "Anonymous",
      color: self.info?.color || "gray",
    });

    const { view, schema } = createProseMirrorViewForSlide({
      slideId,
      yDoc,
      editorRef,
      awareness,
      draggable,
      editorViewProps: {
        editable: () => !isReadOnly,
        dispatchTransaction(tr) {
          if (!viewRef.current) return;
          // Apply the transaction to get the new state
          const newState = viewRef.current.state.apply(tr);
          viewRef.current.updateState(newState);

          setEditorState(newState);

          // Save to database when content changes
          if (!isReadOnly && tr.docChanged) {
            const doc = newState.doc.toJSON();
            debouncedSave(doc);
          }
        },
      },
    });

    schemaRef.current = schema;
    viewRef.current = view;
    setEditorState(viewRef.current?.state);

    return () => {
      // Flush any pending saves before destroying editor
      if (!isReadOnly) {
        debouncedSave.flush();
      }
      view.destroy();
    };
  }, [slideId, yDoc, isReadOnly, self, draggable]);

  const applyCommand = (command: Command) => {
    if (!viewRef.current) return;
    command(viewRef.current.state, viewRef.current.dispatch);
    viewRef.current.focus();
  };

  return (
    <div
      className={`prosemirror-editor-wrapper bg-card rounded-lg shadow-sm border border-border ${
        isReadOnly ? "opacity-90" : ""
      }`}
    >
      {isReadOnly && (
        <div className="text-sm text-muted-foreground mb-2 px-4 pt-4">
          <span className="bg-secondary px-2 py-1 rounded">
            Read Only - You can view but not edit this content
          </span>
        </div>
      )}
      <EditorToolbar
        editorState={editorState}
        schema={schemaRef.current}
        applyCommand={applyCommand}
        isReadOnly={isReadOnly}
        draggable={draggable}
        onDraggableChange={setDraggable}
      />
      <div
        ref={editorRef}
        className="prose max-w-none p-4 h-[500px] overflow-y-auto"
      />
    </div>
  );
}
