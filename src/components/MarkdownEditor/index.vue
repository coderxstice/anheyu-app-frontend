<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { useSnackbar } from "@/composables/useSnackbar";

// 动态导入类型定义
type MdEditor = any;
type Themes = any;
type ExposeParam = any;
type ToolbarNames = any;

const props = defineProps<{
  modelValue: string;
  onUploadImg: (files: File[], callback: (urls: string[]) => void) => void;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "onSave", markdown: string, html: string): void;
}>();

const siteConfigStore = useSiteConfigStore();
const { showSnackbar } = useSnackbar();

// 获取音乐API基础地址
const getMusicAPIBaseURL = (): string => {
  const apiBaseURL = siteConfigStore.siteConfig?.music?.api?.base_url;
  return apiBaseURL && apiBaseURL.trim() !== ""
    ? apiBaseURL.trim()
    : "https://metings.qjqq.cn";
};

// 动态导入的编辑器组件和加载状态
const MdEditorComponent = ref<any>(null);
const isEditorLoading = ref(true);
const loadError = ref<string>("");

// 重新加载方法
const reloadPage = () => {
  window.location.reload();
};

const codeMaxLines = computed(
  () => siteConfigStore.getSiteConfig?.code_block?.code_max_lines || 10
);

const collapsedHeight = computed(() => {
  const lines = codeMaxLines.value > 0 ? codeMaxLines.value : 10;
  const height = lines * 25 + 15;
  return `${height}px`;
});

// 全局复制处理函数
const handleCodeCopy = (codeElement: HTMLElement) => {
  if (codeElement) {
    navigator.clipboard
      .writeText(codeElement.textContent || "")
      .then(() => {
        showSnackbar("复制成功，复制和转载请标注本文地址");
      })
      .catch(() => {
        showSnackbar("复制失败，请手动复制");
      });
  }
};

/**
 * 为音乐播放器注入完整数据
 */

/**
 * 从图片提取主色（用于保存）
 */
const extractDominantColorForSave = (imgUrl: string): Promise<string> => {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve("#49b1f5");
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let r = 0,
          g = 0,
          b = 0;
        const sampleSize = 10;

        for (let i = 0; i < data.length; i += 4 * sampleSize) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
        }

        const pixels = data.length / (4 * sampleSize);
        r = Math.floor(r / pixels);
        g = Math.floor(g / pixels);
        b = Math.floor(b / pixels);

        const color = `rgb(${r}, ${g}, ${b})`;
        console.log(`[主色提取] 提取到的主色:`, color);
        resolve(color);
      } catch (error) {
        console.error("[主色提取] 失败:", error);
        resolve("#49b1f5");
      }
    };
    img.onerror = () => {
      console.error("[主色提取] 图片加载失败");
      resolve("#49b1f5");
    };
    img.src = imgUrl;
  });
};

/**
 * 解码HTML实体
 */
const decodeHtmlEntities = (text: string): string => {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
};

