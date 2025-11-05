/**
 * 音乐播放器全局处理函数
 * 这些函数会被HTML的onclick属性调用
 */

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
 * 初始化音乐播放器数据（仅加载音频源）
 */
const initMusicPlayerData = (playerId: string) => {
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
    console.log("[音乐播放器] 原始data-music-data:", musicDataAttr);

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

    console.log("[音乐播放器] 解码后的数据:", decodedData);

    const musicData = JSON.parse(decodedData);
    console.log("[音乐播放器] 解析后的音乐数据:", musicData);

    if (!musicData.url) {
      console.error("[音乐播放器] 音乐URL不存在, musicData:", musicData);
      if (errorEl) errorEl.style.display = "flex";
      return;
    }

    audio.src = musicData.url;
    audio.load();
    player.dataset.audioLoaded = "true";

    // 应用主色到进度条
    if (musicData.color) {
      const progressFill = player.querySelector(
        ".music-progress-fill"
      ) as HTMLElement;
      if (progressFill) {
        progressFill.style.background = musicData.color;
        console.log("[音乐播放器] 应用主色:", musicData.color);
      }
    }

    console.log("[音乐播放器] 音频加载完成:", musicData.name);
  } catch (error) {
    console.error("[音乐播放器] 初始化失败:", error);
    if (errorEl) errorEl.style.display = "flex";
  }
};

/**
 * 切换播放/暂停 - 供HTML onclick调用
 */
export const musicPlayerToggle = (playerId: string) => {
  const player = document.getElementById(playerId);
  if (!player) return;

  const audio = player.querySelector(
    ".music-audio-element"
  ) as HTMLAudioElement;
  if (!audio) return;

  // 首次点击时初始化音频数据
  initMusicPlayerData(playerId);

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
