import type MarkdownIt from "markdown-it";

// 定义图片项接口
interface GalleryImage {
  url: string;
  title?: string;
  alt?: string;
  desc?: string;
}

export default function galleryPlugin(md: MarkdownIt): void {
  function galleryBlockRule(
    state: any,
    startLine: number,
    endLine: number,
    silent: boolean
  ): boolean {
    const startMarker = ":::";
    const startTag = "gallery";
    let pos = state.bMarks[startLine] + state.tShift[startLine];
    let max = state.eMarks[startLine];

    // 如果行太短，无法包含标记，则跳过
    if (pos + startMarker.length > max) {
      return false;
    }

    // 检查是否是 ::: 开头
    if (
      state.src.charCodeAt(pos) !== 0x3a /* : */ ||
      state.src.charCodeAt(pos + 1) !== 0x3a /* : */ ||
      state.src.charCodeAt(pos + 2) !== 0x3a /* : */
    ) {
      return false;
    }

    // 检查 ::: 后面是否是 gallery
    const params = state.src.slice(pos + startMarker.length, max).trim();
    if (!params.startsWith(startTag)) {
      return false;
    }

    // 解析参数：cols（列数，默认3），gap（间距，默认10px）
    let cols = 3; // 默认 3 列
    let gap = "10px"; // 默认间距
    let ratio = ""; // 图片宽高比，如 16:9, 1:1

    const colsMatch = params.match(/cols=(\d+)/);
    if (colsMatch) {
      cols = Math.min(Math.max(parseInt(colsMatch[1], 10), 1), 6); // 限制在 1-6 之间
    }

    const gapMatch = params.match(/gap=([\d]+(?:px|rem|em)?)/);
    if (gapMatch) {
      gap = gapMatch[1];
      if (!/px|rem|em/.test(gap)) {
        gap = gap + "px";
      }
    }

    const ratioMatch = params.match(/ratio=([\d]+:[\d]+)/);
    if (ratioMatch) {
      ratio = ratioMatch[1];
    }

    // 寻找结束标记 :::
    let nextLine = startLine + 1;
    let endLineFound = false;

    while (nextLine < endLine) {
      pos = state.bMarks[nextLine] + state.tShift[nextLine];
      max = state.eMarks[nextLine];
      const lineText = state.src.slice(pos, max).trim();

      if (lineText === startMarker) {
        endLineFound = true;
        break;
      }
      nextLine++;
    }

    if (!endLineFound) {
      return false;
    }

    if (silent) {
      return true;
    }

    // --- 提取并解析区块内容 ---
    const content = state.src.slice(
      state.bMarks[startLine + 1],
      state.bMarks[nextLine]
    );

    const images: GalleryImage[] = [];
    const lines = content.split("\n");

    // 支持多种格式：
    // 1. Markdown 图片语法: ![alt](url "title")
    // 2. HTML img 标签
    // 3. 参数格式: url=xxx alt=xxx title=xxx desc=xxx
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // 格式1：Markdown 图片语法 ![alt](url "title")
      const mdImageRegex = /!\[(.*?)\]\(([^\s)]+)(?:\s+"([^"]*)")?\)/;
      const mdMatch = trimmedLine.match(mdImageRegex);
      if (mdMatch) {
        images.push({
          alt: mdMatch[1] || "",
          url: mdMatch[2],
          title: mdMatch[3] || ""
        });
        continue;
      }

      // 格式2：HTML img 标签
      const htmlImageRegex = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/i;
      const htmlMatch = trimmedLine.match(htmlImageRegex);
      if (htmlMatch) {
        const altMatch = trimmedLine.match(/alt=["']([^"']+)["']/i);
        const titleMatch = trimmedLine.match(/title=["']([^"']+)["']/i);
        images.push({
          url: htmlMatch[1],
          alt: altMatch ? altMatch[1] : "",
          title: titleMatch ? titleMatch[1] : ""
        });
        continue;
      }

      // 格式3：参数格式
      const paramRegex = /(\w+)=([^\s]+)/g;
      const parsedParams: any = {};
      let match;
      while ((match = paramRegex.exec(trimmedLine)) !== null) {
        // 处理带引号的值
        let value = match[2];
        if (value.startsWith('"') || value.startsWith("'")) {
          const quote = value[0];
          const quoteEndIndex = trimmedLine.indexOf(
            quote,
            match.index + match[1].length + 2
          );
          if (quoteEndIndex !== -1) {
            value = trimmedLine.substring(
              match.index + match[1].length + 2,
              quoteEndIndex
            );
            paramRegex.lastIndex = quoteEndIndex + 1;
          }
        }
        parsedParams[match[1]] = value;
      }

      if (parsedParams.url) {
        images.push({
          url: parsedParams.url,
          alt: parsedParams.alt || "",
          title: parsedParams.title || "",
          desc: parsedParams.desc || ""
        });
      }
    }

    // 如果没有找到任何图片，返回 false
    if (images.length === 0) {
      return false;
    }

    // --- 生成 HTML ---
    const containerClass = ["gallery-container", `gallery-cols-${cols}`];
    let containerStyle = `--gallery-gap: ${gap};`;

    if (ratio) {
      const [w, h] = ratio.split(":");
      const paddingBottom = (parseInt(h) / parseInt(w)) * 100;
      containerStyle += ` --gallery-ratio: ${paddingBottom}%;`;
    }

    let html = `<div class="${containerClass.join(" ")}" style="${containerStyle}">`;

    images.forEach((img, index) => {
      const escapedUrl = md.utils.escapeHtml(img.url);
      const escapedAlt = md.utils.escapeHtml(img.alt || `图片${index + 1}`);
      const escapedTitle = md.utils.escapeHtml(
        img.title || img.alt || `图片${index + 1}`
      );
      const escapedDesc = img.desc ? md.utils.escapeHtml(img.desc) : "";

      html += `<div class="gallery-item">`;

      // 图片包装器（用于固定宽高比）
      if (ratio) {
        html += `<div class="gallery-image-wrapper">`;
      }

      // 图片元素
      html += `<img src="${escapedUrl}" alt="${escapedAlt}" title="${escapedTitle}" loading="lazy" draggable="false" />`;

      if (ratio) {
        html += `</div>`;
      }

      // 标题和描述
      if (escapedTitle || escapedDesc) {
        html += `<div class="gallery-caption">`;
        if (escapedTitle) {
          html += `<div class="gallery-title">${escapedTitle}</div>`;
        }
        if (escapedDesc) {
          html += `<div class="gallery-desc">${escapedDesc}</div>`;
        }
        html += `</div>`;
      }

      html += `</div>`;
    });

    html += "</div>";

    const token = state.push("html_block", "", 0);
    token.content = html;
    token.map = [startLine, nextLine + 1];
    token.markup = startMarker;

    state.line = nextLine + 1;
    return true;
  }

  // 注册块级规则
  md.block.ruler.before("fence", "gallery", galleryBlockRule);

  console.log("Gallery plugin registered successfully");
}