const enrichMusicPlayers = async (doc: Document): Promise<void> => {
  const musicPlayers = doc.querySelectorAll(".markdown-music-player");

  if (musicPlayers.length === 0) return;

  console.log(
    `[编辑器预览] 发现 ${musicPlayers.length} 个音乐播放器，开始注入数据...`
  );

  const enrichPromises = Array.from(musicPlayers).map(async player => {
    const rawMusicId = player.getAttribute("data-music-id");
    const musicDataAttr = player.getAttribute("data-music-data");
    const hasInitialized = player.getAttribute("data-initialized");

    console.log(`[编辑器预览] 检查音乐播放器:`, {
      musicId: rawMusicId,
      hasMusicData: !!musicDataAttr,
      hasInitialized: !!hasInitialized,
      musicDataAttr: musicDataAttr?.substring(0, 100) + "..."
    });

    if (!rawMusicId) return;

    // 解码HTML实体（如 &quot; 转为 "）
    const musicId = decodeHtmlEntities(rawMusicId).replace(/['"]/g, "");

    // 检查是否已有完整数据
    let musicData: any = null;
    try {
      if (musicDataAttr) {
        musicData = JSON.parse(musicDataAttr.replace(/&quot;/g, '"'));
        if (
          musicData.name &&
          musicData.artist &&
          musicData.pic &&
          musicData.url
        ) {
          console.log(
            `[编辑器预览] 音乐 ${musicId} 已有完整数据（包括URL），跳过`
          );
          return; // 已有完整数据
        } else {
          console.log(`[编辑器预览] 音乐 ${musicId} 数据不完整:`, musicData);
        }
      }
    } catch (e) {
      console.warn(`[编辑器预览] 解析音乐数据失败:`, e);
    }

    try {
      console.log(`[编辑器预览] 开始获取音乐 ${musicId} 的数据...`);

      // 调用API获取音乐数据
      const formData = new URLSearchParams();
      formData.append("url", musicId);
      formData.append("level", "exhigh");
      formData.append("type", "json");

      const apiBaseURL = getMusicAPIBaseURL();
      let response = await fetch(`${apiBaseURL}/Song_V1`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData
      });

      let data = await response.json();

      // 如果exhigh失败，尝试standard
      if (!response.ok || data.status !== 200 || !data.success) {
        console.log(`[编辑器预览] exhigh品质失败，尝试standard品质...`);
        const standardFormData = new URLSearchParams();
        standardFormData.append("url", musicId);
        standardFormData.append("level", "standard");
        standardFormData.append("type", "json");

        response = await fetch(`${apiBaseURL}/Song_V1`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: standardFormData
        });

        data = await response.json();
      }

      if (data.status === 200 && data.success) {
        // 确保URL使用HTTPS
        const ensureHttps = (url: string) => {
          if (!url) return url;
          return url.startsWith("http://")
            ? url.replace("http://", "https://")
            : url;
        };

        const name = data.data.name || "";
        const artist = data.data.ar_name || "";
        const pic = ensureHttps(data.data.pic || "");
        const url = ensureHttps(data.data.url || "");

        console.log(`[编辑器预览] 获取到的音乐数据:`, {
          name,
          artist,
          pic,
          url
        });

        // 提取封面主色
        const dominantColor = await extractDominantColorForSave(pic);
        console.log(`[编辑器预览] 提取到的主色:`, dominantColor);

        // 更新data属性
        const fullMusicData = {
          neteaseId: musicId,
          name,
          artist,
          pic,
          url,
          color: dominantColor
        };

        const musicDataJson = JSON.stringify(fullMusicData).replace(
          /"/g,
          "&quot;"
        );
        console.log(`[编辑器预览] 准备设置data-music-data:`, musicDataJson);

        player.setAttribute("data-music-data", musicDataJson);
        player.setAttribute("data-initialized", "true");

        console.log(`[编辑器预览] 已设置属性，验证:`, {
          hasMusicData: player.hasAttribute("data-music-data"),
          musicDataValue: player.getAttribute("data-music-data"),
          hasInitialized: player.hasAttribute("data-initialized")
        });

        // 更新显示的文本和图片
        const nameEl = player.querySelector(".music-name");
        const artistEl = player.querySelector(".music-artist");
        const artworkImgs = player.querySelectorAll(
          ".artwork-image, .artwork-image-blur"
        );

        if (nameEl) nameEl.textContent = name;
        if (artistEl) artistEl.textContent = artist;
        artworkImgs.forEach(img => {
          (img as HTMLImageElement).src = pic;
        });

        console.log(`[编辑器预览] 音乐 ${musicId} 数据注入成功:`, {
          name,
          artist
        });
      } else {
        console.warn(`[编辑器预览] 获取音乐 ${musicId} 数据失败`);
      }
    } catch (error) {
      console.error(`[编辑器预览] 获取音乐 ${musicId} 数据异常:`, error);
    }
  });

  await Promise.all(enrichPromises);
  console.log(`[编辑器预览] 所有音乐播放器数据注入完成`);
};

