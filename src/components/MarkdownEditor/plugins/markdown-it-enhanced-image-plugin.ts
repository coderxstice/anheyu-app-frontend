/*
 * @Description: 增强图片插件 - 支持图片描述、尺寸、对齐等属性
 * @Author: 安知鱼
 * @Date: 2025-10-28
 */
import type MarkdownIt from "markdown-it";

export default function enhancedImagePlugin(md: MarkdownIt): void {
  // 保存原始的图片规则
  const defaultImageRule = (md.inline.ruler as any).__rules__?.find(
    (rule: any) => rule.name === "image"
  );

  if (defaultImageRule) {
    const originalImageFn = defaultImageRule.fn;

    // 替换图片解析规则，支持解析后面的属性
    defaultImageRule.fn = function (state: any, silent: boolean): boolean {
      const result = originalImageFn.call(this, state, silent);

      if (!result || silent) {
        return result;
      }

      // 检查图片后面是否有属性 {caption="xxx" width=xxx height=xxx align=xxx}
      const pos = state.pos;
      if (pos < state.src.length && state.src[pos] === "{") {
        const closePos = state.src.indexOf("}", pos);
        if (closePos !== -1) {
          const attrString = state.src.slice(pos + 1, closePos);

          // 查找最后一个 image token
          const tokens = state.tokens;
          for (let i = tokens.length - 1; i >= 0; i--) {
            if (tokens[i].type === "image") {
              tokens[i].meta = tokens[i].meta || {};

              // 解析 caption="xxx"
              const captionMatch = attrString.match(/caption\s*=\s*"([^"]*)"/);
              if (captionMatch) {
                tokens[i].meta.caption = captionMatch[1];

                // 如果设置了 caption，移除 title 属性，避免 markdown-it 自动生成外层 figure
                const titleIndex = tokens[i].attrIndex("title");
                if (titleIndex >= 0) {
                  // 保存 title 到 meta 中，以便在渲染时可以作为 alt 备选
                  tokens[i].meta.originalTitle =
                    tokens[i].attrs![titleIndex][1];
                  tokens[i].attrs!.splice(titleIndex, 1);
                }
              }

              // 解析 width=xxx
              const widthMatch = attrString.match(/width\s*=\s*(\d+)/);
              if (widthMatch) {
                tokens[i].meta.width = widthMatch[1];
              }

              // 解析 height=xxx
              const heightMatch = attrString.match(/height\s*=\s*(\d+)/);
              if (heightMatch) {
                tokens[i].meta.height = heightMatch[1];
              }

              // 解析 align=xxx
              const alignMatch = attrString.match(/align\s*=\s*([^\s}]+)/);
              if (alignMatch) {
                tokens[i].meta.align = alignMatch[1];
              }

              break;
            }
          }

          // 跳过属性块
          state.pos = closePos + 1;
        }
      }

      return result;
    };
  }

  // 覆盖图片渲染规则
  md.renderer.rules.image = function (
    tokens: any[],
    idx: number,
    options: any,
    env: any,
    self: any
  ): string {
    const token = tokens[idx];
    const srcIndex = token.attrIndex("src");
    const titleIndex = token.attrIndex("title");

    if (srcIndex < 0) {
      return self.renderToken(tokens, idx, options);
    }

    const src = token.attrs![srcIndex][1];
    // alt 文本存储在 token.content 中，而不是 attrs
    const alt = token.content || "";
    const title = titleIndex >= 0 ? token.attrs![titleIndex][1] : "";

    // 从 meta 中获取属性
    const meta = token.meta || {};
    const align = meta.align || "center";
    const width = meta.width;
    const height = meta.height;

    // caption 优先级：meta.caption > title > alt
    const caption = meta.caption || title || alt;

    // 构建图片标签的属性
    const alignClass = `image-align-${align}`;
    let imgAttrs = `class="article-image lazy-image ${alignClass}" src="${src}" data-src="${src}" alt="${alt}"`;

    // 如果有 title 且不等于 caption，添加 title 属性用于鼠标悬停提示
    if (title && title !== caption) {
      imgAttrs += ` title="${title}"`;
    }
    if (width) {
      imgAttrs += ` width="${width}"`;
    }
    if (height) {
      imgAttrs += ` height="${height}"`;
    }

    // 如果有 caption（描述），使用 figure 结构
    if (caption) {
      return `<figure class="image-figure ${alignClass}"><img ${imgAttrs} /><figcaption>${caption}</figcaption></figure>`;
    }

    // 没有 caption，直接返回 img
    return `<img ${imgAttrs} />`;
  };

  console.log("Enhanced image plugin registered successfully");
}
