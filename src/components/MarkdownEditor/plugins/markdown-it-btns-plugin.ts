import type MarkdownIt from "markdown-it";

/**
 * Btns 插件 - 按钮组组件
 *
 * @description 用于在 Markdown 中创建美观的按钮组/卡片组
 *
 * @usage
 * ```markdown
 * :::btns cols=3 style=default
 * - icon=ri:github-fill title=GitHub url=https://github.com
 * - icon=https://example.com/logo.png title=网站 url=https://example.com desc=这是描述
 * - icon=anzhiyu-icon-rocket title=快速开始 url=/docs color=blue
 * :::
 * ```
 *
 * @param cols - 列数，1-6，默认 3
 * @param style - 样式风格：default（默认）、card（卡片）、simple（简约）
 *
 * @item-params
 * - icon: 图标，支持三种格式：
 *   1. HTTP/HTTPS URL（图片链接）
 *   2. Iconify 格式（如 ri:github-fill、mdi:home）
 *   3. anzhiyufont 图标类名（如 anzhiyu-icon-rocket）
 * - title: 标题（必填）
 * - url: 链接地址，默认 #
 * - desc: 描述文字（可选）
 * - color: 颜色主题：blue、pink、red、purple、orange、green（可选）
 */

// 定义按钮项接口
interface BtnItem {
  icon: string;
  title: string;
  url: string;
  desc?: string;
  color?: string;
}

/**
 * 判断图标类型
 * @param icon 图标字符串
 * @returns 'url' | 'iconify' | 'iconfont'
 */
function getIconType(icon: string): "url" | "iconify" | "iconfont" {
  // HTTP/HTTPS URL
  if (/^https?:\/\//i.test(icon)) {
    return "url";
  }
  // Iconify 格式：包含冒号，如 ri:github-fill、mdi:home
  if (icon.includes(":")) {
    return "iconify";
  }
  // 默认为 iconfont
  return "iconfont";
}

// 颜色主题映射（URL 编码的颜色值）
const colorMap: Record<string, string> = {
  blue: "%23409eff",
  pink: "%23ff69b4",
  red: "%23f56c6c",
  purple: "%239d5cff",
  orange: "%23ff9800",
  green: "%2367c23a"
};

/**
 * 将 Iconify 图标名称转换为 API URL
 * @param icon Iconify 图标名称，如 mdi:github、ri:home-line
 * @param color 可选的颜色主题
 * @returns Iconify API SVG URL
 */
function getIconifyUrl(icon: string, color?: string): string {
  // 格式: prefix:name -> https://api.iconify.design/prefix/name.svg
  const [prefix, name] = icon.split(":");
  if (prefix && name) {
    // 如果有颜色主题，使用对应颜色；否则使用默认颜色（适合深色模式的浅色）
    const iconColor = color && colorMap[color] ? colorMap[color] : "%23a0a0a0";
    return `https://api.iconify.design/${prefix}/${name}.svg?color=${iconColor}`;
  }
  return "";
}

/**
 * 生成图标 HTML
 * @param icon 图标字符串
 * @param title 标题（用于 alt）
 * @param escapeHtml HTML 转义函数
 * @param color 可选的颜色主题
 */
function renderIcon(
  icon: string,
  title: string,
  escapeHtml: (str: string) => string,
  color?: string
): string {
  const iconType = getIconType(icon);

  switch (iconType) {
    case "url":
      return `<img src="${escapeHtml(icon)}" alt="${escapeHtml(title)}" />`;
    case "iconify": {
      // 使用 Iconify API 获取 SVG 图标
      const iconUrl = getIconifyUrl(icon, color);
      if (iconUrl) {
        return `<img src="${escapeHtml(iconUrl)}" alt="${escapeHtml(title)}" class="iconify-img" />`;
      }
      return `<i class="anzhiyufont anzhiyu-icon-circle-arrow-right"></i>`;
    }
    case "iconfont":
    default:
      return `<i class="anzhiyufont ${escapeHtml(icon)}"></i>`;
  }
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
    // 如果有 desc，添加 has-desc 类以启用不同的布局
    const hasDesc = btns.some(btn => btn.desc);
    const containerClass = [
      "btns-container",
      `btns-cols-${cols}`,
      `btns-style-${style}`,
      hasDesc ? "btns-has-desc" : ""
    ].filter(Boolean);

    let html = `<div class="${containerClass.join(" ")}">`;

    btns.forEach(btn => {
      const colorClass = btn.color ? `btn-color-${btn.color}` : "";
      const itemClass = ["btn-item", colorClass, btn.desc ? "has-desc" : ""]
        .filter(Boolean)
        .join(" ");

      html += `<a class="${itemClass}" href="${md.utils.escapeHtml(btn.url)}" target="_blank" rel="noopener noreferrer" draggable="false">`;

      // 渲染图标（传入颜色主题以支持 Iconify 图标颜色）
      html += `<div class="btn-icon">${renderIcon(btn.icon, btn.title, md.utils.escapeHtml, btn.color)}</div>`;

      // 渲染标题和描述
      html += `<div class="btn-content">`;
      html += `<div class="btn-title">${md.utils.escapeHtml(btn.title)}</div>`;
      if (btn.desc) {
        html += `<div class="btn-desc">${md.utils.escapeHtml(btn.desc)}</div>`;
      }
      html += `</div>`;

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
}