const sanitize = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, "text/html");

  // 处理代码块
  doc.querySelectorAll("details.md-editor-code").forEach(detailsElement => {
    const summaryElement = detailsElement.querySelector(
      "summary.md-editor-code-head"
    );
    if (!summaryElement) return;

    if (!summaryElement.querySelector(".copy-button")) {
      const langSpan = detailsElement.querySelector(".md-editor-code-lang");
      const language = langSpan ? langSpan.textContent?.trim() : "";

      // 内置代码复制逻辑
      const copyHandler = `
        event.preventDefault();
        event.stopPropagation();
        const code = this.closest('.md-editor-code').querySelector('pre code');
        if(code && window.__markdownEditorCopyHandler) {
          window.__markdownEditorCopyHandler(code);
        }
      `
        .replace(/\s+/g, " ")
        .trim();

      // 内置代码块展开/收起逻辑（details 的 toggle）
      const toggleHandler = `
        event.preventDefault();
        this.closest('details').open = !this.closest('details').open;
      `
        .replace(/\s+/g, " ")
        .trim();

      summaryElement.innerHTML = `
        <i class="anzhiyufont anzhiyu-icon-angle-down expand" onclick="${toggleHandler}"></i>
        <div class="code-lang">${language}</div>
        <i class="anzhiyufont anzhiyu-icon-paste copy-button" onclick="${copyHandler}"></i>`;
    }

    if (codeMaxLines.value !== -1) {
      const preElement = detailsElement.querySelector("pre");
      if (preElement) {
        let lineCount = 0;
        const rnWrapper = preElement.querySelector("span[rn-wrapper]");

        if (rnWrapper) {
          lineCount = rnWrapper.children.length;
        } else {
          lineCount = (preElement.textContent?.match(/\n/g) || []).length + 1;
        }

        if (lineCount > codeMaxLines.value) {
          detailsElement.classList.add("is-collapsible", "is-collapsed");
          preElement.style.height = collapsedHeight.value;
          preElement.style.overflow = "hidden";

          if (!detailsElement.querySelector(".code-expand-btn")) {
            const expandBtn = document.createElement("div");
            expandBtn.className = "code-expand-btn";

            // 内置展开/折叠逻辑 - 绑定到按钮上
            // 使用实际的高度值而不是模板字符串变量
            const collapsedHeightValue = collapsedHeight.value;
            const expandHandler = `
              const container = this.closest('details.md-editor-code');
              const pre = container.querySelector('pre');
              const icon = this.querySelector('i');
              if(container.classList.contains('is-collapsed')) {
                container.open = true;
                container.classList.remove('is-collapsed');
                if(pre) {
                  pre.style.height = '';
                  pre.style.overflow = '';
                }
                if(icon) {
                  icon.style.transform = 'rotate(180deg)';
                }
                this.classList.add('is-expanded');
              } else {
                container.classList.add('is-collapsed');
                if(pre) {
                  pre.style.height = '${collapsedHeightValue}';
                  pre.style.overflow = 'hidden';
                }
                if(icon) {
                  icon.style.transform = 'rotate(0deg)';
                }
                this.classList.remove('is-expanded');
              }
            `
              .replace(/\s+/g, " ")
              .trim();

            // 事件绑定到按钮上，图标添加过渡动画
            expandBtn.setAttribute("onclick", expandHandler);
            expandBtn.innerHTML = `<i class="anzhiyufont anzhiyu-icon-angle-double-down" style="transition: transform 0.3s ease;"></i>`;
            detailsElement.appendChild(expandBtn);
          }
        }
      }
    }
  });

  doc.querySelectorAll("table").forEach(table => {
    if (table.parentElement?.classList.contains("table-container")) {
      return;
    }
    const container = document.createElement("div");
    container.className = "table-container";
    if (table.parentNode) {
      table.parentNode.insertBefore(container, table);
      container.appendChild(table);
    }
  });

  return doc.body.innerHTML;
};

