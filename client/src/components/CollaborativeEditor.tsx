import { useEffect, useRef, useState } from "react";
import { EditorState, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema } from "prosemirror-model";
import { schema } from "prosemirror-schema-basic";
import { addListNodes } from "prosemirror-schema-list";
import { keymap } from "prosemirror-keymap";
import { baseKeymap } from "prosemirror-commands";
import { dropCursor } from "prosemirror-dropcursor";
import { gapCursor } from "prosemirror-gapcursor";
import * as Y from "yjs";
import {
  ySyncPlugin,
  yCursorPlugin,
  yUndoPlugin,
  undo as yUndo,
  redo as yRedo,
  prosemirrorJSONToYXmlFragment,
} from "y-prosemirror";
import { useRoom } from "../lib/liveblocks";
import { Awareness } from "y-protocols/awareness";
import { api } from "../lib/api";
import { debounce } from "../lib/debounce";

// Extend the basic schema with list nodes
const mySchema = new Schema({
  nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
  marks: schema.spec.marks,
});

interface CollaborativeEditorProps {
  slideId: string;
  yDoc: Y.Doc;
  provider: any;
}

export default function CollaborativeEditor({
  slideId,
  yDoc,
  provider: _provider,
}: CollaborativeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const room = useRoom();
  const [isInitialized, setIsInitialized] = useState(false);
  const saveToDatabase = useRef<ReturnType<typeof debounce>>();

  // Load initial content from database
  useEffect(() => {
    if (!yDoc || isInitialized || !_provider) return;

    const loadInitialContent = async () => {
      try {
        // Wait a brief moment for Liveblocks to sync existing content
        // This prevents race conditions when opening multiple tabs
        await new Promise((resolve) => setTimeout(resolve, 300));

        const type = yDoc.get(
          `slide-${slideId}`,
          Y.XmlFragment
        ) as Y.XmlFragment;

        // Only load from DB if Yjs doc is empty and DB has content
        if (type.length === 0) {
          const slide = await api.getSlide(slideId);

          if (
            slide.content &&
            typeof slide.content === "object" &&
            Object.keys(slide.content).length > 0
          ) {
            // Double-check it's still empty after fetching from DB
            if (type.length === 0) {
              // Convert JSON to Yjs fragment
              prosemirrorJSONToYXmlFragment(mySchema, slide.content, type);
              console.log("Loaded initial content from database");
            }
          }
        }
      } catch (error) {
        console.error("Failed to load initial content:", error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadInitialContent();
  }, [slideId, yDoc, isInitialized, _provider]);

  // Create debounced save function
  useEffect(() => {
    const debouncedSave = debounce(async (content: any) => {
      try {
        await api.updateSlideContent(slideId, content);
        console.log("Content saved to database");
      } catch (error) {
        console.error("Failed to save to database:", error);
      }
    }, 3000); // Save 3 seconds after last change

    saveToDatabase.current = debouncedSave;

    return () => {
      // Flush any pending saves when component unmounts
      debouncedSave.flush();
    };
  }, [slideId]);

  useEffect(() => {
    if (!editorRef.current || !yDoc || !isInitialized) return;

    const type = yDoc.get(`slide-${slideId}`, Y.XmlFragment) as Y.XmlFragment;

    // Create awareness for collaborative cursors
    const awareness = new Awareness(yDoc);
    const userId = localStorage.getItem("odyssey-user-id") || "anonymous";
    const color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;

    awareness.setLocalStateField("user", {
      name: `User ${userId.substring(0, 8)}`,
      color: color,
    });

    const state = EditorState.create({
      schema: mySchema,
      plugins: [
        ySyncPlugin(type),
        yCursorPlugin(awareness),
        yUndoPlugin(),
        keymap({
          "Mod-z": yUndo,
          "Mod-y": yRedo,
          "Mod-Shift-z": yRedo,
        }),
        keymap(baseKeymap),
        dropCursor(),
        gapCursor(),
      ],
    });

    const view = new EditorView(editorRef.current, {
      state,
    });

    // Override dispatchTransaction after view is created
    const originalDispatch = view.dispatch.bind(view);
    view.dispatch = (tr: Transaction) => {
      originalDispatch(tr);

      // Save to database when content changes
      if (tr.docChanged && saveToDatabase.current) {
        const doc = view.state.doc.toJSON();
        saveToDatabase.current(doc);
      }
    };

    viewRef.current = view;

    return () => {
      // Flush any pending saves before destroying editor
      if (saveToDatabase.current) {
        saveToDatabase.current.flush();
      }
      view.destroy();
      viewRef.current = null;
    };
  }, [slideId, yDoc, room, isInitialized]);

  return (
    <div className="prosemirror-editor-wrapper bg-card rounded-lg shadow-sm border border-border min-h-[500px]">
      <div ref={editorRef} className="prose max-w-none" />
    </div>
  );
}
