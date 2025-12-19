/*
 * @Description: Markdown Tip Plugin - 鼠标悬停显示提示信息
 * @Author: 安知鱼
 * @Date: 2025-10-13 00:00:00
 * @LastEditTime: 2025-12-10 16:08:08
 * @LastEditors: 安知鱼
 */
import type MarkdownIt from "markdown-it";

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
        // 不带引号的值，读取到下一个空格或结束
        while (i < paramsStr.length && paramsStr[i] !== " ") {
          paramValue += paramsStr[i];
          i++;
        }
      }

      if (paramName.trim()) {
        parsedParams[paramName.trim()] = paramValue;
      }
    }

    return parsedParams;
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

    // 获取参数值
    const text = parsedParams.text || "提示文本";
    const content = parsedParams.content || "这里是提示内容";
    const position = parsedParams.position || "top"; // top/bottom/left/right
    const theme = parsedParams.theme || "dark"; // dark/light/info/warning/error/success
    const trigger = parsedParams.trigger || "hover"; // hover/click
    const delay = parsedParams.delay || "300"; // 延迟显示时间（毫秒）

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

    // 根据位置计算 tooltip 的定位样式（居中显示，使用 inset 避免溢出）
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

    // 生成事件处理函数 - 支持延迟显示
    const delayMs = parseInt(delay, 10) || 300;
    const showEvent = `var t=this.querySelector('.anzhiyu-tip'),w=this;if(t){clearTimeout(w._tipHideTimer);w._tipShowTimer=setTimeout(function(){t.style.visibility='visible';t.style.opacity='1';},${delayMs});}`;
    const hideEvent = `var t=this.querySelector('.anzhiyu-tip'),w=this;if(t){clearTimeout(w._tipShowTimer);w._tipHideTimer=setTimeout(function(){t.style.visibility='hidden';t.style.opacity='0';},100);}`;

    // 点击事件 - 使用 dataset 来跟踪状态，避免 style.visibility 初始值问题
    const clickEvent = `var t=this.querySelector('.anzhiyu-tip');if(t){var isVisible=t.dataset.visible==='true';if(isVisible){t.style.visibility='hidden';t.style.opacity='0';t.dataset.visible='false';}else{t.style.visibility='visible';t.style.opacity='1';t.dataset.visible='true';}}event.stopPropagation();`;

    const eventHandlers =
      trigger === "click"
        ? `onclick="${clickEvent}"`
        : `onmouseenter="${showEvent}" onmouseleave="${hideEvent}"`;

    // 生成 tip HTML - 使用内联样式确保默认隐藏
    const wrapperStyle =
      "position: relative; display: inline-block; cursor: pointer;";
    const textStyle =
      "border-bottom: 1px dashed currentColor; text-decoration: none;";
    const tooltipStyle = `position: absolute; ${tooltipPositionStyle} ${tooltipThemeStyle} padding: 8px 12px; border-radius: 6px; font-size: 13px; line-height: 1.5; max-width: 300px; width: max-content; text-align: center; white-space: pre-wrap; z-index: 1000; visibility: hidden; opacity: 0; transition: opacity 0.2s, visibility 0.2s; pointer-events: none; box-shadow: 0 2px 8px rgba(0,0,0,0.15);`;

    const html = `<span class="anzhiyu-tip-wrapper" data-tip-id="${tipId}" style="${wrapperStyle}" ${eventHandlers}><span class="anzhiyu-tip-text" style="${textStyle}">${md.utils.escapeHtml(text)}</span><span class="${classAttr}" data-content="${md.utils.escapeHtml(content)}" data-position="${position}" data-theme="${theme}" data-trigger="${trigger}" data-delay="${delay}" data-visible="false" role="tooltip" aria-hidden="true" style="${tooltipStyle}">${md.utils.escapeHtml(content)}</span></span>`;

    const token = state.push("html_inline", "", 0);
    token.content = html;

    state.pos = endPos + closeTag.length;
    return true;
  }

  // 块级规则处理独立行的 tip
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

    const text = parsedParams.text || "提示文本";
    const content = parsedParams.content || "这里是提示内容";
    const position = parsedParams.position || "top";
    const theme = parsedParams.theme || "dark";
    const trigger = parsedParams.trigger || "hover";
    const delay = parsedParams.delay || "300";

    const tipId = `tip-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const classList = ["anzhiyu-tip"];

    if (theme) classList.push(`tip-${theme}`);
    if (position) classList.push(`tip-${position}`);
    if (trigger === "click") classList.push("tip-click");

    const classAttr = classList.join(" ");

    // 根据位置计算 tooltip 的定位样式（居中显示，使用 inset 避免溢出）
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

    // 生成事件处理函数 - 支持延迟显示
    const delayMs = parseInt(delay, 10) || 300;
    const showEvent = `var t=this.querySelector('.anzhiyu-tip'),w=this;if(t){clearTimeout(w._tipHideTimer);w._tipShowTimer=setTimeout(function(){t.style.visibility='visible';t.style.opacity='1';},${delayMs});}`;
    const hideEvent = `var t=this.querySelector('.anzhiyu-tip'),w=this;if(t){clearTimeout(w._tipShowTimer);w._tipHideTimer=setTimeout(function(){t.style.visibility='hidden';t.style.opacity='0';},100);}`;

    // 点击事件 - 使用 dataset 来跟踪状态，避免 style.visibility 初始值问题
    const clickEvent = `var t=this.querySelector('.anzhiyu-tip');if(t){var isVisible=t.dataset.visible==='true';if(isVisible){t.style.visibility='hidden';t.style.opacity='0';t.dataset.visible='false';}else{t.style.visibility='visible';t.style.opacity='1';t.dataset.visible='true';}}event.stopPropagation();`;

    const eventHandlers =
      trigger === "click"
        ? `onclick="${clickEvent}"`
        : `onmouseenter="${showEvent}" onmouseleave="${hideEvent}"`;

    // 生成 tip HTML - 使用内联样式确保默认隐藏
    const wrapperStyle =
      "position: relative; display: inline-block; cursor: pointer;";
    const textStyle =
      "border-bottom: 1px dashed currentColor; text-decoration: none;";
    const tooltipStyle = `position: absolute; ${tooltipPositionStyle} ${tooltipThemeStyle} padding: 8px 12px; border-radius: 6px; font-size: 13px; line-height: 1.5; max-width: 300px; width: max-content; text-align: center; white-space: pre-wrap; z-index: 1000; visibility: hidden; opacity: 0; transition: opacity 0.2s, visibility 0.2s; pointer-events: none; box-shadow: 0 2px 8px rgba(0,0,0,0.15);`;

    const html = `<span class="anzhiyu-tip-wrapper" data-tip-id="${tipId}" style="${wrapperStyle}" ${eventHandlers}><span class="anzhiyu-tip-text" style="${textStyle}">${md.utils.escapeHtml(text)}</span><span class="${classAttr}" data-content="${md.utils.escapeHtml(content)}" data-position="${position}" data-theme="${theme}" data-trigger="${trigger}" data-delay="${delay}" data-visible="false" role="tooltip" aria-hidden="true" style="${tooltipStyle}">${md.utils.escapeHtml(content)}</span></span>`;

    const token = state.push("html_block", "", 0);
    token.content = html;

    state.line = nextLine + 1;
    return true;
  }

  // 注册块级规则和行内规则
  md.block.ruler.before("paragraph", "tip_block", tipBlockRule);
  md.inline.ruler.before("text", "tip", tipRule);
}
