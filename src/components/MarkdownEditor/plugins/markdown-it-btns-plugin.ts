import type MarkdownIt from "markdown-it";

// 定义按钮项接口
interface BtnItem {
  icon: string;
  title: string;
  url: string;
  desc?: string;
  color?: string;
}

export default function btnsPlugin(md: MarkdownIt): void {
  function btnsBlockRule(
    state: any,
    startLine: number,
    endLine: number,
    silent: boolean
  ): boolean {
    const startMarker = ":::";
    const startTag = "btns";
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

    // 检查 ::: 后面是否是 btns
    const params = state.src.slice(pos + startMarker.length, max).trim();
    if (!params.startsWith(startTag)) {
      return false;
    }

    // 解析参数：cols（列数，默认3），style（样式风格）
    let cols = 3; // 默认 3 列
    let style = "default"; // default/card/simple

    const colsMatch = params.match(/cols=(\d+)/);
    if (colsMatch) {
      cols = Math.min(Math.max(parseInt(colsMatch[1], 10), 1), 6); // 限制在 1-6 之间
    }

    const styleMatch = params.match(/style=([\w-]+)/);
    if (styleMatch) {
      style = styleMatch[1];
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

    const btns: BtnItem[] = [];
    const lines = content.split("\n");

    // 支持两种格式：
    // 1. 列表格式: - icon=xxx title=xxx url=xxx desc=xxx
    // 2. 参数格式: icon=xxx title=xxx url=xxx desc=xxx（每行一个按钮）
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // 移除开头的 - 或 * 标记
      let contentLine = trimmedLine;
      if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ")) {
        contentLine = trimmedLine.substring(2).trim();
      }

      // 解析参数
      const paramRegex = /(\w+)=([^\s]+)/g;
      const parsedParams: any = {};
      let match;
      while ((match = paramRegex.exec(contentLine)) !== null) {
        // 处理带引号的值
        let value = match[2];
        if (value.startsWith('"') || value.startsWith("'")) {
          const quote = value[0];
          const quoteEndIndex = contentLine.indexOf(
            quote,
            match.index + match[1].length + 2
          );
          if (quoteEndIndex !== -1) {
            value = contentLine.substring(
              match.index + match[1].length + 2,
              quoteEndIndex
            );
            paramRegex.lastIndex = quoteEndIndex + 1;
          }
        }
        parsedParams[match[1]] = value;
      }

      // 构建按钮项
      if (parsedParams.title) {
        btns.push({
          icon: parsedParams.icon || "anzhiyu-icon-circle-arrow-right",
          title: parsedParams.title,
          url: parsedParams.url || "#",
          desc: parsedParams.desc || "",
          color: parsedParams.color || ""
        });
      }
    }

    // 如果没有找到任何按钮，返回 false
    if (btns.length === 0) {
      return false;
    }

    // --- 生成 HTML ---
    const containerClass = [
      "btns-container",
      `btns-cols-${cols}`,
      `btns-style-${style}`
    ];
    let html = `<div class="${containerClass.join(" ")}">`;

    btns.forEach(btn => {
      const colorClass = btn.color ? `btn-color-${btn.color}` : "";
      html += `<a class="btn-item ${colorClass}" href="${md.utils.escapeHtml(btn.url)}" target="_blank" rel="noopener noreferrer" draggable="false">`;

      // 判断 icon 是否是 URL（以 http:// 或 https:// 开头）
      const isImageUrl = /^https?:\/\//i.test(btn.icon);
      if (isImageUrl) {
        html += `<div class="btn-icon"><img src="${md.utils.escapeHtml(btn.icon)}" alt="${md.utils.escapeHtml(btn.title)}" /></div>`;
      } else {
        html += `<div class="btn-icon"><i class="anzhiyufont ${btn.icon}"></i></div>`;
      }

      html += `<div class="btn-title">${md.utils.escapeHtml(btn.title)}</div>`;
      html += `</a>`;
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
  md.block.ruler.before("fence", "btns", btnsBlockRule);

  console.log("Btns plugin registered successfully");
}
