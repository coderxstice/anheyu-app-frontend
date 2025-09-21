/**
 * @Description: 歌词处理逻辑 composable
 * @Author: 安知鱼
 * @Date: 2025-09-20 15:00:00
 */
import { ref, reactive, nextTick, shallowRef, type Ref } from "vue";
import type { LyricLine, LyricsState, LyricInput } from "../types/music";

export function useLyrics(currentTime: Ref<number>) {
  // 歌词数据
  const lyrics = ref<LyricLine[]>([]);

  // 歌词状态
  const lyricsState = reactive<LyricsState>({
    currentIndex: -1,
    translateY: 0,
    shouldScroll: []
  });

  // 歌词DOM引用
  const lyricRefs = shallowRef<(HTMLElement | null)[]>([]);

  // 防抖定时器
  let lyricScrollTimer: number | null = null;

  // 验证和标准化歌词文本格式
  const validateAndNormalizeLyrics = (input: LyricInput): string => {
    try {
      // 如果是字符串，直接返回
      if (typeof input === "string") {
        return input;
      }

      // 如果输入是对象，尝试提取LRC内容
      if (typeof input === "object" && input !== null) {
        // 类型保护：检查是否有data属性且data有lrc属性
        if (
          "data" in input &&
          input.data &&
          typeof input.data === "object" &&
          "lrc" in input.data
        ) {
          return input.data.lrc;
        }

        // 类型保护：检查是否直接有lrc属性
        if ("lrc" in input && typeof input.lrc === "string") {
          return input.lrc;
        }

        // 类型保护：检查是否有lyric属性
        if ("lyric" in input && typeof input.lyric === "string") {
          return input.lyric;
        }
      }

      console.warn("无法识别的歌词格式:", typeof input, input);
      return "";
    } catch (error) {
      console.error("歌词格式验证失败:", error);
      return "";
    }
  };

  // 解析歌词文本 - 支持多种时间戳格式
  const parseLyrics = (lrcInput: LyricInput): LyricLine[] => {
    // 先进行格式验证和标准化
    const lrcText = validateAndNormalizeLyrics(lrcInput);

    if (!lrcText || typeof lrcText !== "string") {
      console.warn("歌词内容为空或格式无效");
      return [];
    }

    const lines = lrcText.split("\n");
    const result: LyricLine[] = [];

    lines.forEach((line, lineIndex) => {
      // 支持多种LRC时间戳格式
      // 格式1: [00:12.34] 或 [00:12.345] (标准格式)
      let match = line.match(/\[(\d{1,2}):(\d{2})\.(\d{2,3})\](.*)/);

      if (!match) {
        // 格式2: [00:12:34] (某些API使用的格式)
        match = line.match(/\[(\d{1,2}):(\d{2}):(\d{2})\](.*)/);
        if (match) {
          // 转换为标准格式处理
          const minutes = parseInt(match[1]);
          const seconds = parseInt(match[2]);
          const centiseconds = parseInt(match[3]);
          const time = minutes * 60 + seconds + centiseconds / 100;
          const text = match[4].trim();

          if (text) {
            result.push({ time, text });
          }
          return;
        }
      }

      if (!match) {
        // 格式3: [00:12] (简化格式，只有分钟和秒)
        match = line.match(/\[(\d{1,2}):(\d{2})\](.*)/);
        if (match) {
          const minutes = parseInt(match[1]);
          const seconds = parseInt(match[2]);
          const time = minutes * 60 + seconds;
          const text = match[3].trim();

          if (text) {
            result.push({ time, text });
          }
          return;
        }
      }

      // 标准格式处理
      if (match) {
        const minutes = parseInt(match[1]);
        const seconds = parseInt(match[2]);
        const milliseconds = parseInt(match[3].padEnd(3, "0"));
        const time = minutes * 60 + seconds + milliseconds / 1000;
        const text = match[4].trim();

        if (text && text.length > 0) {
          result.push({ time, text });
        }
      } else if (line.trim() && !line.startsWith("[") && lineIndex < 10) {
        // 检查前10行是否有非LRC格式的内容，记录警告
        console.warn(
          `无法解析的歌词行 ${lineIndex + 1}: "${line.substring(0, 50)}..."`
        );
      }
    });

    // 按时间排序并去重
    const sortedResult = result.sort((a, b) => a.time - b.time);

    // 去除重复的时间戳
    const uniqueResult = sortedResult.filter((item, index) => {
      return (
        index === 0 || Math.abs(item.time - sortedResult[index - 1].time) > 0.1
      );
    });

    if (process.env.NODE_ENV === "development") {
      console.log(`歌词解析完成:
        原始行数=${lines.length},
        有效歌词=${uniqueResult.length},
        时间范围=${uniqueResult.length > 0 ? `${uniqueResult[0].time.toFixed(1)}s - ${uniqueResult[uniqueResult.length - 1].time.toFixed(1)}s` : "无"}`);
    }

    return uniqueResult;
  };

  // 设置歌词
  const setLyrics = (lrcInput: LyricInput) => {
    lyrics.value = parseLyrics(lrcInput);
    lyricRefs.value = new Array(lyrics.value.length).fill(null);
    lyricsState.shouldScroll = new Array(lyrics.value.length).fill(false);
    lyricsState.currentIndex = findCurrentLyricIndex();
    calculateLyricsPosition();

    nextTick(() => {
      checkCurrentLyricScrollNeed();
    });
  };

  // 根据当前播放时间查找对应的歌词索引
  const findCurrentLyricIndex = (): number => {
    if (lyrics.value.length === 0) return -1;

    const current = currentTime.value;

    for (let i = lyrics.value.length - 1; i >= 0; i--) {
      if (current >= lyrics.value[i].time) {
        return i;
      }
    }

    return -1;
  };

  // 计算歌词滚动位置
  const calculateLyricsPosition = () => {
    if (lyrics.value.length === 0) {
      lyricsState.translateY = 0;
      return;
    }

    const lineHeight = 20;

    if (lyricsState.currentIndex < 0) {
      lyricsState.translateY = 0;
      return;
    }

    const targetY = 0 - lyricsState.currentIndex * lineHeight;
    lyricsState.translateY = targetY;
  };

  // 获取单句歌词的持续时间
  const getLyricDuration = (currentIndex: number): number => {
    if (currentIndex < 0 || currentIndex >= lyrics.value.length) {
      return 0;
    }

    // 如果是最后一句歌词，默认给个合理的时间
    if (currentIndex === lyrics.value.length - 1) {
      return 8; // 默认8秒
    }

    // 计算到下一句歌词的时间差
    const currentTime = lyrics.value[currentIndex].time;
    const nextTime = lyrics.value[currentIndex + 1].time;
    const duration = nextTime - currentTime;

    // 确保时间在合理范围内 (最小2秒，最大20秒)
    return Math.max(2, Math.min(20, duration));
  };

  // 检测当前播放歌词是否需要滚动
  const checkCurrentLyricScrollNeed = async () => {
    // 清除之前的定时器
    if (lyricScrollTimer) {
      clearTimeout(lyricScrollTimer);
    }

    lyricScrollTimer = window.setTimeout(async () => {
      await nextTick();

      // 先清除所有歌词的滚动状态
      lyrics.value.forEach((_, i) => {
        const lyricEl = lyricRefs.value[i];
        if (lyricEl) {
          lyricEl.classList.remove("text-scrolling");
          lyricEl.removeAttribute("data-long-text");
          lyricEl.style.removeProperty("--scroll-duration");
        }
      });

      // 重置滚动状态数组
      lyricsState.shouldScroll = new Array(lyrics.value.length).fill(false);

      // 只检测当前播放的歌词
      const currentIndex = lyricsState.currentIndex;
      if (currentIndex >= 0 && currentIndex < lyrics.value.length) {
        const lyricEl = lyricRefs.value[currentIndex];
        if (lyricEl && lyricEl.parentElement) {
          const container = lyricEl.parentElement;
          const containerWidth = container.clientWidth;
          const textWidth = lyricEl.scrollWidth;

          // 添加容错空间
          const threshold = 10;
          const needsScroll = textWidth > containerWidth + threshold;

          // 调试信息
          if (process.env.NODE_ENV === "development") {
            console.log(`当前歌词 ${currentIndex}: "${lyrics.value[currentIndex]?.text?.substring(0, 30)}..."
            容器宽度: ${containerWidth}px,
            文本宽度: ${textWidth}px,
            需要滚动: ${needsScroll}`);
          }

          lyricsState.shouldScroll[currentIndex] = needsScroll;

          // 如果当前歌词需要滚动，设置滚动动画
          if (needsScroll) {
            const textLength = lyrics.value[currentIndex]?.text?.length || 0;
            const overflowRatio = textWidth / containerWidth;
            const lyricDuration = getLyricDuration(currentIndex);

            // 基于歌词时长优化滚动速度计算
            let scrollDuration: number;
            let startDelay: number;

            if (overflowRatio <= 1.5) {
              // 轻微溢出：滚动时间为歌词时长的70%，延迟30%后开始滚动
              scrollDuration = lyricDuration * 0.7;
              startDelay = lyricDuration * 0.3;
            } else if (overflowRatio <= 2.5) {
              // 中等溢出：滚动时间为歌词时长的80%，延迟20%后开始滚动
              scrollDuration = lyricDuration * 0.8;
              startDelay = lyricDuration * 0.2;
            } else {
              // 严重溢出：滚动时间为歌词时长的90%，延迟10%后开始滚动
              scrollDuration = lyricDuration * 0.9;
              startDelay = lyricDuration * 0.1;
            }

            // 根据文本长度微调滚动速度
            const lengthFactor = Math.max(0.8, Math.min(1.2, textLength / 40));
            scrollDuration = scrollDuration * lengthFactor;

            // 确保滚动时间在合理范围内 (最小3秒，最大18秒)
            scrollDuration = Math.max(3, Math.min(18, scrollDuration));
            // 确保延迟时间合理 (最小0.5秒，最大3秒)
            startDelay = Math.max(0.5, Math.min(3, startDelay));

            lyricEl.style.setProperty(
              "--scroll-duration",
              `${scrollDuration}s`
            );

            // 为超长文本添加特殊标记
            if (textLength > 50 || overflowRatio > 2.5) {
              lyricEl.setAttribute("data-long-text", "true");
            }

            // 延迟启动滚动动画，让用户先阅读开头
            setTimeout(() => {
              if (
                lyricEl.parentElement &&
                lyricsState.currentIndex === currentIndex
              ) {
                lyricEl.classList.add("text-scrolling");
              }
            }, startDelay * 1000);

            // 调试信息
            if (process.env.NODE_ENV === "development") {
              console.log(
                `当前歌词设置滚动:
                文本长度=${textLength},
                溢出比=${overflowRatio.toFixed(2)},
                歌词持续时间=${lyricDuration.toFixed(1)}s,
                滚动时间=${scrollDuration.toFixed(1)}s,
                延迟启动=${startDelay.toFixed(1)}s`
              );
            }
          }
        }
      }
    }, 100); // 100ms防抖
  };

  // 设置歌词行的DOM引用
  const setLyricRef = (el: any, index: number) => {
    if (el && el instanceof HTMLElement) {
      lyricRefs.value[index] = el;
    }
  };

  // 更新当前歌词索引
  const updateCurrentLyricIndex = () => {
    if (lyrics.value.length > 0) {
      const newLyricIndex = findCurrentLyricIndex();

      if (newLyricIndex !== lyricsState.currentIndex) {
        lyricsState.currentIndex = newLyricIndex;
        calculateLyricsPosition();
        checkCurrentLyricScrollNeed();
      }
    }
  };

  // 清空歌词
  const clearLyrics = () => {
    lyrics.value = [];
    lyricRefs.value = [];
    lyricsState.currentIndex = -1;
    lyricsState.translateY = 0;
    lyricsState.shouldScroll = [];
  };

  // 清理资源
  const cleanup = () => {
    if (lyricScrollTimer) {
      clearTimeout(lyricScrollTimer);
      lyricScrollTimer = null;
    }
  };

  return {
    // 状态
    lyrics,
    lyricsState,
    lyricRefs,

    // 方法
    parseLyrics,
    validateAndNormalizeLyrics,
    setLyrics,
    clearLyrics,
    setLyricRef,
    updateCurrentLyricIndex,
    findCurrentLyricIndex,
    calculateLyricsPosition,
    checkCurrentLyricScrollNeed,
    getLyricDuration,
    cleanup
  };
}
