/**
 * KaTeX does not implement eqnarray. Render its three columns as an array;
 * keep the original source in document attributes and Markdown.
 * As with the existing renderer, this does not provide automatic numbering.
 */
export function prepareKatexSource(latex: string): string {
  return latex.replace(
    /\\begin\s*\{(eqnarray\*?)\}([\s\S]*?)\\end\s*\{\1\}/g,
    (_match, _environment: string, body: string) => `\\begin{array}{rcl}${body}\\end{array}`,
  );
}

/** Historic KaTeX HTML may contain both the source annotation and rendered glyphs. */
export function getMathSource(element: Element): string {
  return element.getAttribute("data-latex")
    ?? element.querySelector('annotation[encoding="application/x-tex"]')?.textContent
    ?? element.querySelector("annotation")?.textContent
    ?? element.textContent
    ?? "";
}
