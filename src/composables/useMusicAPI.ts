/**
 * @Description: 音乐API调用逻辑 composable
 * @Author: 安知鱼
 * @Date: 2025-09-22 16:00:00
 */
import { ref } from "vue";
import type { Song } from "../types/music";
import { getPlaylistApi } from "../api/music";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { get } from "lodash-es";

/**
 * 确保URL使用HTTPS协议，避免Mixed Content警告
 * @param url 原始URL
 * @returns HTTPS URL
 */
const ensureHttps = (url: string): string => {
  if (!url) return url;
  if (url.startsWith("http://")) {
    return url.replace("http://", "https://");
  }
  return url;
};

// 播放列表缓存接口
interface PlaylistCache {
  data: Song[];
  playlistId: string;
  customPlaylistUrl: string | null; // 自定义歌单URL字段
  timestamp: number;
}

export function useMusicAPI() {
  // 加载状态
  const isLoading = ref(false);

  // 获取站点配置 store
  const siteConfigStore = useSiteConfigStore();

  // 缓存配置
  const CACHE_KEY = "anheyu-playlist-cache";
  const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7天缓存

  // 从配置获取音乐API基础地址
  const getMusicAPIBaseURL = (): string => {
    // 优先尝试前端路径格式，降级到后端key格式（兼容两种数据来源）
    const apiBaseURL =
      get(siteConfigStore.siteConfig, "frontDesk.home.music.api.base_url") ||
      get(siteConfigStore.siteConfig, "music.api.base_url");
    return apiBaseURL && apiBaseURL.trim() !== ""
      ? apiBaseURL.trim()
      : "https://metings.qjqq.cn";
  };

  // 从配置获取当前播放列表ID
  const getCurrentPlaylistId = (): string => {
    // 优先尝试前端路径格式，降级到后端key格式（兼容两种数据来源）
    const configId =
      get(
        siteConfigStore.siteConfig,
        "frontDesk.home.music.player.playlist_id"
      ) || get(siteConfigStore.siteConfig, "music.player.playlist_id");
    if (configId) {
      return configId;
    }

    // 备用：从 localStorage 获取
    const localId = localStorage.getItem("music-playlist-id");
    if (localId) {
      return localId;
    }

    // 默认值
    return "8152976493";
  };

  // 从配置获取自定义歌单JSON链接（音乐馆页面使用）
  const getCustomPlaylistUrl = (): string | null => {
    // 优先尝试前端路径格式，降级到后端key格式（兼容两种数据来源）
    const customUrl =
      get(
        siteConfigStore.siteConfig,
        "frontDesk.home.music.player.custom_playlist"
      ) || get(siteConfigStore.siteConfig, "music.player.custom_playlist");
    const result =
      customUrl && customUrl.trim() !== "" ? customUrl.trim() : null;

    console.log("[MUSIC_CONFIG] 获取音乐馆自定义歌单链接:", {
      rawValue: customUrl,
      trimmedValue: result,
      siteConfigExists: !!siteConfigStore.siteConfig,
      musicConfigExists: !!(
        get(siteConfigStore.siteConfig, "frontDesk.home.music.player") ||
        get(siteConfigStore.siteConfig, "music.player")
      )
    });

    return result;
  };

  // 从配置获取音乐胶囊专用的自定义歌单JSON链接
  const getCapsuleCustomPlaylistUrl = (): string | null => {
    // 优先尝试前端路径格式，降级到后端key格式（兼容两种数据来源）
    const customUrl =
      get(
        siteConfigStore.siteConfig,
        "frontDesk.home.music.capsule.custom_playlist"
      ) || get(siteConfigStore.siteConfig, "music.capsule.custom_playlist");
    const result =
      customUrl && customUrl.trim() !== "" ? customUrl.trim() : null;

    console.log("[MUSIC_CONFIG] 获取音乐胶囊自定义歌单链接:", {
      rawValue: customUrl,
      trimmedValue: result,
      siteConfigExists: !!siteConfigStore.siteConfig,
      capsuleConfigExists: !!(
        get(siteConfigStore.siteConfig, "frontDesk.home.music.capsule") ||
        get(siteConfigStore.siteConfig, "music.capsule")
      )
    });

    return result;
  };

  // 获取缓存
  const getPlaylistCache = (): PlaylistCache | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const cache: PlaylistCache = JSON.parse(cached);

      // 检查缓存是否过期
      if (Date.now() - cache.timestamp > CACHE_DURATION) {
        console.log("[MUSIC_CACHE] 缓存已过期，清除缓存");
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      // 检查播放列表ID和自定义URL是否改变
      const currentId = getCurrentPlaylistId();
      const currentCustomUrl = getCustomPlaylistUrl();

      // 处理旧缓存：如果缓存中没有customPlaylistUrl字段，表示这是旧版本缓存
      const cachedCustomUrl = cache.customPlaylistUrl || null;

      if (
        cache.playlistId !== currentId ||
        cachedCustomUrl !== currentCustomUrl
      ) {
        console.log(`[MUSIC_CACHE] 播放列表配置已改变，清除缓存`);
        console.log(`  ID: ${cache.playlistId} -> ${currentId}`);
        console.log(`  Custom URL: ${cachedCustomUrl} -> ${currentCustomUrl}`);
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      console.log(
        `[MUSIC_CACHE] 使用缓存数据 - ID: ${cache.playlistId}, 歌曲数: ${cache.data.length}`
      );
      return cache;
    } catch (error) {
      console.error("[MUSIC_CACHE] 读取缓存失败:", error);
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
  };

  // 设置缓存
  const setPlaylistCache = (data: Song[]): void => {
    try {
      const cache: PlaylistCache = {
        data,
        playlistId: getCurrentPlaylistId(),
        customPlaylistUrl: getCustomPlaylistUrl(),
        timestamp: Date.now()
      };

      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      console.log(
        `[MUSIC_CACHE] 缓存播放列表 - ID: ${cache.playlistId}, Custom URL: ${cache.customPlaylistUrl || "无"}, 歌曲数: ${data.length}, 有歌词歌曲数: ${data.filter(song => song.lrc && song.lrc.trim()).length}`
      );
    } catch (error) {
      console.error("[MUSIC_CACHE] 设置缓存失败:", error);
    }
  };

  // 清除缓存
  const clearPlaylistCache = (): void => {
    localStorage.removeItem(CACHE_KEY);
    console.log("[MUSIC_CACHE] 清除播放列表缓存");
  };

  // 强制清除所有相关缓存（用于调试和问题排查）
  const clearAllMusicCache = (): void => {
    // 清除播放列表缓存
    localStorage.removeItem(CACHE_KEY);

    // 清除其他可能的音乐相关缓存
    const musicKeys = Object.keys(localStorage).filter(
      key =>
        key.includes("music") ||
        key.includes("playlist") ||
        key.includes("anheyu")
    );

    musicKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`[MUSIC_CACHE] 清除缓存: ${key}`);
    });

    console.log("[MUSIC_CACHE] 强制清除所有音乐相关缓存完成");
  };

  // 获取歌词内容（支持URL和直接内容）
  const fetchLyricContent = async (
    lrcValue: string,
    songName: string = "未知歌曲"
  ): Promise<string> => {
    console.log(`[MUSIC_API]  开始处理歌词 - 歌曲: ${songName}`, {
      lrcValue: lrcValue
        ? lrcValue.substring(0, 100) + (lrcValue.length > 100 ? "..." : "")
        : "空值",
      lrcValueLength: lrcValue ? lrcValue.length : 0,
      isEmpty: !lrcValue || lrcValue.trim() === ""
    });

    // 如果为空，返回空字符串
    if (!lrcValue || lrcValue.trim() === "") {
      console.log(`[MUSIC_API]  歌曲 "${songName}" 无歌词数据`);
      return "";
    }

    // 检查是否是URL（以http开头）
    const isUrl =
      lrcValue.startsWith("http://") || lrcValue.startsWith("https://");

    console.log(`[MUSIC_API]  歌词类型检测 - 歌曲: ${songName}`, {
      isUrl,
      lrcPreview: lrcValue.substring(0, 50) + "..."
    });

    if (isUrl) {
      try {
        console.log(
          `[MUSIC_API] 🔄 获取歌词文件: ${lrcValue} (歌曲: ${songName})`
        );
        const response = await fetch(lrcValue);
        if (!response.ok) {
          console.warn(
            `[MUSIC_API] ❌ 歌词文件获取失败 - 歌曲: ${songName}, 状态: ${response.status}: ${response.statusText}`
          );
          return "";
        }
        const lrcContent = await response.text();
        console.log(`[MUSIC_API]歌词内容获取成功 - 歌曲: ${songName}`, {
          contentLength: lrcContent.length,
          firstLines: lrcContent.split("\n").slice(0, 3).join(" | "),
          hasLrcFormat: lrcContent.includes("[") && lrcContent.includes("]")
        });
        return lrcContent;
      } catch (error) {
        console.warn(
          `[MUSIC_API] ❌ 歌词文件获取失败 - 歌曲: ${songName}:`,
          error
        );
        return "";
      }
    } else {
      // 直接返回歌词内容（已经是LRC格式的文本）
      console.log(`[MUSIC_API]  使用直接歌词内容 - 歌曲: ${songName}`, {
        contentLength: lrcValue.length,
        hasLrcFormat: lrcValue.includes("[") && lrcValue.includes("]")
      });
      return lrcValue;
    }
  };

  // 从自定义JSON链接获取歌单数据
  const fetchPlaylistFromJson = async (url: string): Promise<Song[]> => {
    try {
      console.log(`[MUSIC_API] 从自定义JSON链接获取歌单: ${url}`);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const jsonData = await response.json();

      // 检查数据格式
      if (!Array.isArray(jsonData)) {
        throw new Error("JSON数据格式错误：期望数组格式");
      }

      console.log(
        `[MUSIC_API] 开始处理 ${jsonData.length} 首歌曲，包括歌词获取`
      );

      // 批量处理歌曲数据，并获取歌词内容
      const songPromises = jsonData.map(async (item: any, index: number) => {
        const songName = item.name || item.title || `未知歌曲-${index}`;
        console.log(
          `[MUSIC_API]  开始处理第 ${index + 1} 首歌曲: ${songName}`,
          {
            hasLrc: !!(item.lrc && item.lrc.trim()),
            lrcType: item.lrc
              ? item.lrc.startsWith("http")
                ? "URL"
                : "直接内容"
              : "无",
            lrcPreview: item.lrc ? item.lrc.substring(0, 50) + "..." : "无歌词"
          }
        );

        const lrcContent = await fetchLyricContent(item.lrc || "", songName);

        const processedSong = {
          id: item.id || `custom-${index}`,
          name: songName,
          artist: item.artist || "未知艺术家",
          url: ensureHttps(item.url || ""),
          pic: ensureHttps(item.cover || item.pic || ""), // cover -> pic 字段映射，确保HTTPS
          lrc: lrcContent // 存储实际的歌词内容，而不是URL
        };

        console.log(`[MUSIC_API]歌曲处理完成: ${songName}`, {
          hasLyrics: !!(lrcContent && lrcContent.trim()),
          lyricsLength: lrcContent ? lrcContent.length : 0,
          lyricsPreview: lrcContent
            ? lrcContent.split("\n").slice(0, 2).join(" | ")
            : "无歌词"
        });

        return processedSong;
      });

      // 等待所有歌曲处理完成（包括歌词获取）
      const songs = await Promise.all(songPromises);

      console.log(`[MUSIC_API] 成功处理 ${songs.length} 首歌曲`, {
        songsWithLyrics: songs.filter(
          song => song.lrc && song.lrc.trim() !== ""
        ).length,
        songsWithoutLyrics: songs.filter(
          song => !song.lrc || song.lrc.trim() === ""
        ).length
      });

      return songs;
    } catch (error) {
      console.error(`[MUSIC_API] 从JSON链接获取歌单失败:`, error);
      throw error;
    }
  };

  // 强制刷新播放列表（清除缓存后重新获取）
  const refreshPlaylist = async (): Promise<Song[]> => {
    console.log("[MUSIC_API] 强制刷新播放列表...");

    // 显示当前配置状态
    const currentCustomUrl = getCustomPlaylistUrl();
    const currentPlaylistId = getCurrentPlaylistId();

    console.log("[MUSIC_API] 当前配置状态:", {
      customUrl: currentCustomUrl,
      playlistId: currentPlaylistId,
      useCustom: !!currentCustomUrl
    });

    clearPlaylistCache();
    return await fetchPlaylist(true);
  };

  // 获取歌单数据
  const fetchPlaylist = async (forceRefresh = false): Promise<Song[]> => {
    try {
      // 如果不是强制刷新，先检查缓存
      if (!forceRefresh) {
        const cached = getPlaylistCache();
        if (cached && cached.data.length > 0) {
          console.log(`[MUSIC_API]  使用缓存数据详细信息:`, {
            songsCount: cached.data.length,
            songsWithLyrics: cached.data.filter(
              song => song.lrc && song.lrc.trim()
            ).length,
            firstSongLyrics: cached.data[0]?.lrc?.length || 0,
            firstSongLyricsPreview: cached.data[0]?.lrc
              ? cached.data[0].lrc.substring(0, 50) + "..."
              : "无歌词",
            firstSongIsUrl: cached.data[0]?.lrc?.startsWith("http") || false,
            customPlaylistUrl: cached.customPlaylistUrl || "未设置",
            cacheAge:
              Math.round((Date.now() - cached.timestamp) / 1000 / 60) + "分钟前"
          });
          return cached.data;
        }
      }

      isLoading.value = true;

      // 优先检查是否有自定义JSON链接
      const customUrl = getCustomPlaylistUrl();

      if (customUrl) {
        console.log("[MUSIC_API] 使用自定义JSON链接获取播放列表...");
        try {
          const songs = await fetchPlaylistFromJson(customUrl);

          // 缓存结果
          setPlaylistCache(songs);

          return songs;
        } catch (error) {
          console.error(
            "[MUSIC_API] 自定义JSON链接获取失败，降级到后端API:",
            error
          );
          // 如果自定义JSON获取失败，降级到后端API
        }
      }

      // 第二优先级：调用后端API获取播放列表
      console.log("[MUSIC_API] 📡 调用后端API获取播放列表...");
      try {
        const response = await getPlaylistApi();

        if (response.code === 200 && response.data && response.data.songs) {
          const songs = response.data.songs;
          console.log(`[MUSIC_API]后端API成功返回 ${songs.length} 首歌曲`);

          // 转换为统一格式（如果需要），确保所有URL使用HTTPS
          const formattedSongs: Song[] = songs.map((song: any) => ({
            id: song.id || song.neteaseId || "",
            name: song.name || "未知歌曲",
            artist: song.artist || "未知歌手",
            url: ensureHttps(song.url || ""),
            pic: ensureHttps(song.pic || ""),
            lrc: song.lrc || "",
            neteaseId: song.neteaseId || song.id || ""
          }));

          // 缓存结果
          setPlaylistCache(formattedSongs);
          return formattedSongs;
        } else {
          console.error("[MUSIC_API] ❌ 后端API返回异常:", response);
          return [];
        }
      } catch (error) {
        console.error("[MUSIC_API] ❌ 后端API调用失败:", error);
        return [];
      }
    } catch (error) {
      console.error("获取播放列表失败:", error);
      return [];
    } finally {
      isLoading.value = false;
    }
  };

  // 音乐胶囊专用的缓存配置
  const CAPSULE_CACHE_KEY = "anheyu-capsule-playlist-cache";

  // 获取音乐胶囊缓存
  const getCapsulePlaylistCache = (): PlaylistCache | null => {
    try {
      const cached = localStorage.getItem(CAPSULE_CACHE_KEY);
      if (!cached) return null;

      const cache: PlaylistCache = JSON.parse(cached);

      // 检查缓存是否过期
      if (Date.now() - cache.timestamp > CACHE_DURATION) {
        console.log("[CAPSULE_CACHE] 缓存已过期，清除缓存");
        localStorage.removeItem(CAPSULE_CACHE_KEY);
        return null;
      }

      // 检查自定义URL是否改变
      const currentCustomUrl = getCapsuleCustomPlaylistUrl();
      const cachedCustomUrl = cache.customPlaylistUrl || null;

      if (cachedCustomUrl !== currentCustomUrl) {
        console.log(`[CAPSULE_CACHE] 胶囊播放列表配置已改变，清除缓存`);
        console.log(`  Custom URL: ${cachedCustomUrl} -> ${currentCustomUrl}`);
        localStorage.removeItem(CAPSULE_CACHE_KEY);
        return null;
      }

      console.log(
        `[CAPSULE_CACHE] 使用缓存数据 - 歌曲数: ${cache.data.length}`
      );
      return cache;
    } catch (error) {
      console.error("[CAPSULE_CACHE] 读取缓存失败:", error);
      localStorage.removeItem(CAPSULE_CACHE_KEY);
      return null;
    }
  };

  // 设置音乐胶囊缓存
  const setCapsulePlaylistCache = (data: Song[]): void => {
    try {
      const cache: PlaylistCache = {
        data,
        playlistId: getCurrentPlaylistId(),
        customPlaylistUrl: getCapsuleCustomPlaylistUrl(),
        timestamp: Date.now()
      };

      localStorage.setItem(CAPSULE_CACHE_KEY, JSON.stringify(cache));
      console.log(
        `[CAPSULE_CACHE] 缓存胶囊播放列表 - Custom URL: ${cache.customPlaylistUrl || "无"}, 歌曲数: ${data.length}`
      );
    } catch (error) {
      console.error("[CAPSULE_CACHE] 设置缓存失败:", error);
    }
  };

  // 清除音乐胶囊缓存
  const clearCapsulePlaylistCache = (): void => {
    localStorage.removeItem(CAPSULE_CACHE_KEY);
    console.log("[CAPSULE_CACHE] 清除胶囊播放列表缓存");
  };

  // 获取音乐胶囊专用的歌单数据
  const fetchCapsulePlaylist = async (
    forceRefresh = false
  ): Promise<Song[]> => {
    try {
      // 如果不是强制刷新，先检查胶囊专用缓存
      if (!forceRefresh) {
        const cached = getCapsulePlaylistCache();
        if (cached && cached.data.length > 0) {
          console.log(`[CAPSULE_API] 使用胶囊缓存数据:`, {
            songsCount: cached.data.length,
            customPlaylistUrl: cached.customPlaylistUrl || "未设置"
          });
          return cached.data;
        }
      }

      isLoading.value = true;

      // 优先检查胶囊专用的自定义JSON链接
      const capsuleCustomUrl = getCapsuleCustomPlaylistUrl();

      if (capsuleCustomUrl) {
        console.log("[CAPSULE_API] 使用胶囊专用自定义JSON链接获取播放列表...");
        try {
          const songs = await fetchPlaylistFromJson(capsuleCustomUrl);
          // 使用胶囊专用缓存
          setCapsulePlaylistCache(songs);
          return songs;
        } catch (error) {
          console.error(
            "[CAPSULE_API] 胶囊自定义JSON链接获取失败，降级到后端API:",
            error
          );
          // 如果自定义JSON获取失败，降级到后端API
        }
      }

      // 降级：调用后端API获取播放列表（与音乐馆共用）
      console.log("[CAPSULE_API] 📡 调用后端API获取播放列表...");
      try {
        const response = await getPlaylistApi();

        if (response.code === 200 && response.data && response.data.songs) {
          const songs = response.data.songs;
          console.log(`[CAPSULE_API] 后端API成功返回 ${songs.length} 首歌曲`);

          // 转换为统一格式
          const formattedSongs: Song[] = songs.map((song: any) => ({
            id: song.id || song.neteaseId || "",
            name: song.name || "未知歌曲",
            artist: song.artist || "未知歌手",
            url: ensureHttps(song.url || ""),
            pic: ensureHttps(song.pic || ""),
            lrc: song.lrc || "",
            neteaseId: song.neteaseId || song.id || ""
          }));

          // 使用胶囊专用缓存
          setCapsulePlaylistCache(formattedSongs);
          return formattedSongs;
        } else {
          console.error("[CAPSULE_API] ❌ 后端API返回异常:", response);
          return [];
        }
      } catch (error) {
        console.error("[CAPSULE_API] ❌ 后端API调用失败:", error);
        return [];
      }
    } catch (error) {
      console.error("获取胶囊播放列表失败:", error);
      return [];
    } finally {
      isLoading.value = false;
    }
  };

  // 强制刷新音乐胶囊播放列表
  const refreshCapsulePlaylist = async (): Promise<Song[]> => {
    console.log("[CAPSULE_API] 强制刷新胶囊播放列表...");

    const currentCapsuleUrl = getCapsuleCustomPlaylistUrl();

    console.log("[CAPSULE_API] 当前胶囊配置状态:", {
      capsuleCustomUrl: currentCapsuleUrl,
      useCapsuleCustom: !!currentCapsuleUrl
    });

    clearCapsulePlaylistCache();
    return await fetchCapsulePlaylist(true);
  };

  // 直接调用 Song_V1 API 获取单曲资源（音频+歌词）
  const fetchSongV1 = async (
    songId: string,
    level: "exhigh" | "standard"
  ): Promise<{
    url: string;
    lyric: string;
    level: string;
    size: string;
    error?: "server_error" | "not_found"; // 区分错误类型：服务器错误不降级，资源不存在可降级
  } | null> => {
    try {
      const formData = new URLSearchParams();
      formData.append("url", songId);
      formData.append("level", level);
      formData.append("type", "json");

      console.log(` [Song_V1 API] 直接调用 - ID: ${songId}, 音质: ${level}`);

      const apiBaseURL = getMusicAPIBaseURL();
      const response = await fetch(`${apiBaseURL}/Song_V1`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: formData
      });

      // 区分服务器错误和资源不存在
      if (!response.ok) {
        // 5xx 服务器错误 - 不应该降级
        if (response.status >= 500) {
          console.warn(
            ` [Song_V1 API] 服务器错误 ${response.status}，不尝试降级`
          );
          return {
            url: "",
            lyric: "",
            level: "",
            size: "",
            error: "server_error"
          };
        }
        // 4xx 客户端错误 - 可能是资源不存在，可以降级尝试
        console.warn(` [Song_V1 API] 请求失败 - 状态码: ${response.status}`);
        return {
          url: "",
          lyric: "",
          level: "",
          size: "",
          error: "not_found"
        };
      }

      const data = await response.json();

      if (data.status !== 200 || !data.success) {
        console.warn(
          ` [Song_V1 API] API返回错误 - 状态: ${data.status}, 消息: ${data.message}`
        );
        return {
          url: "",
          lyric: "",
          level: "",
          size: "",
          error: "not_found"
        };
      }

      console.log(
        ` [Song_V1 API] 成功获取 - 音质: ${data.data.level}, 大小: ${data.data.size}`
      );

      return {
        url: ensureHttps(data.data.url || ""),
        lyric: data.data.lyric || "",
        level: data.data.level,
        size: data.data.size
      };
    } catch (error) {
      console.error(` [Song_V1 API] 请求异常 (网络错误):`, error);
      // 网络异常 - 标记为服务器错误，不降级
      return {
        url: "",
        lyric: "",
        level: "",
        size: "",
        error: "server_error"
      };
    }
  };

  // 获取歌曲的音频和歌词资源（带音质自动降级）
  // 注意：前端直接调用 Song_V1 API，不再通过后端代理
  const fetchSongResources = async (
    song: Song
  ): Promise<{
    audioUrl: string;
    lyricsText: string;
    errorType?: "network" | "server" | "no_resources" | "unknown";
    errorMessage?: string;
  }> => {
    console.log(` [歌曲资源] 前端直接获取资源 - ${song.name}`, {
      hasLrc: !!(song.lrc && song.lrc.trim()),
      lrcLength: song.lrc?.length || 0,
      lrcType: song.lrc
        ? song.lrc.startsWith("http")
          ? "URL"
          : "LRC内容"
        : "无",
      hasNeteaseId: !!song.neteaseId,
      note: "前端直接调用 Song_V1 API"
    });

    // 优先使用歌曲自身的歌词内容（来自自定义JSON或已处理的数据）
    let lyricsText = "";
    if (song.lrc && song.lrc.trim() && !song.lrc.startsWith("http")) {
      // 如果 song.lrc 包含实际的LRC内容（不是URL），直接使用
      lyricsText = song.lrc;
      console.log(` [歌曲资源] 使用歌曲自带的LRC内容 - ${song.name}`, {
        lyricsLength: lyricsText.length,
        firstLine: lyricsText.split("\n")[0] || "空"
      });
    }

    // 如果没有网易云ID，返回现有的歌词内容
    if (!song.neteaseId) {
      console.log(` [歌曲资源] 歌曲无网易云ID，返回现有资源 - ${song.name}`, {
        hasLyrics: !!lyricsText,
        reason: "无网易云ID，跳过API调用"
      });
      return {
        audioUrl: "",
        lyricsText,
        errorType: lyricsText ? undefined : "no_resources",
        errorMessage: lyricsText ? undefined : "歌曲缺少网易云ID，无法获取资源"
      };
    }

    try {
      // 第一步：尝试获取 exhigh 音质
      console.log(" [音质降级] 步骤1 - 尝试 exhigh 音质");
      let result = await fetchSongV1(song.neteaseId, "exhigh");

      // 第二步：根据错误类型决定是否降级
      if (result?.error === "server_error") {
        // 服务器错误或网络异常，不降级，直接返回
        console.log(" [音质降级] ⚠️ 检测到服务器错误/网络异常，不尝试降级");
        return {
          audioUrl: song.url || "", // 回退到播放列表基础 URL（如果有）
          lyricsText: lyricsText,
          errorType: "server",
          errorMessage: "音乐服务暂时不可用"
        };
      }

      // 如果是资源不存在，尝试降级到 standard
      if (!result || !result.url) {
        console.log(" [音质降级] 步骤2 - exhigh 无资源，尝试 standard 音质");
        result = await fetchSongV1(song.neteaseId, "standard");

        // 如果 standard 也是服务器错误，直接返回
        if (result?.error === "server_error") {
          console.log(" [音质降级] ⚠️ standard 也是服务器错误");
          return {
            audioUrl: song.url || "",
            lyricsText: lyricsText,
            errorType: "server",
            errorMessage: "音乐服务暂时不可用"
          };
        }
      }

      // 第三步：检查最终结果
      if (!result || !result.url) {
        console.log(" [音质降级] 所有音质都不可用");
        return {
          audioUrl: song.url || "", // 尝试使用播放列表基础 URL
          lyricsText: lyricsText,
          errorType: song.url ? undefined : "no_resources",
          errorMessage: song.url ? undefined : "该歌曲暂无可用音源"
        };
      }

      // 成功获取资源
      console.log(
        ` [歌曲资源] 成功获取 - 音质: ${result.level}, 大小: ${result.size}`,
        {
          hasAudio: !!result.url,
          hasLyrics: !!result.lyric,
          existingLyrics: !!lyricsText
        }
      );

      // 优先使用已有的歌词内容，如果没有再使用API返回的
      const finalLyricsText = lyricsText || result.lyric || "";

      console.log(` [歌曲资源] 最终歌词选择 - ${song.name}`, {
        source: lyricsText ? "自定义JSON" : result.lyric ? "API" : "无",
        lyricsLength: finalLyricsText.length
      });

      return {
        audioUrl: result.url,
        lyricsText: finalLyricsText
      };
    } catch (error) {
      console.error(" [歌曲资源] 获取失败:", error);

      let errorType: "network" | "server" | "unknown" = "unknown";
      let errorMessage = "获取资源失败";

      if (error instanceof Error) {
        if (
          error.message.includes("502") ||
          error.message.includes("503") ||
          error.message.includes("500")
        ) {
          errorType = "server";
          errorMessage = "音乐服务暂时不可用";
        } else if (
          error.message.includes("Network") ||
          error.message.includes("timeout")
        ) {
          errorType = "network";
          errorMessage = "网络连接异常";
        } else {
          errorMessage = error.message;
        }
      }

      console.log(` [歌曲资源] 降级到播放列表基础资源 - ${errorType}`, {
        hasExistingLyrics: !!lyricsText,
        lyricsSource: lyricsText ? "自定义JSON" : "无"
      });

      return {
        audioUrl: "",
        lyricsText,
        errorType: lyricsText ? undefined : errorType,
        errorMessage: lyricsText ? undefined : errorMessage
      };
    }
  };

  // 调试方法：检查当前播放列表状态
  const debugCurrentPlaylistState = (): any => {
    const cached = getPlaylistCache();
    const customUrl = getCustomPlaylistUrl();
    const playlistId = getCurrentPlaylistId();

    const debugInfo = {
      config: {
        customUrl,
        playlistId,
        useCustomUrl: !!customUrl
      },
      cache: cached
        ? {
            songsCount: cached.data?.length || 0,
            customPlaylistUrl: cached.customPlaylistUrl,
            timestamp: new Date(cached.timestamp).toLocaleString(),
            cacheAge: Date.now() - cached.timestamp,
            isExpired: Date.now() - cached.timestamp > CACHE_DURATION
          }
        : null,
      songs: cached?.data
        ? {
            total: cached.data.length,
            withLyrics: cached.data.filter(
              song => song.lrc && song.lrc.trim() !== ""
            ).length,
            withoutLyrics: cached.data.filter(
              song => !song.lrc || song.lrc.trim() === ""
            ).length,
            samples: cached.data.slice(0, 3).map(song => ({
              name: song.name,
              hasLyrics: !!(song.lrc && song.lrc.trim()),
              lyricsLength: song.lrc?.length || 0,
              lyricsType: song.lrc
                ? song.lrc.startsWith("http")
                  ? "URL (未处理)"
                  : "LRC内容"
                : "无",
              lyricsPreview: song.lrc
                ? song.lrc.substring(0, 30) + "..."
                : "无歌词"
            }))
          }
        : null
    };

    console.log(`[MUSIC_API] 🔍 当前播放列表状态调试信息:`, debugInfo);
    return debugInfo;
  };

  return {
    // 状态
    isLoading,

    // 音乐馆方法
    fetchPlaylist,
    refreshPlaylist,
    fetchSongResources,
    fetchPlaylistFromJson,

    // 音乐胶囊方法
    fetchCapsulePlaylist,
    refreshCapsulePlaylist,
    clearCapsulePlaylistCache,

    // 配置获取
    getCurrentPlaylistId,
    getCustomPlaylistUrl,
    getCapsuleCustomPlaylistUrl,

    // 缓存管理
    clearPlaylistCache,
    clearAllMusicCache,

    // 调试方法
    debugCurrentPlaylistState
  };
}
