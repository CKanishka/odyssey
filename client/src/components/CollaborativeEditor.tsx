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
  const [editorState, setEditorState] = useState<EditorState | null>(null);

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

    let view: EditorView | null = null;
    view = createProseMirrorViewForSlide(slideId, yDoc, editorRef, awareness, {
      editable: () => !isReadOnly,
      dispatchTransaction(tr) {
        if (!view) return;
        // Apply the transaction to get the new state
        const newState = view.state.apply(tr);
        view.updateState(newState);

        setEditorState(newState);

        // Save to database when content changes
        if (!isReadOnly && tr.docChanged) {
          const doc = newState.doc.toJSON();
          debouncedSave(doc);
        }
      },
    });

    viewRef.current = view;
    setEditorState(view.state);

    return () => {
      // Flush any pending saves before destroying editor
      if (!isReadOnly) {
        debouncedSave.flush();
      }
      view.destroy();
    };
  }, [slideId, yDoc, isReadOnly, self]);

  const applyCommand = (command: Command) => {
    if (!viewRef.current) return;
    command(viewRef.current.state, viewRef.current.dispatch);
    viewRef.current.focus();
  };

  return (
    <div
      className={`prosemirror-editor-wrapper bg-card rounded-lg shadow-sm border border-border min-h-[500px] ${
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
        applyCommand={applyCommand}
        isReadOnly={isReadOnly}
      />
      <div ref={editorRef} className="prose max-w-none p-4" />
    </div>
  );
}