/**
 * 为HTML中的音乐播放器注入完整数据
 * @param html - 原始HTML
 * @returns 注入数据后的HTML
 */
const enrichHtmlMusicPlayers = async (html: string): Promise<string> => {
  const doc = new DOMParser().parseFromString(html, "text/html");

  // 调用已有的enrichMusicPlayers函数来注入数据
  await enrichMusicPlayers(doc);

  return doc.body.innerHTML;
};

/**
 * 等待 Mermaid 图表渲染完成
 * Mermaid 渲染是异步的，需要等待所有图表都渲染完成后再保存
 * @param maxWaitTime 最大等待时间（毫秒），默认 5000ms
 * @param checkInterval 检查间隔（毫秒），默认 100ms
 */
const waitForMermaidRender = async (
  maxWaitTime = 5000,
  checkInterval = 100
): Promise<void> => {
  const previewContainer = containerRef.value?.querySelector(
    ".md-editor-preview-wrapper"
  );
  if (!previewContainer) {
    console.log("[保存文章] 未找到预览容器，跳过 Mermaid 等待");
    return;
  }

  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    // 查找所有 Mermaid 图表元素
    const mermaidElements =
      previewContainer.querySelectorAll(".md-editor-mermaid");

    if (mermaidElements.length === 0) {
      // 没有 Mermaid 图表，直接返回
      console.log("[保存文章] 未检测到 Mermaid 图表");
      return;
    }

    // 检查是否所有 Mermaid 都已渲染完成（有 data-processed 属性且包含 SVG）
    let allRendered = true;
    let pendingCount = 0;

    mermaidElements.forEach(el => {
      const hasProcessed = el.hasAttribute("data-processed");
      const hasSvg = el.querySelector("svg") !== null;
      if (!hasProcessed || !hasSvg) {
        allRendered = false;
        pendingCount++;
      }
    });

    if (allRendered) {
      console.log(
        `[保存文章] 所有 Mermaid 图表已渲染完成 (${mermaidElements.length} 个)`
      );
      return;
    }

    console.log(
      `[保存文章] 等待 Mermaid 渲染... (${pendingCount}/${mermaidElements.length} 待渲染)`
    );
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }

  console.warn(`[保存文章] Mermaid 渲染等待超时 (${maxWaitTime}ms)，继续保存`);
};

const handleSave = async (markdown: string, htmlPromise: Promise<string>) => {
  console.log("[保存文章] 开始处理...");
  console.log("[保存文章] Markdown长度:", markdown.length);

  // 等待 Mermaid 图表渲染完成
  await waitForMermaidRender();

  // 获取原始HTML
  const rawHtml = await htmlPromise;
  console.log("[保存文章] 原始HTML长度:", rawHtml.length);

  // 为HTML中的音乐播放器注入完整数据
  const enrichedHtml = await enrichHtmlMusicPlayers(rawHtml);
  console.log("[保存文章] 音乐数据注入后HTML长度:", enrichedHtml.length);

  // 清理HTML
  const sanitizedHtml = sanitize(enrichedHtml);

  // 保存：Markdown保持原样，HTML包含完整的音乐数据
  emit("onSave", markdown, sanitizedHtml);
  console.log("[保存文章] 保存完成");
};

const toolbars: ToolbarNames[] = [
  "bold",
  "underline",
  "italic",
  "strikeThrough",
  "-",
  "title",
  "sub",
  "sup",
  "quote",
  "unorderedList",
  "orderedList",
  "task",
  "-",
  "codeRow",
  "code",
  "link",
  "image",
  "table",
  "mermaid",
  "katex",
  "revoke",
  "next",
  "save",
  "=",
  "pageFullscreen",
  "fullscreen",
  "preview",
  "previewOnly",
  "htmlPreview",
  "catalog"
];

