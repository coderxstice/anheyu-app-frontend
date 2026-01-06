import type MarkdownIt from "markdown-it";

/**
 * 判断是否为外部链接
 */
function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/**
 * 判断图标类型
 * @returns 'anzhiyufont' | 'iconify' | 'imageUrl'
 */
function getIconType(icon: string): "anzhiyufont" | "iconify" | "imageUrl" {
  if (icon.startsWith("anzhiyu-icon-")) {
    return "anzhiyufont";
  }
  if (icon.includes(":")) {
    return "iconify";
  }
  if (/^https?:\/\//i.test(icon)) {
    return "imageUrl";
  }
  return "anzhiyufont"; // 默认为 anzhiyufont
}

/**
 * 将 Iconify 图标名称转换为 API URL
 */
function getIconifyUrl(icon: string): string {
  const [prefix, name] = icon.split(":");
  if (prefix && name) {
    return `https://api.iconify.design/${prefix}/${name}.svg?color=currentColor`;
  }
  return "";
}

/**
 * 渲染图标 HTML
 */
function renderIcon(icon: string, md: MarkdownIt): string {
  const type = getIconType(icon);
  const escapedIcon = md.utils.escapeHtml(icon);

  if (type === "imageUrl") {
    return `<img class="btn-icon-img" src="${escapedIcon}" alt="" />`;
  } else if (type === "iconify") {
    const iconUrl = getIconifyUrl(icon);
    if (iconUrl) {
      return `<img class="btn-icon-img iconify-img" src="${md.utils.escapeHtml(iconUrl)}" alt="" />`;
    }
    return `<i class="anzhiyufont anzhiyu-icon-circle-arrow-right"></i>`;
  } else {
    return `<i class="anzhiyufont ${escapedIcon}"></i>`;
  }
}

export default function buttonPlugin(md: MarkdownIt): void {
  function buttonRule(state: any, silent: boolean): boolean {
    const start = state.pos;

    // 检查是否是 {btn 开头
    if (
      state.src.charCodeAt(start) !== 0x7b /* { */ ||
      !state.src.slice(start + 1, start + 4).startsWith("btn")
    ) {
      return false;
    }

    // 寻找结束标记 {/btn}
    const closeTag = "{/btn}";
    const endPos = state.src.indexOf(closeTag, start + 4);
    if (endPos === -1) {
      return false;
    }

    if (silent) {
      return true;
    }

    // 提取完整内容
    const fullContent = state.src.slice(start, endPos + closeTag.length);

    // 解析：{btn url=xxx text=xxx icon=xxx ...}{/btn}
    const contentMatch = fullContent.match(/\{btn\s+(.*?)\}\{\/btn\}/s);
    if (!contentMatch) {
      return false;
    }

    const paramsStr = contentMatch[1];

    // 解析参数
    const paramRegex = /(\w+)=([^\s}]+)/g;
    const parsedParams: any = {};
    let match;
    while ((match = paramRegex.exec(paramsStr)) !== null) {
      parsedParams[match[1]] = match[2];
    }

    // 获取参数值
    const url = parsedParams.url || "#";
    const text = parsedParams.text || "按钮";
    const icon = parsedParams.icon || "anzhiyu-icon-circle-arrow-right";
    const color = parsedParams.color || ""; // default/blue/pink/red/purple/orange/green
    const style = parsedParams.style || ""; // outline/留空
    const layout = parsedParams.layout || ""; // block/留空
    const position = parsedParams.position || ""; // center/right/留空
    const size = parsedParams.size || ""; // larger/留空

    // 构建 class 名称
    const classList = ["btn-anzhiyu"];

    // 添加颜色类
    if (color) {
      classList.push(`btn-${color}`);
    }

    // 添加样式类
    if (style === "outline") {
      classList.push("btn-outline");
    }

    // 添加大小类
    if (size === "larger") {
      classList.push("btn-larger");
    }

    const classAttr = classList.join(" ");

    // 判断是否为外链，添加相应属性
    const isExternal = isExternalUrl(url);
    const targetAttr = isExternal ? ' target="_blank"' : "";
    const relAttr = isExternal ? ' rel="external nofollow noreferrer"' : "";

    // 渲染图标
    const iconHtml = renderIcon(icon, md);

    // 生成按钮 HTML
    const buttonHtml = `<a class="${classAttr}" href="${md.utils.escapeHtml(url)}" title="${md.utils.escapeHtml(text)}"${targetAttr}${relAttr} draggable="false">${iconHtml}<span>${md.utils.escapeHtml(text)}</span></a>`;

    // 如果是块级布局，用容器包裹
    let html = buttonHtml;
    if (layout === "block") {
      const containerClass = ["btn-container"];
      if (position === "center") {
        containerClass.push("btn-container-center");
      } else if (position === "right") {
        containerClass.push("btn-container-right");
      }
      html = `<div class="${containerClass.join(" ")}">${buttonHtml}</div>`;
    }

    const token = state.push("html_inline", "", 0);
    token.content = html;

    state.pos = endPos + closeTag.length;
    return true;
  }

  // 注册行内规则
  md.inline.ruler.before("emphasis", "button", buttonRule);

  console.log("Button plugin registered successfully");
}
