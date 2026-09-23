import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { createLowlight } from "lowlight";
import { afterEach, describe, expect, it } from "vitest";
import { createEnhancedCodeBlock } from "./enhanced-code-block";

let editor: Editor;
afterEach(() => editor?.destroy());

function createCodeEditor(text: string, indentMode = "space", indentWidth = "2") {
  editor = new Editor({
    extensions: [StarterKit.configure({ codeBlock: false }), createEnhancedCodeBlock(createLowlight())],
    content: {
      type: "doc",
      content: [
        { type: "codeBlock", content: [{ type: "text", text: "first" }] },
        { type: "codeBlock", attrs: { indentMode, indentWidth }, content: [{ type: "text", text }] },
        { type: "paragraph", content: [{ type: "text", text: "outside" }] },
      ],
    },
  });
  return editor.state.doc.child(0).nodeSize + 1;
}

function pressTab(shiftKey = false) {
  const event = new KeyboardEvent("keydown", { key: "Tab", code: "Tab", shiftKey, bubbles: true, cancelable: true });
  editor.view.dom.dispatchEvent(event);
  return event.defaultPrevented;
}

describe("code block indentation", () => {
  it.each([["space", "2", "  "], ["space", "4", "    "], ["space", "8", "        "], ["tab", "4", "\t"]])(
    "inserts %s/%s indentation at the second block cursor",
    (mode, width, indent) => {
      const start = createCodeEditor("second", mode, width);
      editor.commands.setTextSelection(start + 3);
      expect(pressTab()).toBe(true);
      expect(editor.state.doc.child(0).textContent).toBe("first");
      expect(editor.state.doc.child(1).textContent).toBe("sec" + indent + "ond");
      expect(editor.state.selection.from).toBe(start + 3 + indent.length);
    },
  );

  it("indents selected complete lines and preserves selection through reverse indentation", () => {
    const start = createCodeEditor("one\ntwo\nthree");
    editor.commands.setTextSelection({ from: start, to: start + 8 });
    expect(pressTab()).toBe(true);
    expect(editor.state.doc.child(1).textContent).toBe("  one\n  two\nthree");
    expect(editor.state.selection.from).toBe(start + 2);
    expect(editor.state.selection.to).toBe(start + 12);
    expect(pressTab(true)).toBe(true);
    expect(editor.state.doc.child(1).textContent).toBe("one\ntwo\nthree");
    expect(editor.state.selection.from).toBe(start);
    expect(editor.state.selection.to).toBe(start + 8);
  });

  it("unindents only the current line and does not change the first block", () => {
    const start = createCodeEditor("  one\n\ttwo");
    editor.commands.setTextSelection(start + 8);
    expect(pressTab(true)).toBe(true);
    expect(editor.state.doc.child(1).textContent).toBe("  one\ntwo");
    expect(editor.state.doc.child(0).textContent).toBe("first");
  });

  it("keeps an empty first line and groups multiline indentation into one undo step", () => {
    const start = createCodeEditor("\nsecond");
    editor.commands.setTextSelection({ from: start, to: start + 7 });
    expect(pressTab()).toBe(true);
    expect(editor.state.doc.child(1).textContent).toBe("  \n  second");
    editor.commands.undo();
    expect(editor.state.doc.child(1).textContent).toBe("\nsecond");
  });

  it("consumes Shift-Tab on an unindented line without moving the cursor", () => {
    const start = createCodeEditor("second");
    editor.commands.setTextSelection(start);
    expect(pressTab(true)).toBe(true);
    expect(editor.state.doc.child(1).textContent).toBe("second");
    expect(editor.state.selection.from).toBe(start);
  });

  it("leaves ordinary paragraphs and selections spanning blocks alone", () => {
    const start = createCodeEditor("second");
    editor.commands.setTextSelection({ from: 2, to: start + 2 });
    expect(pressTab()).toBe(false);
    editor.commands.setTextSelection(editor.state.doc.content.size - 2);
    expect(pressTab()).toBe(false);
  });
});
