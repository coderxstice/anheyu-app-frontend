/*
 * @Description: Markdown 音乐嵌入插件
 * @Author: 安知鱼
 * @Date: 2025-11-04
 */
import type MarkdownIt from "markdown-it";

// 解析参数的辅助函数
function parseParams(paramsStr: string): any {
  const parsedParams: any = {};
  const params = paramsStr.trim();
  let i = 0;

  while (i < params.length) {
    // 跳过空格
    while (i < params.length && params[i] === " ") i++;
    if (i >= params.length) break;

    // 解析参数名
    let paramName = "";
    while (i < params.length && params[i] !== "=") {
      paramName += params[i];
      i++;
    }

    if (i >= params.length || params[i] !== "=") break;
    i++; // 跳过 '='

    // 解析参数值
    let paramValue = "";
    if (i < params.length && params[i] === '"') {
      // 带引号的值
      i++; // 跳过开始引号
      while (i < params.length && params[i] !== '"') {
        paramValue += params[i];
        i++;
      }
      if (i < params.length) i++; // 跳过结束引号
    } else {
      // 不带引号的值,读取到下一个参数
      while (i < params.length) {
        // 检查是否遇到下一个参数
        if (params[i] === " ") {
          let j = i + 1;
          while (j < params.length && params[j] === " ") j++;
          if (j < params.length && /\w/.test(params[j])) {
            let k = j;
            while (k < params.length && /\w/.test(params[k])) k++;
            if (k < params.length && params[k] === "=") {
              break; // 找到下一个参数
            }
          }
        }
        paramValue += params[i];
        i++;
      }
      paramValue = paramValue.trim();
    }

    if (paramName.trim()) {
      parsedParams[paramName.trim()] = paramValue;
    }
  }

  return parsedParams;
}

/**
 * 音乐数据接口
 */
interface MusicData {
  neteaseId: string;
  name?: string;
  artist?: string;
  pic?: string;
  url?: string;
  color?: string;
}

/**
 * 转义HTML特殊字符（用于data属性）
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * 将 http:// 链接转换为 https://
 */
function ensureHttps(url: string): string {
  if (url && url.startsWith("http://")) {
    return url.replace("http://", "https://");
  }
  return url;
}

/**
 * 生成音乐播放器HTML（包含服务端渲染的数据）
 * 注意：所有参数都应该是已经转义过的安全字符串
 */
function generateMusicPlayerHTML(
  neteaseId: string,
  uniqueId: string,
  name?: string,
  artist?: string,
  pic?: string,
  _url?: string, // url 参数保留以兼容旧代码，但不再使用
  color?: string // 封面主色，用于进度条
): string {
  // 反转义函数：将HTML实体转回普通字符
  const unescapeHtml = (text: string) => {
    return text
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");
  };

  // 构建data属性（参数已经被转义，不需要再次转义）
  const dataAttrs = [`data-music-id="${neteaseId}"`];

  // 将所有数据编码到一个JSON对象中，方便前端解析
  // 注意：这里使用反转义后的原始值构建JSON
  // 注意：不保存 url 参数，因为音频链接具有时效性，需要在播放时通过 API 动态获取
  const musicData: MusicData = {
    neteaseId: unescapeHtml(neteaseId),
    ...(name && { name: unescapeHtml(name) }),
    ...(artist && { artist: unescapeHtml(artist) }),
    ...(pic && { pic: unescapeHtml(pic) }),
    ...(color && { color: unescapeHtml(color) })
    // url 参数不再保存到 HTML 中
  };

  // JSON.stringify 然后转义HTML实体
  const musicDataJson = escapeHtml(JSON.stringify(musicData));
  dataAttrs.push(`data-music-data='${musicDataJson}'`);

  // 如果提供了完整的音乐信息，设置已初始化标记
  const hasFullData = !!(name && artist && pic);
  if (hasFullData) {
    dataAttrs.push(`data-initialized="true"`);
  }

  // 使用提供的数据或默认占位符（使用已转义的值）
  const displayName = name || "加载中...";
  const displayArtist = artist || "...";
  const displayPic = pic || "/static/img/music-vinyl-background.png";

  return `<div class="markdown-music-player" id="${uniqueId}" ${dataAttrs.join(" ")}>
  <div class="music-player-container">
    <div class="music-error" style="display: none;">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
      <span>音乐加载失败</span>
    </div>
    <div class="music-artwork-container">
      <div class="music-artwork-wrapper" onclick="window.__musicPlayerToggle?.('${uniqueId}')">
        <img src="/static/img/music-vinyl-background.png" alt="唱片背景" class="vinyl-background" />
        <img src="/static/img/music-vinyl-outer.png" alt="唱片外圈" class="artwork-image-vinyl-background" />
        <img src="/static/img/music-vinyl-inner.png" alt="唱片内圈" class="artwork-image-vinyl-inner-background" />
        <img src="/static/img/music-vinyl-needle.png" alt="撞针" class="artwork-image-needle-background" />
        <img src="/static/img/music-vinyl-groove.png" alt="凹槽背景" class="artwork-image-groove-background" />
        <div class="artwork-transition-wrapper">
          <img src="${displayPic}" alt="专辑封面" class="artwork-image" />
          <img src="${displayPic}" alt="模糊背景" class="artwork-image-blur" />
          <div class="artwork-border-ring"></div>
        </div>
        <div class="music-play-overlay">
          <div class="music-play-button-overlay">
            <svg class="music-play-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <svg class="music-pause-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="display: none;">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
    <div class="music-info-container">
      <div class="music-text-info">
        <div class="music-name">${displayName}</div>
        <div class="music-artist">${displayArtist}</div>
      </div>
      <span class="nmsingle-playtime">
        <span class="current-time">00:00</span> / <span class="duration">00:00</span>
      </span>
    </div>
    <div class="music-decoration-image">
      <img src="https://upload-bbs.miyoushe.com/upload/2025/11/04/125766904/606ad4f7e660998724ec17f4114085aa_6429154021753184587.png" alt="音乐装饰" />
    </div>
    <div class="music-progress-bar" onclick="window.__musicPlayerSeek?.('${uniqueId}', event)">
      <div class="music-progress-track">
        <div class="music-progress-fill" style="width: 0%"></div>
      </div>
    </div>
    <audio class="music-audio-element" preload="none"></audio>
  </div>
</div>`;
}

