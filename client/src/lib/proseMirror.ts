import { baseKeymap, toggleMark } from "prosemirror-commands";
import { dropCursor } from "prosemirror-dropcursor";
import { gapCursor } from "prosemirror-gapcursor";
import { keymap } from "prosemirror-keymap";
import { Schema } from "prosemirror-model";
import { schema } from "prosemirror-schema-basic";
import { addListNodes } from "prosemirror-schema-list";
import { EditorState } from "prosemirror-state";
import {
  yCursorPlugin,
  ySyncPlugin,
  yUndoPlugin,
  undo as yUndo,
  redo as yRedo,
  initProseMirrorDoc,
} from "y-prosemirror";
import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";
import { DirectEditorProps, EditorView } from "prosemirror-view";

// Extended schema with headings and formatting marks
const baseNodes = schema.spec.nodes;
const extendedNodes = baseNodes
  .update("paragraph", {
    ...baseNodes.get("paragraph")!,
  })
  .addBefore("paragraph", "heading", {
    // Stores the heading level (1-6) as a node attribute
    attrs: { level: { default: 1 } },
    // Can contain inline content (text, bold, italic, etc.) but not other blocks
    content: "inline*",
    // Classified as a block-level element (like div, not span)
    group: "block",
    // Creates a structural boundary - backspace at start won't merge with previous block
    defining: true,

    // Converts HTML tags to ProseMirror nodes when loading from existing content
    parseDOM: [
      { tag: "h1", attrs: { level: 1 } },
      { tag: "h2", attrs: { level: 2 } },
      { tag: "h3", attrs: { level: 3 } },
      { tag: "h4", attrs: { level: 4 } },
      { tag: "h5", attrs: { level: 5 } },
      { tag: "h6", attrs: { level: 6 } },
    ],
    // Converts ProseMirror nodes to HTML tags when saving to database
    toDOM(node: any) {
      return ["h" + node.attrs.level, 0];
    },
  });

const baseMarks = schema.spec.marks;
const extendedMarks = baseMarks.addToEnd("underline", {
  parseDOM: [
    { tag: "u" },
    {
      style: "text-decoration",
      getAttrs: (value: any) => value === "underline" && null,
    },
  ],
  toDOM() {
    return ["u", 0]; // Creates <u> tag, 0 means "put content here"
  },
});

export const customProseMirrorSchema = new Schema({
  nodes: addListNodes(extendedNodes, "paragraph block*", "block"), // Adds list nodes to the schema along with the extended nodes
  marks: extendedMarks, // Adds the extended marks to the schema
});

const getSlideYXmlFragment = (yDoc: Y.Doc, slideId: string) => {
  return yDoc.getXmlFragment(`slide-${slideId}`);
};

export const createProseMirrorViewForSlide = (
  slideId: string,
  yDoc: Y.Doc,
  editorRef: React.RefObject<HTMLDivElement>,
  awareness?: Awareness,
  editorViewProps?: Omit<DirectEditorProps, "state">
) => {
  const yXmlFragment = getSlideYXmlFragment(yDoc, slideId);
  const { doc, mapping } = initProseMirrorDoc(
    yXmlFragment,
    customProseMirrorSchema
  );

  const plugins = [
    ySyncPlugin(yXmlFragment, { mapping }),
    yUndoPlugin(),
    keymap({
      ...baseKeymap,
      "Mod-z": yUndo,
      "Mod-y": yRedo,
      "Mod-Shift-z": yRedo,
      // Text formatting shortcuts
      "Mod-b": toggleMark(customProseMirrorSchema.marks.strong),
      "Mod-i": toggleMark(customProseMirrorSchema.marks.em),
      "Mod-u": toggleMark(customProseMirrorSchema.marks.underline),
    }),
    dropCursor({ color: "#3b82f6", width: 3 }),
    gapCursor(),
  ];

  if (awareness) {
    plugins.push(yCursorPlugin(awareness));
  }

  const state = EditorState.create({
    doc,
    schema: customProseMirrorSchema,
    plugins: plugins,
  });

  const view = new EditorView(editorRef.current, { ...editorViewProps, state });

  return view;
};