const editorRef = ref<ExposeParam>();
const theme = ref<Themes>("light");
const containerRef = ref<HTMLElement | null>(null);

// 预览区域点击事件处理 - 现在大部分逻辑已内置到 HTML 中
// 这里保留是为了未来可能需要的额外处理
const handlePreviewClick = (event: MouseEvent) => {
  // 所有交互逻辑已经通过 onclick 内联事件处理器实现
  // 如果未来需要添加额外的全局处理逻辑，可以在这里扩展
};

// 主题观察器
const themeObserver = new MutationObserver(() => {
  const newTheme = document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";
  if (theme.value !== newTheme) {
    theme.value = newTheme;
  }
});

/**
 * 异步处理新添加的音乐播放器节点
 */
const processNewNode = async (node: Node) => {
  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const element = node as HTMLElement;
  // 查找新添加的音乐播放器
  const players =
    element.querySelectorAll?.(
      ".markdown-music-player[data-music-id]:not([data-initialized])"
    ) || [];

  // 先为播放器注入数据，再初始化
  if (players.length > 0) {
    const tempDoc = document.implementation.createHTMLDocument();
    tempDoc.body.appendChild(element.cloneNode(true));
    await enrichMusicPlayers(tempDoc);

    // 将更新后的内容同步回原DOM
    players.forEach((player, index) => {
      const updatedPlayer = tempDoc.body.querySelectorAll(
        ".markdown-music-player"
      )[index];
      if (updatedPlayer) {
        // 复制data属性
        const attrs = updatedPlayer.attributes;
        for (let i = 0; i < attrs.length; i++) {
          const attr = attrs[i];
          if (attr.name.startsWith("data-")) {
            (player as HTMLElement).setAttribute(attr.name, attr.value);
          }
        }

        // 复制更新的内容（歌名、歌手、封面）
        const nameEl = player.querySelector(".music-name");
        const artistEl = player.querySelector(".music-artist");
        const artworkImgs = player.querySelectorAll(
          ".artwork-image, .artwork-image-blur"
        );

        const updatedName = updatedPlayer.querySelector(".music-name");
        const updatedArtist = updatedPlayer.querySelector(".music-artist");
        const updatedArtworks = updatedPlayer.querySelectorAll(
          ".artwork-image, .artwork-image-blur"
        );

        if (nameEl && updatedName) nameEl.textContent = updatedName.textContent;
        if (artistEl && updatedArtist)
          artistEl.textContent = updatedArtist.textContent;
        artworkImgs.forEach((img, idx) => {
          if (updatedArtworks[idx]) {
            (img as HTMLImageElement).src = (
              updatedArtworks[idx] as HTMLImageElement
            ).src;
          }
        });
      }

      initMusicPlayer(player as HTMLElement);
    });
  }

  // 检查当前元素本身是否是播放器
  if (
    element.classList?.contains("markdown-music-player") &&
    element.dataset.musicId &&
    !element.dataset.initialized
  ) {
    initMusicPlayer(element);
  }
};

// 音乐播放器初始化观察器
const musicPlayerObserver = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      // 异步处理新节点（不阻塞观察器）
      processNewNode(node);
    });
  });
});

