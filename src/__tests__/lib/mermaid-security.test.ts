import { describe, expect, it } from "vitest";
import { sanitizeMermaidSvg } from "@/lib/mermaid-security";

describe("Mermaid SVG security", () => {
  it("removes executable content while preserving diagram labels and geometry", () => {
    const safe = sanitizeMermaidSvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" onload="alert(1)"><style>.node { fill: red }</style><path d="M0 0L10 10"/><text>正常图表</text><foreignObject><div xmlns="http://www.w3.org/1999/xhtml"><img src="x" onerror="alert(1)"/>标签<script>alert(1)</script></div></foreignObject><a href="javascript:alert(1)">危险链接</a></svg>`);
    const container = document.createElement("div");
    container.innerHTML = safe;
    expect(container.querySelector("svg")?.getAttribute("viewBox")).toBe("0 0 100 100");
    expect(container.querySelector("path")).not.toBeNull();
    expect(container.textContent).toContain("正常图表");
    expect(container.textContent).toContain("标签");
    expect(container.querySelector("script, [onload], [onerror], [href^='javascript:']")).toBeNull();
  });
});
