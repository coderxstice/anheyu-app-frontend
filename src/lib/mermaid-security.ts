import DOMPurify from "dompurify";

/** Preserve Mermaid HTML labels while applying the same sanitizer to every SVG insertion. */
export function sanitizeMermaidSvg(svg: string): string {
  return DOMPurify.sanitize(svg, {
    ADD_TAGS: ["foreignobject"],
    HTML_INTEGRATION_POINTS: { foreignobject: true },
  });
}