// 初始化单个音乐播放器
const initMusicPlayer = (player: HTMLElement) => {
  if (player.dataset.initialized) return;
  player.dataset.initialized = "true";

  const audio = player.querySelector(
    ".music-audio-element"
  ) as HTMLAudioElement;
  const artworkWrapper = player.querySelector(
    ".music-artwork-wrapper"
  ) as HTMLElement;
  const needleEl = player.querySelector(
    ".artwork-image-needle-background"
  ) as HTMLElement;
  const playIcon = player.querySelector(".music-play-icon") as HTMLElement;
  const pauseIcon = player.querySelector(".music-pause-icon") as HTMLElement;
  const progressBar = player.querySelector(
    ".music-progress-bar"
  ) as HTMLElement;
  const progressFill = player.querySelector(
    ".music-progress-fill"
  ) as HTMLElement;
  const currentTimeEl = player.querySelector(".current-time") as HTMLElement;
  const durationEl = player.querySelector(".duration") as HTMLElement;
  const musicName = player.querySelector(".music-name") as HTMLElement;
  const musicArtist = player.querySelector(".music-artist") as HTMLElement;
  const coverImage = player.querySelector(".artwork-image") as HTMLImageElement;
  const coverBlur = player.querySelector(
    ".artwork-image-blur"
  ) as HTMLImageElement;
  const errorEl = player.querySelector(".music-error") as HTMLElement;

  const neteaseId = player.dataset.musicId;

  // 确保URL使用HTTPS协议
  const ensureHttps = (url: string) => {
    if (!url) return url;
    if (url.startsWith("http://")) {
      return url.replace("http://", "https://");
    }
    return url;
  };

  // 从图片提取主色
  const extractDominantColor = (imgUrl: string): Promise<string> => {
    return new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve("var(--anzhiyu-main)");
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          let r = 0,
            g = 0,
            b = 0;
          const pixelCount = data.length / 4;

          for (let i = 0; i < data.length; i += 4) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
          }

          r = Math.floor(r / pixelCount);
          g = Math.floor(g / pixelCount);
          b = Math.floor(b / pixelCount);

          resolve(`rgb(${r}, ${g}, ${b})`);
        } catch (error) {
          console.error("[音乐播放器] 提取主色失败:", error);
          resolve("var(--anzhiyu-main)");
        }
      };
      img.onerror = () => {
        resolve("var(--anzhiyu-main)");
      };
      img.src = imgUrl;
    });
  };

  // 音乐资源获取函数
  const fetchMusicResources = async () => {
    if (!neteaseId) {
      console.error("[音乐播放器] 缺少音乐ID");
      return null;
    }

    try {
      // 尝试获取 exhigh 音质
      console.log("[音乐播放器] 尝试获取 exhigh 音质");
      const apiBaseURL = getMusicAPIBaseURL();
      const formData = new URLSearchParams();
      formData.append("url", neteaseId);
      formData.append("level", "exhigh");
      formData.append("type", "json");

      const response = await fetch(`${apiBaseURL}/Song_V1`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData
      });

      if (!response.ok) {
        // 如果 exhigh 失败，尝试 standard
        console.log("[音乐播放器] exhigh 失败，尝试 standard 音质");
        const standardFormData = new URLSearchParams();
        standardFormData.append("url", neteaseId);
        standardFormData.append("level", "standard");
        standardFormData.append("type", "json");

        const standardResponse = await fetch(`${apiBaseURL}/Song_V1`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: standardFormData
        });

        if (!standardResponse.ok) {
          console.error("[音乐播放器] 所有音质都获取失败");
          return null;
        }

        const standardData = await standardResponse.json();
        if (standardData.status === 200 && standardData.success) {
          return {
            audioUrl: ensureHttps(standardData.data.url),
            name: standardData.data.name || "未知歌曲",
            artist: standardData.data.ar_name || "未知艺术家",
            pic: ensureHttps(standardData.data.pic || "")
          };
        }
        return null;
      }

      const data = await response.json();
      if (data.status === 200 && data.success) {
        return {
          audioUrl: ensureHttps(data.data.url),
          name: data.data.name || "未知歌曲",
          artist: data.data.ar_name || "未知艺术家",
          pic: ensureHttps(data.data.pic || "")
        };
      }

      // exhigh 无资源，尝试 standard
      console.log("[音乐播放器] exhigh 无资源，尝试 standard 音质");
      const standardFormData = new URLSearchParams();
      standardFormData.append("url", neteaseId);
      standardFormData.append("level", "standard");
      standardFormData.append("type", "json");

      const standardResponse = await fetch(`${apiBaseURL}/Song_V1`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: standardFormData
      });

      if (!standardResponse.ok) return null;

      const standardData = await standardResponse.json();
      if (standardData.status === 200 && standardData.success) {
        return {
          audioUrl: ensureHttps(standardData.data.url),
          name: standardData.data.name || "未知歌曲",
          artist: standardData.data.ar_name || "未知艺术家",
          pic: ensureHttps(standardData.data.pic || "")
        };
      }
    } catch (error) {
      console.error("[音乐播放器] 获取资源失败:", error);
    }

    return null;
  };

  // 格式化时间
  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins + ":" + (secs < 10 ? "0" : "") + secs;
  };

  // 初始化音乐数据
  const initMusicData = async () => {
    // 检查是否有完整的data属性（保存后的文章会有）
    const dataName = player.dataset.musicName;
    const dataArtist = player.dataset.musicArtist;
    const dataPic = player.dataset.musicPic;
    const dataUrl = player.dataset.musicUrl;

    let resources;

    if (dataUrl && dataName) {
      // 使用data属性中的完整数据，不发起API请求
      // 对 pic 和 url 进行 https 转换
      resources = {
        audioUrl: ensureHttps(dataUrl),
        name: dataName,
        artist: dataArtist || "未知艺术家",
        pic: ensureHttps(dataPic || "")
      };
      console.log("[音乐播放器] 使用已保存的音乐数据:", dataName);
    } else {
      // 通过API获取数据（编辑器预览时）
      resources = await fetchMusicResources();
    }

    if (!resources || !resources.audioUrl) {
      // 显示错误信息
      if (errorEl) errorEl.style.display = "flex";
      console.error("[音乐播放器] 无法获取音乐资源");
      return false;
    }

    // 设置音频源
    audio.src = resources.audioUrl;
    // 预加载音频元数据以获取时长
    audio.load();

    // 更新歌曲信息
    if (musicName) musicName.textContent = resources.name;
    if (musicArtist) musicArtist.textContent = resources.artist;

    // 更新封面
    if (resources.pic) {
      if (coverImage) coverImage.src = resources.pic;
      if (coverBlur) coverBlur.src = resources.pic;

      // 提取封面主色并应用到进度条
      extractDominantColor(resources.pic).then(color => {
        if (progressFill) {
          progressFill.style.background = color;
        }
      });
    }

    console.log("[音乐播放器] 音乐数据加载完成:", resources.name);
    return true;
  };

  // 点击封面或播放图标播放/暂停
  const togglePlay = async () => {
    if (!audio.src) {
      console.error("[音乐播放器] 音频未加载");
      return;
    }

    if (audio.paused) {
      audio.play().catch(err => console.error("[音乐播放器] 播放失败:", err));
    } else {
      audio.pause();
    }
  };

  if (artworkWrapper) {
    artworkWrapper.addEventListener("click", togglePlay);
  }

  // 页面加载时自动获取音乐信息
  initMusicData();

  // 音频事件监听
  audio.addEventListener("play", () => {
    if (artworkWrapper) artworkWrapper.classList.add("is-playing");
    if (needleEl) needleEl.classList.add("needle-playing");
    if (playIcon) playIcon.style.display = "none";
    if (pauseIcon) pauseIcon.style.display = "block";
  });

  audio.addEventListener("pause", () => {
    if (artworkWrapper) artworkWrapper.classList.remove("is-playing");
    if (needleEl) needleEl.classList.remove("needle-playing");
    if (playIcon) playIcon.style.display = "block";
    if (pauseIcon) pauseIcon.style.display = "none";
  });

  audio.addEventListener("timeupdate", () => {
    const progress = (audio.currentTime / audio.duration) * 100 || 0;
    progressFill.style.width = progress + "%";
    currentTimeEl.textContent = formatTime(audio.currentTime);
  });

  audio.addEventListener("loadedmetadata", () => {
    durationEl.textContent = formatTime(audio.duration);
  });

  audio.addEventListener("ended", () => {
    audio.currentTime = 0;
    if (artworkWrapper) artworkWrapper.classList.remove("is-playing");
    if (needleEl) needleEl.classList.remove("needle-playing");
  });

  // 进度条点击
  progressBar.addEventListener("click", (e: MouseEvent) => {
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
  });
};

