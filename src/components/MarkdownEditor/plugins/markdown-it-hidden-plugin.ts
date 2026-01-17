import type MarkdownIt from "markdown-it";

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
      // 不带引号的值：查找下一个 key= 模式的位置
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

export default function customHiddenPlugin(md: MarkdownIt): void {
  // 块级隐藏内容
  function hiddenBlockRule(
    state: any,
    startLine: number,
    endLine: number,
    silent: boolean
  ): boolean {
    const startMarker = ":::";
    const startTag = "hidden";

    let pos = state.bMarks[startLine] + state.tShift[startLine];
    let max = state.eMarks[startLine];

    if (pos + startMarker.length > max) {
      return false;
    }

    if (
      state.src.charCodeAt(pos) !== 0x3a /* : */ ||
      state.src.charCodeAt(pos + 1) !== 0x3a /* : */ ||
      state.src.charCodeAt(pos + 2) !== 0x3a /* : */
    ) {
      return false;
    }

    const params = state.src.slice(pos + startMarker.length, max).trim();
    if (!params.startsWith(startTag)) {
      return false;
    }

    const startIndent = state.tShift[startLine];

    let nextLine = startLine + 1;
    let endLineFound = false;
    while (nextLine < endLine) {
      if (state.isEmpty(nextLine)) {
        nextLine++;
        continue;
      }

      pos = state.bMarks[nextLine] + state.tShift[nextLine];
      max = state.eMarks[nextLine];

      if (state.tShift[nextLine] < startIndent) {
        break;
      }

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

    // 解析参数：display bg color content
    const paramsParts = params.slice(startTag.length).trim();
    const parsedParams = parseParams(paramsParts);

    // 提取内容
    let content = "";
    for (let i = startLine + 1; i < nextLine; i++) {
      const lineStart = state.bMarks[i] + state.tShift[i];
      const lineEnd = state.eMarks[i];
      const lineContent = state.src.slice(lineStart, lineEnd);
      content += lineContent + "\n";
    }

    const hiddenContent = content.trim();
    const displayText = parsedParams.display || "查看隐藏内容";
    const bgColor = parsedParams.bg || "";
    const textColor = parsedParams.color || "";

    // 渲染隐藏内容
    const renderedContent = md.render(hiddenContent);

    // 生成样式
    let buttonStyle = "";
    if (bgColor || textColor) {
      const styles = [];
      if (bgColor) styles.push(`background-color: ${bgColor}`);
      if (textColor) styles.push(`color: ${textColor}`);
      buttonStyle = ` style="${styles.join(";")}"`;
    }

    const finalHtml = `<div class="hide-block"><button type="button" class="hide-button"${buttonStyle} onclick="this.style.display='none';this.nextElementSibling.style.display='block'">${md.utils.escapeHtml(displayText)}
    </button><div class="hide-content" style="display: none;">
${renderedContent}
</div></div>`;

    const token = state.push("html_block", "", 0);
    token.content = finalHtml;
    token.map = [startLine, nextLine + 1];
    token.markup = startMarker;

    state.line = nextLine + 1;
    return true;
  }

  // 行内隐藏内容
  function hiddenInlineRule(state: any, silent: boolean): boolean {
    const start = state.pos;

    // 检查是否是 {hide 开头
    if (
      state.src.charCodeAt(start) !== 0x7b /* { */ ||
      !state.src.slice(start + 1, start + 5).startsWith("hide")
    ) {
      return false;
    }

    // 寻找结束标记 {/hide}
    const endMarker = "{/hide}";
    const endPos = state.src.indexOf(endMarker, start + 5);
    if (endPos === -1) {
      return false;
    }

    if (silent) {
      return true;
    }

    // 提取完整内容 {hide ...}...{/hide}
    const fullContent = state.src.slice(start, endPos + endMarker.length);

    // 解析：{hide display=xxx bg=xxx color=xxx}content{/hide}
    const contentMatch = fullContent.match(/\{hide\s+(.*?)\}(.*?)\{\/hide\}/s);
    if (!contentMatch) {
      return false;
    }

    const paramsStr = contentMatch[1];
    const content = contentMatch[2];

    // 解析参数
    const parsedParams = parseParams(paramsStr);

    const displayText = parsedParams.display || "查看";
    const bgColor = parsedParams.bg || "";
    const textColor = parsedParams.color || "";

    // 渲染隐藏内容（行内使用 renderInline）
    const renderedContent = md.renderInline(content.trim());

    // 生成样式
    let buttonStyle = "";
    if (bgColor || textColor) {
      const styles = [];
      if (bgColor) styles.push(`background-color: ${bgColor}`);
      if (textColor) styles.push(`color: ${textColor}`);
      buttonStyle = ` style="${styles.join(";")}"`;
    }

    const html = `<span class="hide-inline"><button type="button" class="hide-button"${buttonStyle} onclick="this.style.display='none';this.nextElementSibling.style.display='inline'">${md.utils.escapeHtml(displayText)}  </button><span class="hide-content" style="display: none;">${renderedContent}</span></span>`;

    const token = state.push("html_inline", "", 0);
    token.content = html;

    state.pos = endPos + endMarker.length;
    return true;
  }

  // 注册块级规则
  md.block.ruler.before("fence", "hidden_block", hiddenBlockRule, {
    alt: ["paragraph", "reference", "blockquote", "list"]
  });

  // 注册行内规则
  md.inline.ruler.before("emphasis", "hidden_inline", hiddenInlineRule);

  console.log("Hidden content plugin (block & inline) registered successfully");
}
