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

/**
 * 检查位置 i 是否是指定标签的开始
 * @param html HTML 字符串
 * @param i 当前位置
 * @param tagName 标签名（小写）
 */
function isTagStartAt(html: string, i: number, tagName: string): boolean {
  const tagLen = tagName.length;
  if (html[i] !== "<") return false;

  // 检查标签名（不区分大小写）
  for (let j = 0; j < tagLen; j++) {
    const c = html[i + 1 + j];
    if (c?.toLowerCase() !== tagName[j]) return false;
  }

  // 标签名后必须是空格或 >
  const nextChar = html[i + 1 + tagLen];
  return (
    nextChar === " " ||
    nextChar === ">" ||
    nextChar === "\n" ||
    nextChar === "\t" ||
    nextChar === "\r" ||
    nextChar === "/"
  );
}

/**
 * 检查位置 i 是否是指定标签的结束
 * @param html HTML 字符串
 * @param i 当前位置
 * @param tagName 标签名（小写）
 */
function isTagEndAt(html: string, i: number, tagName: string): boolean {
  const tagLen = tagName.length;
  if (html[i] !== "<" || html[i + 1] !== "/") return false;

  // 检查标签名（不区分大小写）
  for (let j = 0; j < tagLen; j++) {
    const c = html[i + 2 + j];
    if (c?.toLowerCase() !== tagName[j]) return false;
  }

  // 标签名后必须是空格或 >
  const nextChar = html[i + 2 + tagLen];
  return (
    nextChar === " " ||
    nextChar === ">" ||
    nextChar === "\n" ||
    nextChar === "\t" ||
    nextChar === "\r"
  );
}

/**
 * 查找匹配的结束标签位置
 * @param html HTML 字符串
 * @param startPos 开始位置
 * @param tagName 标签名（小写）
 */
function findMatchingTagEnd(
  html: string,
  startPos: number,
  tagName: string
): number {
  let depth = 0;
  for (let i = startPos; i < html.length; i++) {
    if (isTagStartAt(html, i, tagName)) {
      // 检查是否是自闭合标签
      const closePos = html.indexOf(">", i);
      if (closePos !== -1 && html[closePos - 1] === "/") {
        // 自闭合标签，不增加深度
        continue;
      }
      depth++;
      continue;
    }
    if (isTagEndAt(html, i, tagName)) {
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
 * 并返回可用于"进入视口再注入"的原始 slice 索引。
 *
 * 目的：避免首屏/TOC 解析/DOM 插入时一次性解析海量 SVG DOM。
 *
 * 支持 <p> 和 <div> 两种包裹标签。
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

  // 匹配含 class 的 <p ...> 或 <div ...> 起始标签，然后再确认 class 里包含 md-editor-mermaid
  // 支持 <p> 和 <div> 两种标签
  const startTagRegex = /<(p|div)\b[^>]*\bclass=(["'])([^"']*?)\2[^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = startTagRegex.exec(rawHtml))) {
    const tagName = match[1].toLowerCase(); // "p" 或 "div"
    const classValue = match[3] || "";

    if (!classValue.includes("md-editor-mermaid")) {
      continue;
    }

    const startPos = match.index;
    const endPos = findMatchingTagEnd(rawHtml, startPos, tagName);

    if (endPos <= startPos) {
      console.warn(
        `[virtualizeMermaid] 未找到匹配的 </${tagName}> 标签，跳过此块`
      );
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

    // 使用相同的标签名闭合
    virtualHtml +=
      injected +
      '<span class="md-editor-mermaid-placeholder">Mermaid 图表加载中...</span>' +
      `</${tagName}>`;

    lastPos = endPos;
    // 跳过该 mermaid 块内部，避免命中嵌套标签
    startTagRegex.lastIndex = endPos;
  }

  virtualHtml += rawHtml.slice(lastPos);

  // 调试日志
  if (count > 0) {
    console.log(
      `[virtualizeMermaid] 处理了 ${count} 个 Mermaid 块:`,
      Object.keys(blocks)
    );
  }

  return {
    rawHtml,
    virtualHtml,
    blocks,
    count
  };
}
