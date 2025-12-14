export interface MermaidBlockIndex {
  start: number;
  end: number;
}

export interface MermaidVirtualizeResult {
  /** 原始 HTML（包含完整 SVG） */
  rawHtml: string;
  /** 虚拟化后的 HTML（mermaid 块被替换为占位符，不包含 SVG DOM） */
  virtualHtml: string;
  /** mermaid 占位符 id -> 原始 HTML slice 位置 */
  blocks: Record<string, MermaidBlockIndex>;
  count: number;
}

function isPStartAt(html: string, i: number) {
  // "<p" + (whitespace | ">")
  return (
    html[i] === "<" &&
    (html[i + 1] === "p" || html[i + 1] === "P") &&
    (html[i + 2] === " " ||
      html[i + 2] === ">" ||
      html[i + 2] === "\n" ||
      html[i + 2] === "\t" ||
      html[i + 2] === "\r")
  );
}

function isPEndAt(html: string, i: number) {
  // "</p" + (whitespace | ">")
  return (
    html[i] === "<" &&
    html[i + 1] === "/" &&
    (html[i + 2] === "p" || html[i + 2] === "P") &&
    (html[i + 3] === " " ||
      html[i + 3] === ">" ||
      html[i + 3] === "\n" ||
      html[i + 3] === "\t" ||
      html[i + 3] === "\r")
  );
}

function findMatchingPBlockEnd(html: string, startPos: number): number {
  let depth = 0;
  for (let i = startPos; i < html.length; i++) {
    if (isPStartAt(html, i)) {
      depth++;
      continue;
    }
    if (isPEndAt(html, i)) {
      depth--;
      if (depth === 0) {
        const endGt = html.indexOf(">", i);
        return endGt === -1 ? -1 : endGt + 1;
      }
    }
  }
  return -1;
}

function injectAttrsToStartTag(startTag: string, attrs: string) {
  // 仅在闭合 ">" 前插入属性
  return startTag.replace(/>$/, `${attrs}>`);
}

/**
 * 将文章 HTML 中的 Mermaid 块（.md-editor-mermaid）替换为轻量占位符，
 * 并返回可用于“进入视口再注入”的原始 slice 索引。
 *
 * 目的：避免首屏/TOC 解析/DOM 插入时一次性解析海量 SVG DOM。
 */
export function virtualizeMermaidBlocks(html: string): MermaidVirtualizeResult {
  const rawHtml = html || "";
  if (!rawHtml || !rawHtml.includes("md-editor-mermaid")) {
    return {
      rawHtml,
      virtualHtml: rawHtml,
      blocks: {},
      count: 0
    };
  }

  const blocks: Record<string, MermaidBlockIndex> = {};
  let virtualHtml = "";
  let lastPos = 0;
  let count = 0;

  // 匹配含 class 的 <p ...> 起始标签，然后再确认 class 里包含 md-editor-mermaid
  const startTagRegex = /<p\b[^>]*\bclass=(["'])([^"']*?)\1[^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = startTagRegex.exec(rawHtml))) {
    const classValue = match[2] || "";
    if (!classValue.includes("md-editor-mermaid")) {
      continue;
    }

    const startPos = match.index;
    const endPos = findMatchingPBlockEnd(rawHtml, startPos);
    if (endPos <= startPos) {
      continue;
    }

    virtualHtml += rawHtml.slice(lastPos, startPos);

    const id = `mmd-${count++}`;
    blocks[id] = { start: startPos, end: endPos };

    const startTag = match[0];
    const injected = injectAttrsToStartTag(
      startTag,
      ` data-mermaid-virtual="1" data-mermaid-vid="${id}" `
    );

    virtualHtml +=
      injected +
      '<span class="md-editor-mermaid-placeholder">Mermaid 图表加载中...</span>' +
      "</p>";

    lastPos = endPos;
    // 跳过该 mermaid 块内部，避免命中嵌套 <p>
    startTagRegex.lastIndex = endPos;
  }

  virtualHtml += rawHtml.slice(lastPos);

  return {
    rawHtml,
    virtualHtml,
    blocks,
    count
  };
}


