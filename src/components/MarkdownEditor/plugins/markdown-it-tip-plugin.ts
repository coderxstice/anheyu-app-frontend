/*
 * @Description: Markdown Tip Plugin - 鼠标悬停显示提示信息
 * @Author: 安知鱼
 * @Date: 2025-10-13 00:00:00
 * @LastEditTime: 2025-01-07 12:00:00
 * @LastEditors: 安知鱼
 */
import type MarkdownIt from "markdown-it";

/**
 * 初始化 tip 组件的事件监听器
 * 需要在 HTML 渲染完成后调用此函数
 * @param container 容器元素，默认为 document
 */
export function initTipEvents(
  container: HTMLElement | Document = document
): void {
  const tipWrappers = container.querySelectorAll<HTMLElement>(
    ".anzhiyu-tip-wrapper:not([data-tip-initialized])"
  );

  tipWrappers.forEach(wrapper => {
    const tooltip = wrapper.querySelector<HTMLElement>(".anzhiyu-tip");
    if (!tooltip) return;

    const trigger = tooltip.dataset.trigger || "hover";
    const delay = parseInt(tooltip.dataset.delay || "0", 10);

    // 标记为已初始化
    wrapper.dataset.tipInitialized = "true";

    // 存储定时器
    let showTimer: ReturnType<typeof setTimeout> | null = null;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const showTooltip = () => {
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      showTimer = setTimeout(() => {
        tooltip.style.visibility = "visible";
        tooltip.style.opacity = "1";
        tooltip.dataset.visible = "true";
      }, delay);
    };

    const hideTooltip = () => {
      if (showTimer) {
        clearTimeout(showTimer);
        showTimer = null;
      }
      hideTimer = setTimeout(() => {
        tooltip.style.visibility = "hidden";
        tooltip.style.opacity = "0";
        tooltip.dataset.visible = "false";
      }, 100);
    };

    const toggleTooltip = (e: Event) => {
      e.stopPropagation();
      const isVisible = tooltip.dataset.visible === "true";
      if (isVisible) {
        tooltip.style.visibility = "hidden";
        tooltip.style.opacity = "0";
        tooltip.dataset.visible = "false";
      } else {
        tooltip.style.visibility = "visible";
        tooltip.style.opacity = "1";
        tooltip.dataset.visible = "true";
      }
    };

    if (trigger === "click") {
      wrapper.addEventListener("click", toggleTooltip);
      // 点击其他区域关闭
      document.addEventListener("click", e => {
        if (
          !wrapper.contains(e.target as Node) &&
          tooltip.dataset.visible === "true"
        ) {
          tooltip.style.visibility = "hidden";
          tooltip.style.opacity = "0";
          tooltip.dataset.visible = "false";
        }
      });
    } else {
      wrapper.addEventListener("mouseenter", showTooltip);
      wrapper.addEventListener("mouseleave", hideTooltip);
    }
  });
}

