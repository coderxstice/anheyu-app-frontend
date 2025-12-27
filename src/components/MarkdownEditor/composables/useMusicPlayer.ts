/**
 * @Description: 音乐播放器初始化和数据获取逻辑
 * @Author: 安知鱼
 * @Date: 2025-12-27
 */
import { ref } from "vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";

export function useMusicPlayer() {
  const siteConfigStore = useSiteConfigStore();

  // 获取音乐API基础地址
  const getMusicAPIBaseURL = (): string => {
    const apiBaseURL = siteConfigStore.siteConfig?.music?.api?.base_url;
    return apiBaseURL && apiBaseURL.trim() !== ""
      ? apiBaseURL.trim()
      : "https://metings.qjqq.cn";
  };

  // 解码HTML实体
  const decodeHtmlEntities = (text: string): string => {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    return textarea.value;
  };

  // 确保URL使用HTTPS
  const ensureHttps = (url: string) => {
    if (!url) return url;
    return url.startsWith("http://") ? url.replace("http://", "https://") : url;
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

  // 从图片提取主色（用于保存）
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
          resolve(color);
        } catch (error) {
          console.error("[主色提取] 失败:", error);
          resolve("#49b1f5");
        }
      };
      img.onerror = () => {
        resolve("#49b1f5");
      };
      img.src = imgUrl;
    });
  };

  // 获取音乐资源
  const fetchMusicResources = async (neteaseId: string) => {
    if (!neteaseId) {
      console.error("[音乐播放器] 缺少音乐ID");
      return null;
    }

    try {
      const apiBaseURL = getMusicAPIBaseURL();
      const formData = new URLSearchParams();
      formData.append("url", neteaseId);
      formData.append("level", "exhigh");
      formData.append("type", "json");

      let response = await fetch(`${apiBaseURL}/Song_V1`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData
      });

      let data = await response.json();

      // 如果exhigh失败，尝试standard
      if (!response.ok || data.status !== 200 || !data.success) {
        console.log("[音乐播放器] exhigh 失败，尝试 standard 音质");
        const standardFormData = new URLSearchParams();
        standardFormData.append("url", neteaseId);
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
        return {
          audioUrl: ensureHttps(data.data.url),
          name: data.data.name || "未知歌曲",
          artist: data.data.ar_name || "未知艺术家",
          pic: ensureHttps(data.data.pic || "")
        };
      }

      return null;
    } catch (error) {
      console.error("[音乐播放器] 获取资源失败:", error);
      return null;
    }
  };

  // 格式化时间
  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins + ":" + (secs < 10 ? "0" : "") + secs;
  };

  // 为音乐播放器注入完整数据
  const enrichMusicPlayers = async (doc: Document): Promise<void> => {
    const musicPlayers = doc.querySelectorAll(".markdown-music-player");

    if (musicPlayers.length === 0) return;

    console.log(
      `[编辑器预览] 发现 ${musicPlayers.length} 个音乐播放器，开始注入数据...`
    );

    const enrichPromises = Array.from(musicPlayers).map(async player => {
      const rawMusicId = player.getAttribute("data-music-id");
      const musicDataAttr = player.getAttribute("data-music-data");

      if (!rawMusicId) return;

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
            return;
          }
        }
      } catch (e) {
        console.warn(`[编辑器预览] 解析音乐数据失败:`, e);
      }

      try {
        console.log(`[编辑器预览] 开始获取音乐 ${musicId} 的数据...`);

        const resources = await fetchMusicResources(musicId);
        if (resources) {
          const dominantColor = await extractDominantColorForSave(
            resources.pic
          );

          const fullMusicData = {
            neteaseId: musicId,
            name: resources.name,
            artist: resources.artist,
            pic: resources.pic,
            url: resources.audioUrl,
            color: dominantColor
          };

          const musicDataJson = JSON.stringify(fullMusicData).replace(
            /"/g,
            "&quot;"
          );

          player.setAttribute("data-music-data", musicDataJson);
          player.setAttribute("data-initialized", "true");

          const nameEl = player.querySelector(".music-name");
          const artistEl = player.querySelector(".music-artist");
          const artworkImgs = player.querySelectorAll(
            ".artwork-image, .artwork-image-blur"
          );

          if (nameEl) nameEl.textContent = resources.name;
          if (artistEl) artistEl.textContent = resources.artist;
          artworkImgs.forEach(img => {
            (img as HTMLImageElement).src = resources.pic;
          });

          console.log(`[编辑器预览] 音乐 ${musicId} 数据注入成功:`, {
            name: resources.name,
            artist: resources.artist
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

  // 为HTML中的音乐播放器注入完整数据
  const enrichHtmlMusicPlayers = async (html: string): Promise<string> => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    await enrichMusicPlayers(doc);
    return doc.body.innerHTML;
  };

  // 初始化单个音乐播放器（用于预览时的播放功能）
  const initMusicPlayer = (player: HTMLElement) => {
    if (player.dataset.initialized === "true") return;
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
    const coverImage = player.querySelector(
      ".artwork-image"
    ) as HTMLImageElement;
    const coverBlur = player.querySelector(
      ".artwork-image-blur"
    ) as HTMLImageElement;
    const errorEl = player.querySelector(".music-error") as HTMLElement;

    const neteaseId = player.dataset.musicId;
    if (!neteaseId || !audio) return;

    // 初始化音乐数据
    const initMusicData = async () => {
      const dataName = player.dataset.musicName;
      const dataArtist = player.dataset.musicArtist;
      const dataPic = player.dataset.musicPic;
      const dataUrl = player.dataset.musicUrl;

      let resources;

      if (dataUrl && dataName) {
        resources = {
          audioUrl: ensureHttps(dataUrl),
          name: dataName,
          artist: dataArtist || "未知艺术家",
          pic: ensureHttps(dataPic || "")
        };
        console.log("[音乐播放器] 使用已保存的音乐数据:", dataName);
      } else {
        resources = await fetchMusicResources(neteaseId);
      }

      if (!resources || !resources.audioUrl) {
        if (errorEl) errorEl.style.display = "flex";
        console.error("[音乐播放器] 无法获取音乐资源");
        return false;
      }

      audio.src = resources.audioUrl;
      audio.load();

      if (musicName) musicName.textContent = resources.name;
      if (musicArtist) musicArtist.textContent = resources.artist;

      if (resources.pic) {
        if (coverImage) coverImage.src = resources.pic;
        if (coverBlur) coverBlur.src = resources.pic;

        extractDominantColor(resources.pic).then(color => {
          if (progressFill) {
            progressFill.style.background = color;
          }
        });
      }

      console.log("[音乐播放器] 音乐数据加载完成:", resources.name);
      return true;
    };

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

    initMusicData();

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
      if (progressFill) progressFill.style.width = progress + "%";
      if (currentTimeEl)
        currentTimeEl.textContent = formatTime(audio.currentTime);
    });

    audio.addEventListener("loadedmetadata", () => {
      if (durationEl) durationEl.textContent = formatTime(audio.duration);
    });

    audio.addEventListener("ended", () => {
      audio.currentTime = 0;
      if (artworkWrapper) artworkWrapper.classList.remove("is-playing");
      if (needleEl) needleEl.classList.remove("needle-playing");
    });

    if (progressBar) {
      progressBar.addEventListener("click", (e: MouseEvent) => {
        const rect = progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audio.currentTime = percent * audio.duration;
      });
    }
  };

  // 处理新添加的节点
  const processNewNode = async (node: Node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const element = node as HTMLElement;
    const players =
      element.querySelectorAll?.(
        ".markdown-music-player[data-music-id]:not([data-initialized])"
      ) || [];

    if (players.length > 0) {
      const tempDoc = document.implementation.createHTMLDocument();
      tempDoc.body.appendChild(element.cloneNode(true));
      await enrichMusicPlayers(tempDoc);

      players.forEach((player, index) => {
        const updatedPlayer = tempDoc.body.querySelectorAll(
          ".markdown-music-player"
        )[index];
        if (updatedPlayer) {
          const attrs = updatedPlayer.attributes;
          for (let i = 0; i < attrs.length; i++) {
            const attr = attrs[i];
            if (attr.name.startsWith("data-")) {
              (player as HTMLElement).setAttribute(attr.name, attr.value);
            }
          }

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

          if (nameEl && updatedName)
            nameEl.textContent = updatedName.textContent;
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

    if (
      element.classList?.contains("markdown-music-player") &&
      element.dataset.musicId &&
      element.dataset.initialized !== "true"
    ) {
      initMusicPlayer(element);
    }
  };

  // 音乐播放器Observer
  const musicPlayerObserver = ref<MutationObserver | null>(null);

  const createMusicPlayerObserver = () => {
    musicPlayerObserver.value = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          processNewNode(node);
        });
      });
    });
    return musicPlayerObserver.value;
  };

  const disconnectMusicPlayerObserver = () => {
    if (musicPlayerObserver.value) {
      musicPlayerObserver.value.disconnect();
      musicPlayerObserver.value = null;
    }
  };

  return {
    getMusicAPIBaseURL,
    decodeHtmlEntities,
    ensureHttps,
    extractDominantColor,
    extractDominantColorForSave,
    fetchMusicResources,
    formatTime,
    enrichMusicPlayers,
    enrichHtmlMusicPlayers,
    initMusicPlayer,
    processNewNode,
    musicPlayerObserver,
    createMusicPlayerObserver,
    disconnectMusicPlayerObserver
  };
}
