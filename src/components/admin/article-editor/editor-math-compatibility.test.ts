import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TurndownService from "turndown";
import katex from "katex";
import { marked } from "marked";
import { registerMarkedExtensions } from "@/lib/marked-extensions";
import { afterEach, describe, expect, it } from "vitest";
import { MathBlock } from "./extensions/math-block";
import { MathInline } from "./extensions/math-inline";
import { registerCustomRules } from "@/lib/turndown-rules";
import { processHtmlForSave } from "@/lib/content-processor";
import { renderKatexInElement } from "@/lib/katex-render";

let editor: Editor;
afterEach(() => editor?.destroy());

describe("historical formula compatibility", () => {
  it("renders raw eqnarray delimiters alongside structured legacy formulas", async () => {
    const root = document.createElement("div");
    root.innerHTML = '<span class="md-editor-katex-inline">x^2</span>';
    const raw = document.createElement("p");
    raw.textContent = String.raw`$$\begin{eqnarray}a&=&b\\c&=&d\end{eqnarray}$$`;
    root.append(raw);
    await renderKatexInElement(root);
    expect(root.querySelectorAll(".katex")).toHaveLength(2);
    expect(root.querySelector(".katex-error")).toBeNull();
  });

  it("keeps unsupported syntax visible as an error without losing the source", async () => {
    const root = document.createElement("div");
    const formula = document.createElement("div");
    formula.dataset.type = "math-block";
    formula.dataset.latex = String.raw`\begin{unknown}x\end{unknown}`;
    root.append(formula);
    await renderKatexInElement(root);
    expect(root.querySelector(".katex-error")).not.toBeNull();
    expect(formula.dataset.latex).toBe(String.raw`\begin{unknown}x\end{unknown}`);
  });

  it("keeps old raw wrappers as formula nodes across HTML and Markdown round trips", () => {
    editor = new Editor({
      extensions: [StarterKit, MathBlock, MathInline],
      content: '<p>before <span class="md-editor-katex-inline">x^2+y</span> after</p><div class="md-editor-katex-block">a^2+b^2=c^2</div>',
    });
    expect(editor.getJSON().content?.[0].content?.[1]).toMatchObject({ type: "mathInline", attrs: { latex: "x^2+y" } });
    expect(editor.getJSON().content?.[1]).toMatchObject({ type: "mathBlock", attrs: { latex: "a^2+b^2=c^2" } });
    const saved = processHtmlForSave(editor.getHTML());
    editor.commands.setContent(saved);
    expect(editor.getJSON().content?.[1]).toMatchObject({ type: "mathBlock", attrs: { latex: "a^2+b^2=c^2" } });
    const td = new TurndownService();
    registerCustomRules(td);
    expect(td.turndown(saved)).toBe("before $x^2+y$ after\n\n$$\na^2+b^2=c^2\n$$");
  });

  it("uses the original annotation instead of rendered glyph text in old wrappers", () => {
    const rendered = katex.renderToString("x^2", { displayMode: true });
    editor = new Editor({ extensions: [StarterKit, MathBlock, MathInline], content: '<div class="md-editor-katex-block">' + rendered + "</div>" });
    expect(editor.getJSON().content?.[0]).toMatchObject({ type: "mathBlock", attrs: { latex: "x^2" } });
  });

  it.each(["eqnarray", "eqnarray*"])("renders %s without altering the saved source", async env => {
    const latex = "\\begin{" + env + "}a&=&b\\\\c&=&d\\end{" + env + "}";
    const content = document.createElement("div");
    const formula = document.createElement("div");
    formula.dataset.type = "math-block";
    formula.dataset.latex = latex;
    content.append(formula);
    await renderKatexInElement(content);
    expect(content.querySelector(".katex-error")).toBeNull();
    expect(content.querySelector(".katex")).not.toBeNull();
    expect(formula.dataset.latex).toBe(latex);

    editor = new Editor({ extensions: [StarterKit, MathBlock, MathInline], content: content.innerHTML });
    const html = editor.getHTML();
    expect(html).not.toContain("katex-error");
    const td = new TurndownService();
    registerCustomRules(td);
    expect(td.turndown(html)).toBe("$$\n" + latex + "\n$$");
    registerMarkedExtensions(marked);
    editor.commands.setContent(marked.parse(td.turndown(html), { async: false }) as string);
    expect(editor.getJSON().content?.[0]).toMatchObject({ type: "mathBlock", attrs: { latex } });
    expect(editor.getHTML()).not.toContain("katex-error");
  });
});