export default function tipPlugin(md: MarkdownIt): void {
  // 解析参数的辅助函数，支持带引号的值（包含空格、逗号、中文等）
  function parseParams(paramsStr: string): Record<string, string> {
    const parsedParams: Record<string, string> = {};
    let i = 0;

    while (i < paramsStr.length) {
      // 跳过空格
      while (i < paramsStr.length && paramsStr[i] === " ") i++;
      if (i >= paramsStr.length) break;

      // 解析参数名
      let paramName = "";
      while (
        i < paramsStr.length &&
        paramsStr[i] !== "=" &&
        paramsStr[i] !== " "
      ) {
        paramName += paramsStr[i];
        i++;
      }

      if (i >= paramsStr.length || paramsStr[i] !== "=") break;
      i++; // 跳过 '='

      // 解析参数值
      let paramValue = "";
      if (i < paramsStr.length && paramsStr[i] === '"') {
        // 带引号的值
        i++; // 跳过开始引号
        while (i < paramsStr.length && paramsStr[i] !== '"') {
          paramValue += paramsStr[i];
          i++;
        }
        if (i < paramsStr.length) i++; // 跳过结束引号
      } else {
        // 不带引号的值：查找下一个 key= 模式的位置，而不是简单地读取到空格
        // 这样可以支持值中包含空格的情况，如 content=延迟 500ms 显示的提示 delay=500
        const remaining = paramsStr.slice(i);
        // 匹配下一个 "空格+字母/数字+=" 的模式
        const nextParamMatch = remaining.match(/\s+([a-zA-Z_][a-zA-Z0-9_]*)=/);
        if (nextParamMatch) {
          // 找到了下一个参数，取到它之前的内容作为当前值
          paramValue = remaining.slice(0, nextParamMatch.index).trim();
          i += nextParamMatch.index!;
        } else {
          // 没有下一个参数了，取剩余所有内容
          paramValue = remaining.trim();
          i = paramsStr.length;
        }
      }

      if (paramName.trim()) {
        parsedParams[paramName.trim()] = paramValue;
      }
    }

    return parsedParams;
  }

  function generateTipHtml(
    parsedParams: Record<string, string>,
    md: MarkdownIt
  ): string {
    // 获取参数值
    const text = parsedParams.text || "提示文本";
    const content = parsedParams.content || "这里是提示内容";
    const position = parsedParams.position || "top"; // top/bottom/left/right
    const theme = parsedParams.theme || "dark"; // dark/light/info/warning/error/success
    const trigger = parsedParams.trigger || "hover"; // hover/click
    const delay = parsedParams.delay || "0"; // 延迟显示时间（毫秒），默认无延迟

    // 生成唯一ID
    const tipId = `tip-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // 构建 class 名称
    const classList = ["anzhiyu-tip"];

    // 添加主题类
    if (theme) {
      classList.push(`tip-${theme}`);
    }

    // 添加位置类
    if (position) {
      classList.push(`tip-${position}`);
    }

    // 添加触发方式类
    if (trigger === "click") {
      classList.push("tip-click");
    }

    const classAttr = classList.join(" ");

    // 根据位置计算 tooltip 的定位样式（居中显示）
    const positionStyles: Record<string, string> = {
      top: "bottom: 100%; left: 50%; transform: translateX(-50%) translateY(-8px);",
      bottom:
        "top: 100%; left: 50%; transform: translateX(-50%) translateY(8px);",
      left: "right: 100%; top: 50%; transform: translateY(-50%) translateX(-8px);",
      right:
        "left: 100%; top: 50%; transform: translateY(-50%) translateX(8px);"
    };

    // 根据主题计算颜色
    const themeStyles: Record<string, string> = {
      dark: "background: #333; color: #fff;",
      light: "background: #fff; color: #333; border: 1px solid #ddd;",
      info: "background: #3498db; color: #fff;",
      warning: "background: #f39c12; color: #fff;",
      error: "background: #e74c3c; color: #fff;",
      success: "background: #27ae60; color: #fff;"
    };

    const tooltipPositionStyle = positionStyles[position] || positionStyles.top;
    const tooltipThemeStyle = themeStyles[theme] || themeStyles.dark;

    // 生成 tip HTML - 使用内联样式确保默认隐藏，不使用内联事件处理程序
    const wrapperStyle =
      "position: relative; display: inline-block; cursor: pointer;";
    const textStyle =
      "border-bottom: 1px dashed currentColor; text-decoration: none;";
    const tooltipStyle = `position: absolute; ${tooltipPositionStyle} ${tooltipThemeStyle} padding: 8px 12px; border-radius: 6px; font-size: 13px; line-height: 1.5; max-width: 300px; width: max-content; text-align: center; white-space: pre-wrap; z-index: 1000; visibility: hidden; opacity: 0; transition: opacity 0.2s, visibility 0.2s; pointer-events: none; box-shadow: 0 2px 8px rgba(0,0,0,0.15);`;

    return `<span class="anzhiyu-tip-wrapper" data-tip-id="${tipId}" style="${wrapperStyle}"><span class="anzhiyu-tip-text" style="${textStyle}">${md.utils.escapeHtml(text)}</span><span class="${classAttr}" data-content="${md.utils.escapeHtml(content)}" data-position="${position}" data-theme="${theme}" data-trigger="${trigger}" data-delay="${delay}" data-visible="false" role="tooltip" aria-hidden="true" style="${tooltipStyle}">${md.utils.escapeHtml(content)}</span></span>`;
  }

  function tipRule(state: any, silent: boolean): boolean {
    const start = state.pos;

    // 检查是否是 {tip 开头
    if (
      state.src.charCodeAt(start) !== 0x7b /* { */ ||
      !state.src.slice(start + 1, start + 4).startsWith("tip")
    ) {
      return false;
    }

    // 确保是 {tip 而不是 {tips 等
    const nextChar = state.src.charCodeAt(start + 4);
    if (nextChar !== 0x20 /* space */ && nextChar !== 0x7d /* } */) {
      return false;
    }

    // 寻找结束标记 {/tip}
    const closeTag = "{/tip}";
    const endPos = state.src.indexOf(closeTag, start + 4);
    if (endPos === -1) {
      return false;
    }

    if (silent) {
      return true;
    }

    // 提取完整内容
    const fullContent = state.src.slice(start, endPos + closeTag.length);

    // 解析：{tip text=xxx content=xxx position=xxx theme=xxx}{/tip}
    const contentMatch = fullContent.match(/\{tip\s*(.*?)\}\{\/tip\}/s);
    if (!contentMatch) {
      return false;
    }

    const paramsStr = contentMatch[1];
    const parsedParams = parseParams(paramsStr);

    const html = generateTipHtml(parsedParams, md);

    const token = state.push("html_inline", "", 0);
    token.content = html;

    state.pos = endPos + closeTag.length;
    return true;
  }

  // 块级规则处理独立行的 tip（只有当 {/tip} 后面没有内容时才使用块级规则）
  function tipBlockRule(
    state: any,
    start: number,
    end: number,
    silent: boolean
  ): boolean {
    const pos = state.bMarks[start] + state.tShift[start];
    const max = state.eMarks[start];

    // 检查是否是独立行的 {tip
    if (pos >= max) return false;

    const line = state.src.slice(pos, max);
    if (!line.trim().startsWith("{tip")) return false;

    // 确保是 {tip 而不是 {tips 等
    const trimmedLine = line.trim();
    if (trimmedLine.length > 4) {
      const nextChar = trimmedLine.charCodeAt(4);
      if (nextChar !== 0x20 /* space */ && nextChar !== 0x7d /* } */) {
        return false;
      }
    }

    // 寻找结束行
    let nextLine = start;
    let foundEnd = false;

    for (nextLine = start; nextLine < end; nextLine++) {
      const linePos = state.bMarks[nextLine] + state.tShift[nextLine];
      const lineMax = state.eMarks[nextLine];
      const currentLine = state.src.slice(linePos, lineMax);

      if (currentLine.includes("{/tip}")) {
        foundEnd = true;
        // 检查 {/tip} 后面是否还有内容
        const closeIndex = currentLine.indexOf("{/tip}");
        const afterClose = currentLine
          .slice(closeIndex + "{/tip}".length)
          .trim();
        if (afterClose.length > 0) {
          // {/tip} 后面还有内容，让行内规则处理，而不是块级规则
          return false;
        }
        break;
      }
    }

    if (!foundEnd) return false;

    if (silent) return true;

    // 提取完整内容
    const startPos = state.bMarks[start] + state.tShift[start];
    const endPos = state.eMarks[nextLine];
    const fullContent = state.src.slice(startPos, endPos);

    // 使用相同的解析逻辑
    const contentMatch = fullContent.match(/\{tip\s*(.*?)\}\{\/tip\}/s);
    if (!contentMatch) return false;

    const paramsStr = contentMatch[1];
    const parsedParams = parseParams(paramsStr);

    const html = generateTipHtml(parsedParams, md);

    const token = state.push("html_block", "", 0);
    token.content = html;

    state.line = nextLine + 1;
    return true;
  }

  // 注册块级规则和行内规则
  md.block.ruler.before("paragraph", "tip_block", tipBlockRule);
  md.inline.ruler.before("text", "tip", tipRule);
}
