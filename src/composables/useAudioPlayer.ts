/**
 * @Description: 音频播放器逻辑 composable
 * @Author: 安知鱼
 * @Date: 2025-09-20 14:50:00
 */
import { ref, reactive, computed, watch, type Ref } from "vue";
import type { Song, AudioState } from "../types/music";

export function useAudioPlayer(playlist: Ref<Song[]>) {
  // 音频引用
  const audioRef = ref<HTMLAudioElement>();

  // 当前播放索引
  const currentSongIndex = ref(0);

  // 音频状态
  const audioState = reactive<AudioState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    isMuted: false
  });

  // 加载相关状态
  const loadedPercentage = ref(0);
  const loadingPlaylistItem = ref(-1);

  // 播放失败重试计数器
  let consecutiveFailures = 0;
  const MAX_CONSECUTIVE_FAILURES = 3;

  // 计算属性
  const currentSong = computed(() => playlist.value[currentSongIndex.value]);
  const playedPercentage = computed(() => {
    return audioState.duration > 0
      ? (audioState.currentTime / audioState.duration) * 100
      : 0;
  });

  // 安全设置音量
  const safeSetVolume = (volume: number): void => {
    if (audioRef.value) {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      audioRef.value.volume = audioState.isMuted ? 0 : clampedVolume;
    }
  };

  // 当前加载状态标记，防止同时加载多个歌曲
  let isLoadingSong = false;

  // 播放指定歌曲
  const playSong = async (index: number): Promise<boolean> => {
    if (index < 0 || index >= playlist.value.length) {
      return false;
    }

    // 防止同时加载多个歌曲
    if (isLoadingSong) {
      return false;
    }

    isLoadingSong = true;

    try {
      currentSongIndex.value = index;
      const song = currentSong.value;

      if (!song.url) {
        return false;
      }

      if (audioRef.value) {
        // 强制停止所有音频播放，防止多个音频同时播放
        audioRef.value.pause();
        audioRef.value.currentTime = 0;

        // 清空当前源，防止后台继续加载
        audioRef.value.src = "";
        audioRef.value.load();

        // 创建Promise来监听音频加载结果
        const audioLoadPromise = new Promise<boolean>((resolve, reject) => {
          const audio = audioRef.value;
          if (!audio) {
            reject(new Error("音频元素未初始化"));
            return;
          }

          // 设置超时时间（10秒）
          const timeout = setTimeout(() => {
            reject(new Error("音频加载超时"));
          }, 10000);

          // 监听成功事件
          const onCanPlay = () => {
            clearTimeout(timeout);
            cleanup();
            resolve(true);
          };

          // 监听错误事件
          const onError = (event: Event) => {
            clearTimeout(timeout);
            cleanup();
            const error = (event.target as HTMLAudioElement)?.error;
            let errorMessage = "音频加载失败";

            if (error) {
              switch (error.code) {
                case MediaError.MEDIA_ERR_ABORTED:
                  errorMessage = "音频加载被中止";
                  break;
                case MediaError.MEDIA_ERR_NETWORK:
                  errorMessage = "网络错误导致音频加载失败";
                  break;
                case MediaError.MEDIA_ERR_DECODE:
                  errorMessage = "音频解码失败";
                  break;
                case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                  errorMessage = "不支持的音频格式或源";
                  break;
                default:
                  errorMessage = `音频加载失败 (错误代码: ${error.code})`;
              }
            }

            reject(new Error(errorMessage));
          };

          // 清理事件监听器
          const cleanup = () => {
            audio.removeEventListener("canplay", onCanPlay);
            audio.removeEventListener("error", onError);
          };

          // 添加事件监听器
          audio.addEventListener("canplay", onCanPlay);
          audio.addEventListener("error", onError);

          // 开始加载音频
          audio.src = song.url;
          safeSetVolume(audioState.volume);
          audio.load();
        });

        // 等待音频加载完成
        const success = await audioLoadPromise;
        if (success) {
          consecutiveFailures = 0; // 重置失败计数器
          return true;
        }
      }

      return false;
    } catch (error) {
      return false;
    } finally {
      isLoadingSong = false; // 无论成功还是失败，都要重置加载状态
    }
  };

  // 播放控制
  const togglePlay = async () => {
    if (!audioRef.value || !currentSong.value) return;

    if (audioState.isPlaying) {
      audioRef.value.pause();
    } else {
      try {
        await audioRef.value.play();
      } catch (error) {
        // 处理不支持的音频格式或其他播放错误，自动切换到下一首
        if (error instanceof DOMException) {
          if (
            error.name === "NotSupportedError" ||
            error.name === "NotAllowedError" ||
            error.name === "AbortError"
          ) {
            setTimeout(() => {
              nextSong(true); // 强制播放下一首
            }, 500);
          }
        }
      }
    }
  };

  // 上一首
  const previousSong = async () => {
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      return;
    }

    const wasPlaying = audioState.isPlaying;
    let nextIndex = currentSongIndex.value - 1;
    if (nextIndex < 0) {
      nextIndex = playlist.value.length - 1;
    }

    const success = await playSong(nextIndex);
    if (!success) {
      consecutiveFailures++;

      if (consecutiveFailures < MAX_CONSECUTIVE_FAILURES) {
        setTimeout(() => previousSong(), 1000);
      }
    } else {
      consecutiveFailures = 0;

      if (wasPlaying && audioRef.value) {
        try {
          await audioRef.value.play();
        } catch (error) {
          // 自动播放失败
        }
      }
    }
  };

  // 下一首
  const nextSong = async (forcePlay: boolean = false) => {
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      return;
    }

    const wasPlaying = audioState.isPlaying || forcePlay;
    let nextIndex = currentSongIndex.value + 1;
    if (nextIndex >= playlist.value.length) {
      nextIndex = 0;
    }

    const success = await playSong(nextIndex);
    if (!success) {
      consecutiveFailures++;

      if (consecutiveFailures < MAX_CONSECUTIVE_FAILURES) {
        setTimeout(() => nextSong(forcePlay), 1000);
      }
    } else {
      consecutiveFailures = 0;

      if (wasPlaying && audioRef.value) {
        try {
          await audioRef.value.play();
        } catch (error) {
          // 自动播放失败
        }
      }
    }
  };

  // 切换静音
  const toggleMute = () => {
    audioState.isMuted = !audioState.isMuted;
    safeSetVolume(audioState.volume);
  };

  // 设置音量
  const setVolume = (volume: number) => {
    audioState.volume = Math.max(0, Math.min(1, volume));
    audioState.isMuted = false;
    safeSetVolume(audioState.volume);
  };

  // 进度控制
  const seek = (percentage: number) => {
    if (!audioRef.value || !audioState.duration) return;

    const targetTime = percentage * audioState.duration;
    audioRef.value.currentTime = targetTime;
    audioState.currentTime = targetTime;
  };

  // 播放列表项点击
  const handlePlaylistItemClick = async (index: number) => {
    if (loadingPlaylistItem.value !== -1) {
      return;
    }

    if (index === currentSongIndex.value) {
      togglePlay();
      return;
    }

    loadingPlaylistItem.value = index;
    const wasPlaying = audioState.isPlaying;

    try {
      const success = await playSong(index);
      if (success) {
        if (wasPlaying && audioRef.value) {
          try {
            await audioRef.value.play();
          } catch (error) {
            // 自动播放失败
          }
        }
      } else {
        // 如果失败，尝试播放下一首可用的歌曲
        let fallbackIndex = index + 1;
        let attempts = 0;
        const maxAttempts = 3;

        while (
          attempts < maxAttempts &&
          fallbackIndex < playlist.value.length
        ) {
          loadingPlaylistItem.value = fallbackIndex;
          const fallbackSuccess = await playSong(fallbackIndex);

          if (fallbackSuccess) {
            if (wasPlaying && audioRef.value) {
              try {
                await audioRef.value.play();
              } catch (error) {
                // 备选歌曲自动播放失败
              }
            }
            break;
          }

          fallbackIndex++;
          attempts++;
        }

        if (attempts >= maxAttempts) {
          // 所有备选歌曲都无法播放
        }
      }
    } catch (error) {
      // 播放列表点击处理失败
    } finally {
      loadingPlaylistItem.value = -1;
    }
  };

  // 音频事件处理
  const onLoadStart = () => {
    // 开始加载音频
  };

  const onLoadedMetadata = () => {
    if (audioRef.value) {
      audioState.duration = audioRef.value.duration || 0;
    }
  };

  const onTimeUpdate = () => {
    if (audioRef.value) {
      audioState.currentTime = audioRef.value.currentTime;

      // 更新加载进度
      if (audioRef.value.buffered.length > 0) {
        const bufferedEnd = audioRef.value.buffered.end(
          audioRef.value.buffered.length - 1
        );
        loadedPercentage.value =
          audioState.duration > 0
            ? (bufferedEnd / audioState.duration) * 100
            : 0;
      }
    }
  };

  const onEnded = () => {
    // 歌曲结束时强制播放下一首，不依赖当前播放状态
    nextSong(true);
  };

  const onError = (error: Event) => {
    audioState.isPlaying = false;

    // 错误处理：尝试播放下一首歌曲
    setTimeout(() => {
      if (playlist.value.length > 1) {
        nextSong(true); // 强制播放下一首
      }
    }, 1000);
  };

  // 存储事件监听器引用，用于清理
  let playListener: (() => void) | null = null;
  let pauseListener: (() => void) | null = null;

  // 监听播放状态
  watch(
    () => audioRef.value,
    (audio, oldAudio) => {
      // 清理旧的事件监听器
      if (oldAudio && playListener && pauseListener) {
        oldAudio.removeEventListener("play", playListener);
        oldAudio.removeEventListener("pause", pauseListener);
      }

      if (audio) {
        // 创建新的事件监听器
        playListener = () => {
          audioState.isPlaying = true;
        };

        pauseListener = () => {
          audioState.isPlaying = false;
        };

        audio.addEventListener("play", playListener);
        audio.addEventListener("pause", pauseListener);
      }
    },
    { immediate: true }
  );

  // 清理函数
  const cleanup = () => {
    if (audioRef.value && playListener && pauseListener) {
      audioRef.value.removeEventListener("play", playListener);
      audioRef.value.removeEventListener("pause", pauseListener);
    }
  };

  return {
    // 状态
    audioRef,
    currentSongIndex,
    audioState,
    loadedPercentage,
    loadingPlaylistItem,

    // 计算属性
    currentSong,
    playedPercentage,

    // 方法
    playSong,
    togglePlay,
    previousSong,
    nextSong,
    toggleMute,
    setVolume,
    seek,
    handlePlaylistItemClick,

    // 事件处理
    onLoadStart,
    onLoadedMetadata,
    onTimeUpdate,
    onEnded,
    onError,

    // 清理方法
    cleanup
  };
}