export default function musicPlugin(md: MarkdownIt): void {
  function musicRule(state: any, silent: boolean): boolean {
    const start = state.pos;

    // 检查是否是 {music 开头
    if (
      state.src.charCodeAt(start) !== 0x7b /* { */ ||
      !state.src.slice(start + 1, start + 6).startsWith("music")
    ) {
      return false;
    }

    // 寻找结束标记 {/music}
    const closeTag = "{/music}";
    const endPos = state.src.indexOf(closeTag, start + 6);
    if (endPos === -1) {
      return false;
    }

    if (silent) {
      return true;
    }

    // 提取完整内容
    const fullContent = state.src.slice(start, endPos + closeTag.length);

    // 解析：{music id=xxx}{/music} 或 {music neteaseId=xxx}{/music}
    const contentMatch = fullContent.match(/\{music\s*(.*?)\}\{\/music\}/s);
    if (!contentMatch) {
      return false;
    }

    const paramsStr = contentMatch[1];
    const parsedParams = parseParams(paramsStr);

    // 获取网易云音乐ID
    const neteaseId = parsedParams.neteaseId || parsedParams.id || "";

    if (!neteaseId) {
      console.error("[音乐插件] 缺少必要的网易云音乐ID");
      return false;
    }

    // 转义 HTML 字符，并对 pic 和 url 进行 https 转换
    const escapedId = md.utils.escapeHtml(neteaseId);
    const escapedName = parsedParams.name
      ? md.utils.escapeHtml(parsedParams.name)
      : undefined;
    const escapedArtist = parsedParams.artist
      ? md.utils.escapeHtml(parsedParams.artist)
      : undefined;
    const escapedPic = parsedParams.pic
      ? md.utils.escapeHtml(ensureHttps(parsedParams.pic))
      : undefined;
    const escapedUrl = parsedParams.url
      ? md.utils.escapeHtml(ensureHttps(parsedParams.url))
      : undefined;
    const escapedColor = parsedParams.color
      ? md.utils.escapeHtml(parsedParams.color)
      : undefined;

    // 生成唯一ID
    const uniqueId = `music-player-${Math.random().toString(36).substr(2, 9)}`;

    // 生成音乐播放器 HTML（不包含script，由编辑器组件统一初始化）
    const html = generateMusicPlayerHTML(
      escapedId,
      uniqueId,
      escapedName,
      escapedArtist,
      escapedPic,
      escapedUrl,
      escapedColor
    );

    const token = state.push("html_inline", "", 0);
    token.content = html;

    state.pos = endPos + closeTag.length;
    return true;
  }

  // 块级规则处理独立行的 music
  function musicBlockRule(
    state: any,
    start: number,
    end: number,
    silent: boolean
  ): boolean {
    const pos = state.bMarks[start] + state.tShift[start];
    const max = state.eMarks[start];

    // 检查是否是独立行的 {music
    if (pos >= max) return false;

    const line = state.src.slice(pos, max);
    if (!line.trim().startsWith("{music")) return false;

    // 寻找结束行
    let nextLine = start;
    let foundEnd = false;

    for (nextLine = start; nextLine < end; nextLine++) {
      const linePos = state.bMarks[nextLine] + state.tShift[nextLine];
      const lineMax = state.eMarks[nextLine];
      const currentLine = state.src.slice(linePos, lineMax);

      if (currentLine.includes("{/music}")) {
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
    const contentMatch = fullContent.match(/\{music\s*(.*?)\}\{\/music\}/s);
    if (!contentMatch) return false;

    const paramsStr = contentMatch[1];
    const parsedParams = parseParams(paramsStr);

    const neteaseId = parsedParams.neteaseId || parsedParams.id || "";

    if (!neteaseId) {
      console.error("[音乐插件] 缺少必要的网易云乐ID");
      return false;
    }

    const escapedId = md.utils.escapeHtml(neteaseId);
    const escapedName = parsedParams.name
      ? md.utils.escapeHtml(parsedParams.name)
      : undefined;
    const escapedArtist = parsedParams.artist
      ? md.utils.escapeHtml(parsedParams.artist)
      : undefined;
    const escapedPic = parsedParams.pic
      ? md.utils.escapeHtml(ensureHttps(parsedParams.pic))
      : undefined;
    const escapedUrl = parsedParams.url
      ? md.utils.escapeHtml(ensureHttps(parsedParams.url))
      : undefined;
    const escapedColor = parsedParams.color
      ? md.utils.escapeHtml(parsedParams.color)
      : undefined;

    // 生成唯一ID
    const uniqueId = `music-player-${Math.random().toString(36).substr(2, 9)}`;

    const html = generateMusicPlayerHTML(
      escapedId,
      uniqueId,
      escapedName,
      escapedArtist,
      escapedPic,
      escapedUrl,
      escapedColor
    );

    const token = state.push("html_block", "", 0);
    token.content = html;

    state.line = nextLine + 1;
    return true;
  }

  // 注册块级规则和行内规则
  md.block.ruler.before("paragraph", "music_block", musicBlockRule);
  md.inline.ruler.before("text", "music", musicRule);

  console.log("Music plugin registered successfully");
}