onMounted(async () => {
  // 动态导入 md-editor-v3
  try {
    const [{ MdEditor }, { installMarkdownEditorExtensions }] =
      await Promise.all([import("md-editor-v3"), import("./config")]);

    // 动态导入样式
    await import("md-editor-v3/lib/style.css");

    // 初始化编辑器扩展
    installMarkdownEditorExtensions();

    MdEditorComponent.value = MdEditor;
    isEditorLoading.value = false;

    // 将复制处理函数暴露到全局作用域
    (window as any).__markdownEditorCopyHandler = handleCodeCopy;

    // 初始化主题和监听器
    theme.value = document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
    themeObserver.observe(document.documentElement, { attributes: true });

    // 监听编辑器预览区域的DOM变化以初始化音乐播放器
    if (containerRef.value) {
      containerRef.value.addEventListener("click", handlePreviewClick);

      // 延迟启动音乐播放器观察器，确保编辑器已完全渲染
      setTimeout(() => {
        const previewContainer = containerRef.value?.querySelector(
          ".md-editor-preview-wrapper"
        );
        if (previewContainer) {
          musicPlayerObserver.observe(previewContainer, {
            childList: true,
            subtree: true
          });

          // 初始化已存在的音乐播放器（异步加载数据）
          if (previewContainer.children.length > 0) {
            // 处理整个预览容器
            processNewNode(previewContainer as HTMLElement);
          }
        }
      }, 300);
    }
  } catch (error) {
    console.error("Failed to load markdown editor:", error);
    loadError.value = "Markdown编辑器加载失败";
    isEditorLoading.value = false;
  }
});

