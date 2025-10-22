import type MarkdownIt from "markdown-it";

// 定义视频项接口
interface GalleryVideo {
  url: string;
  title?: string;
  poster?: string; // 封面图
  desc?: string;
  type?: string; // 视频类型，如 mp4, webm, ogg
}

export default function videoGalleryPlugin(md: MarkdownIt): void {
  function videoGalleryBlockRule(
    state: any,
    startLine: number,
    endLine: number,
    silent: boolean
  ): boolean {
    const startMarker = ":::";
    const startTag = "video-gallery";
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

    // 检查 ::: 后面是否是 video-gallery
    const params = state.src.slice(pos + startMarker.length, max).trim();
    if (!params.startsWith(startTag)) {
      return false;
    }

    // 解析参数：cols（列数，默认2），gap（间距，默认16px）
    let cols = 2; // 默认 2 列（视频画廊通常列数较少）
    let gap = "16px"; // 默认间距
    let ratio = "16:9"; // 默认视频宽高比

    const colsMatch = params.match(/cols=(\d+)/);
    if (colsMatch) {
      cols = Math.min(Math.max(parseInt(colsMatch[1], 10), 1), 4); // 限制在 1-4 之间
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

    const videos: GalleryVideo[] = [];
    const lines = content.split("\n");

    // 支持多种格式：
    // 1. HTML video 标签: <video src="url" poster="poster_url"></video>
    // 2. 参数格式: url=xxx poster=xxx title=xxx desc=xxx type=xxx
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // 格式1：HTML video 标签
      const htmlVideoRegex = /<video\s+[^>]*src=["']([^"']+)["'][^>]*>/i;
      const htmlMatch = trimmedLine.match(htmlVideoRegex);
      if (htmlMatch) {
        const posterMatch = trimmedLine.match(/poster=["']([^"']+)["']/i);
        const titleMatch = trimmedLine.match(/title=["']([^"']+)["']/i);
        const typeMatch = trimmedLine.match(/type=["']([^"']+)["']/i);
        videos.push({
          url: htmlMatch[1],
          poster: posterMatch ? posterMatch[1] : "",
          title: titleMatch ? titleMatch[1] : "",
          type: typeMatch ? typeMatch[1] : ""
        });
        continue;
      }

      // 格式2：参数格式
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
        videos.push({
          url: parsedParams.url,
          poster: parsedParams.poster || "",
          title: parsedParams.title || "",
          desc: parsedParams.desc || "",
          type: parsedParams.type || ""
        });
      }
    }

    // 如果没有找到任何视频，返回 false
    if (videos.length === 0) {
      return false;
    }

    // --- 生成 HTML ---
    const containerClass = [
      "video-gallery-container",
      `video-gallery-cols-${cols}`
    ];
    let containerStyle = `--video-gallery-gap: ${gap};`;

    if (ratio) {
      const [w, h] = ratio.split(":");
      const paddingBottom = (parseInt(h) / parseInt(w)) * 100;
      containerStyle += ` --video-gallery-ratio: ${paddingBottom}%;`;
    }

    let html = `<div class="${containerClass.join(" ")}" style="${containerStyle}">`;

    videos.forEach((video, index) => {
      const escapedUrl = md.utils.escapeHtml(video.url);
      const escapedPoster = video.poster
        ? md.utils.escapeHtml(video.poster)
        : "";
      const escapedTitle = md.utils.escapeHtml(
        video.title || `视频${index + 1}`
      );
      const escapedDesc = video.desc ? md.utils.escapeHtml(video.desc) : "";
      const videoType = video.type || getVideoType(video.url);

      html += `<div class="video-gallery-item">`;

      // 视频包装器（用于固定宽高比）
      html += `<div class="video-gallery-video-wrapper">`;

      // 视频元素
      html += `<video
        class="video-gallery-video"
        src="${escapedUrl}"
        ${escapedPoster ? `poster="${escapedPoster}"` : ""}
        controls
        preload="metadata"
        playsinline
        ${videoType ? `type="video/${videoType}"` : ""}
      >
        您的浏览器不支持 video 标签。
      </video>`;

      // 播放按钮覆盖层
      html += `<div class="video-gallery-play-overlay">
        <svg class="play-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </div>`;

      html += `</div>`;

      // 标题和描述
      if (escapedTitle || escapedDesc) {
        html += `<div class="video-gallery-caption">`;
        if (escapedTitle) {
          html += `<div class="video-gallery-title">${escapedTitle}</div>`;
        }
        if (escapedDesc) {
          html += `<div class="video-gallery-desc">${escapedDesc}</div>`;
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
  md.block.ruler.before("fence", "video-gallery", videoGalleryBlockRule);

  console.log("Video Gallery plugin registered successfully");
}

// 辅助函数：根据 URL 推断视频类型
function getVideoType(url: string): string {
  const ext = url.split(".").pop()?.toLowerCase();
  const typeMap: Record<string, string> = {
    mp4: "mp4",
    webm: "webm",
    ogg: "ogg",
    ogv: "ogg",
    m4v: "mp4",
    mov: "mp4"
  };
  return typeMap[ext || ""] || "mp4";
}
