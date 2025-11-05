/**
 * 音乐播放器全局处理函数
 * 这些函数会被HTML的onclick属性调用
 */

import { getSongResourcesApi } from "@/api/music";

/**
 * 格式化时间
 */
const formatTime = (seconds: number) => {
  if (!isFinite(seconds)) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

/**
 * 初始化音乐播放器数据（通过API动态获取音频源）
 * 此函数作为预加载失败时的后备方案
 */
const initMusicPlayerData = async (playerId: string) => {
  const player = document.getElementById(playerId);
  if (!player || player.dataset.audioLoaded) return;

  const audio = player.querySelector(
    ".music-audio-element"
  ) as HTMLAudioElement;
  const errorEl = player.querySelector(".music-error") as HTMLElement;

  if (!audio) {
    console.error("[音乐播放器] 未找到audio元素:", playerId);
    return;
  }

  try {
    const musicDataAttr = player.getAttribute("data-music-data");

    if (!musicDataAttr) {
      console.error("[音乐播放器] 没有找到data-music-data属性");
      if (errorEl) errorEl.style.display = "flex";
      return;
    }

    // 解码HTML实体
    const decodedData = musicDataAttr
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&amp;/g, "&");

    const musicData = JSON.parse(decodedData);

    // 由于音频链接具有时效性，需要通过 API 动态获取
    if (!musicData.neteaseId) {
      console.error(
        "[音乐播放器] 缺少网易云音乐ID，无法获取音频资源",
        musicData
      );
      if (errorEl) errorEl.style.display = "flex";
      return;
    }

    console.log(
      "[音乐播放器] 后备加载：通过API动态获取音频链接 - 网易云ID:",
      musicData.neteaseId
    );

    // 显示加载状态
    player.classList.add("loading");

    // 调用后端 API 获取音频资源
    const response = await getSongResourcesApi(musicData.neteaseId);

    if (response.code === 200 && response.data?.audioUrl) {
      audio.src = response.data.audioUrl;
      audio.preload = "metadata";

      // 监听 loadedmetadata 事件以更新播放时长
      const updateDuration = () => {
        const durationEl = player.querySelector(".duration") as HTMLElement;
        if (durationEl && audio.duration) {
          durationEl.textContent = formatTime(audio.duration);
        }
      };

      // 如果元数据已经加载，直接更新；否则等待 loadedmetadata 事件
      if (audio.readyState >= 1) {
        updateDuration();
      } else {
        audio.addEventListener("loadedmetadata", updateDuration, {
          once: true
        });
      }

      audio.load();
      player.dataset.audioLoaded = "true";
      player.classList.remove("loading");

      console.log("[音乐播放器] 后备加载完成:", musicData.name);
    } else {
      console.error("[音乐播放器] API返回错误或无音频URL:", response);
      if (errorEl) errorEl.style.display = "flex";
      player.classList.remove("loading");
      return;
    }
  } catch (error) {
    console.error("[音乐播放器] 初始化失败:", error);
    if (errorEl) errorEl.style.display = "flex";
    player.classList.remove("loading");
  }
};

/**
 * 切换播放/暂停 - 供HTML onclick调用
 */
export const musicPlayerToggle = async (playerId: string) => {
  const player = document.getElementById(playerId);
  if (!player) return;

  const audio = player.querySelector(
    ".music-audio-element"
  ) as HTMLAudioElement;
  if (!audio) return;

  // 如果音频还未加载（预加载失败的情况），尝试手动加载
  if (!player.dataset.audioLoaded) {
    await initMusicPlayerData(playerId);
  }

  if (audio.paused) {
    audio.play().catch(err => console.error("[音乐播放器] 播放失败:", err));
  } else {
    audio.pause();
  }
};

/**
 * 进度条跳转 - 供HTML onclick调用
 */
export const musicPlayerSeek = (playerId: string, event: MouseEvent) => {
  const player = document.getElementById(playerId);
  if (!player) return;

  const audio = player.querySelector(
    ".music-audio-element"
  ) as HTMLAudioElement;
  const progressBar = event.currentTarget as HTMLElement;
  if (!audio || !progressBar) return;

  const rect = progressBar.getBoundingClientRect();
  const percent = (event.clientX - rect.left) / rect.width;
  if (audio.duration) {
    audio.currentTime = percent * audio.duration;
  }
};