onUnmounted(() => {
  themeObserver.disconnect();
  musicPlayerObserver.disconnect();
  if (containerRef.value) {
    containerRef.value.removeEventListener("click", handlePreviewClick);
  }
  // 清理全局函数
  delete (window as any).__markdownEditorCopyHandler;
});

defineExpose({
  triggerSave: () => editorRef.value?.triggerSave()
});
</script>
<template>
  <div ref="containerRef" class="md-editor-container">
    <!-- 加载中状态 -->
    <div v-if="isEditorLoading" class="editor-loading">
      <div class="loading-spinner" />
      <span>正在加载Markdown编辑器...</span>
    </div>

    <!-- 加载失败状态 -->
    <div v-else-if="loadError" class="editor-error">
      <div class="error-icon">⚠️</div>
      <span>{{ loadError }}</span>
      <button class="retry-btn" @click="reloadPage">重新加载</button>
    </div>

    <!-- 动态渲染的编辑器 -->
    <component
      :is="MdEditorComponent"
      v-else-if="MdEditorComponent"
      ref="editorRef"
      style="height: 100%; max-height: 100%"
      :model-value="modelValue"
      :theme="theme"
      :toolbars="toolbars"
      :showCodeRowNumber="true"
      :sanitize="sanitize"
      :auto-fold-threshold="99999999"
      :showToolbarName="true"
      @update:model-value="val => emit('update:modelValue', val)"
      @onUploadImg="onUploadImg"
      @onSave="handleSave"
    />
  </div>
</template>

<style scoped lang="scss">
.md-editor-container {
  height: 100%;
}

.editor-loading,
.editor-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--anzhiyu-fontcolor);
  text-align: center;
  gap: 16px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--anzhiyu-gray-op);
  border-top: 3px solid var(--anzhiyu-main);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.error-icon {
  font-size: 32px;
}

.retry-btn {
  padding: 8px 16px;
  background: var(--anzhiyu-main);
  color: var(--anzhiyu-white);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: var(--anzhiyu-main-op-deep);
  }
}
</style>