/**
 * 初始化所有音乐播放器的audio事件监听
 */
export const initAllMusicPlayers = (container: HTMLElement) => {
  const musicPlayers = container.querySelectorAll(
    ".markdown-music-player[data-music-id]"
  );

  console.log(`[文章详情] 发现 ${musicPlayers.length} 个音乐播放器`);

  musicPlayers.forEach(playerEl => {
    const player = playerEl as HTMLElement;
    const audio = player.querySelector(
      ".music-audio-element"
    ) as HTMLAudioElement;

    if (!audio || audio.dataset.eventsAttached) return;
    audio.dataset.eventsAttached = "true";

    const artworkWrapper = player.querySelector(
      ".music-artwork-wrapper"
    ) as HTMLElement;
    const needleEl = player.querySelector(
      ".artwork-image-needle-background"
    ) as HTMLElement;
    const playIcon = player.querySelector(".music-play-icon") as HTMLElement;
    const pauseIcon = player.querySelector(".music-pause-icon") as HTMLElement;
    const progressFill = player.querySelector(
      ".music-progress-fill"
    ) as HTMLElement;
    const currentTimeEl = player.querySelector(".current-time") as HTMLElement;
    const durationEl = player.querySelector(".duration") as HTMLElement;

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
      if (progressFill && audio.duration) {
        const progress = (audio.currentTime / audio.duration) * 100 || 0;
        progressFill.style.width = progress + "%";
      }
      if (currentTimeEl) {
        currentTimeEl.textContent = formatTime(audio.currentTime);
      }
    });

    audio.addEventListener("loadedmetadata", () => {
      if (durationEl) {
        durationEl.textContent = formatTime(audio.duration);
      }
    });

    audio.addEventListener("ended", () => {
      audio.currentTime = 0;
      if (artworkWrapper) artworkWrapper.classList.remove("is-playing");
      if (needleEl) needleEl.classList.remove("needle-playing");
    });

    // 预加载音频元数据以显示时长
    const preloadAudioMetadata = async () => {
      try {
        const musicDataAttr = player.getAttribute("data-music-data");
        if (!musicDataAttr) return;

        const decodedData = musicDataAttr
          .replace(/&quot;/g, '"')
          .replace(/&#039;/g, "'")
          .replace(/&amp;/g, "&");

        const musicData = JSON.parse(decodedData);
        if (!musicData.neteaseId) return;

        console.log(
          `[音乐播放器] 预加载元数据 - ${musicData.name || "未知歌曲"}`
        );

        // 应用封面主色到进度条
        if (musicData.color) {
          const progressFill = player.querySelector(
            ".music-progress-fill"
          ) as HTMLElement;
          if (progressFill) {
            progressFill.style.background = musicData.color;
            console.log("[音乐播放器] 应用主色:", musicData.color);
          }
        }

        // 调用 API 获取音频链接
        const response = await getSongResourcesApi(musicData.neteaseId);

        if (response.code === 200 && response.data?.audioUrl) {
          audio.src = response.data.audioUrl;
          audio.preload = "metadata"; // 只预加载元数据，不下载整个音频
          player.dataset.audioLoaded = "true";

          console.log(
            `[音乐播放器] 元数据预加载完成 - ${musicData.name || "未知歌曲"}`
          );
        }
      } catch (error) {
        console.error("[音乐播放器] 预加载元数据失败:", error);
      }
    };

    // 异步预加载
    preloadAudioMetadata();
  });
};

/**
 * 注册全局函数
 */
export const registerGlobalMusicFunctions = () => {
  (window as any).__musicPlayerToggle = musicPlayerToggle;
  (window as any).__musicPlayerSeek = musicPlayerSeek;
};

/**
 * 清理全局函数
 */
export const unregisterGlobalMusicFunctions = () => {
  delete (window as any).__musicPlayerToggle;
  delete (window as any).__musicPlayerSeek;
};
