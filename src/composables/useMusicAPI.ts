/**
 * @Description: 音乐API调用逻辑 composable
 * @Author: 安知鱼
 * @Date: 2025-09-22 16:00:00
 */
import { ref } from "vue";
import type { Song } from "../types/music";
import {
  getPlaylistApi,
  getSongResourcesApi,
  getHighQualityMusicUrlApi,
  getHighQualityLyricsApi,
  getLyricsApi,
  musicHealthCheckApi
} from "../api/music";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { get } from "lodash-es";

// 播放列表缓存接口
interface PlaylistCache {
  data: Song[];
  playlistId: string;
  timestamp: number;
  version: string;
}

export function useMusicAPI() {
  // 加载状态
  const isLoading = ref(false);

  // 获取站点配置 store
  const siteConfigStore = useSiteConfigStore();

  // 缓存配置
  const CACHE_KEY = "anheyu-playlist-cache";
  const CACHE_VERSION = "1.0.0";
  const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7天缓存

  // 从配置获取当前播放列表ID
  const getCurrentPlaylistId = (): string => {
    // 优先从 siteConfig 中获取设置值
    const configId = get(
      siteConfigStore.siteConfig,
      "music.player.playlist_id"
    );
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

  // 获取缓存
  const getPlaylistCache = (): PlaylistCache | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const cache: PlaylistCache = JSON.parse(cached);

      // 检查缓存版本
      if (cache.version !== CACHE_VERSION) {
        console.log("[MUSIC_CACHE] 缓存版本不匹配，清除旧缓存");
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      // 检查缓存是否过期
      const now = Date.now();
      if (now - cache.timestamp > CACHE_DURATION) {
        console.log("[MUSIC_CACHE] 缓存已过期，清除缓存");
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      // 检查播放列表ID是否改变
      const currentId = getCurrentPlaylistId();
      if (cache.playlistId !== currentId) {
        console.log(
          `[MUSIC_CACHE] 播放列表ID已改变 (${cache.playlistId} -> ${currentId})，清除缓存`
        );
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
        timestamp: Date.now(),
        version: CACHE_VERSION
      };

      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      console.log(
        `[MUSIC_CACHE] 缓存播放列表 - ID: ${cache.playlistId}, 歌曲数: ${data.length}`
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

  // 强制刷新播放列表（清除缓存后重新获取）
  const refreshPlaylist = async (): Promise<Song[]> => {
    console.log("[MUSIC_API] 强制刷新播放列表...");
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
          return cached.data;
        }
      }

      isLoading.value = true;
      console.log("[MUSIC_API] 从服务器获取播放列表...");

      const response = await getPlaylistApi();

      if (response.data && response.data.songs) {
        const songs = response.data.songs;

        // 缓存结果
        setPlaylistCache(songs);

        return songs;
      } else {
        console.warn("播放列表数据格式异常:", response);
        return [];
      }
    } catch (error) {
      console.error("获取播放列表失败:", error);
      return [];
    } finally {
      isLoading.value = false;
    }
  };

  // 获取歌词 - 通过后端API
  const fetchLyrics = async (lrcUrl: string): Promise<string> => {
    if (!lrcUrl) return "";

    try {
      const response = await getLyricsApi(lrcUrl);

      if (response.data && response.data.available && response.data.lyrics) {
        return response.data.lyrics;
      } else {
        return "";
      }
    } catch (error) {
      console.error("获取歌词失败:", error);
      return "";
    }
  };

  // 获取高质量音频URL - 通过后端API
  const fetchHighQualityMusicUrl = async (
    neteaseId: string
  ): Promise<string | null> => {
    if (!neteaseId) return null;

    try {
      const response = await getHighQualityMusicUrlApi(neteaseId);

      if (response.data && response.data.available && response.data.url) {
        return response.data.url;
      } else {
        return null;
      }
    } catch (error) {
      console.error("获取高质量音频URL失败:", error);
      return null;
    }
  };

  // 获取高质量歌词 - 通过后端API
  const fetchHighQualityLyrics = async (
    neteaseId: string
  ): Promise<string | null> => {
    if (!neteaseId) return null;

    try {
      const response = await getHighQualityLyricsApi(neteaseId);

      if (response.data && response.data.available && response.data.lyrics) {
        return response.data.lyrics;
      } else {
        return null;
      }
    } catch (error) {
      console.error("获取高质量歌词失败:", error);
      return null;
    }
  };

  // 获取歌曲的音频和歌词资源 - 通过后端API
  const fetchSongResources = async (
    song: Song
  ): Promise<{
    audioUrl: string;
    lyricsText: string;
    usingHighQuality: boolean;
  }> => {
    try {
      const response = await getSongResourcesApi({
        id: song.id,
        neteaseId: song.neteaseId,
        name: song.name,
        artist: song.artist,
        url: song.url,
        pic: song.pic,
        lrc: song.lrc
      });

      if (response.data) {
        return {
          audioUrl: response.data.audioUrl,
          lyricsText: response.data.lyricsText,
          usingHighQuality: response.data.usingHighQuality
        };
      } else {
        // 降级到原始数据
        return {
          audioUrl: song.url,
          lyricsText: "",
          usingHighQuality: false
        };
      }
    } catch (error) {
      console.error("获取歌曲资源失败:", error);
      // 降级到原始数据
      return {
        audioUrl: song.url,
        lyricsText: "",
        usingHighQuality: false
      };
    }
  };

  // 添加健康检查功能
  const checkHealth = async (): Promise<boolean> => {
    try {
      const response = await musicHealthCheckApi();
      return response.data?.status === "healthy";
    } catch (error) {
      console.error("音乐服务健康检查失败:", error);
      return false;
    }
  };

  return {
    // 状态
    isLoading,

    // 方法
    fetchPlaylist,
    refreshPlaylist,
    fetchLyrics,
    fetchHighQualityMusicUrl,
    fetchHighQualityLyrics,
    fetchSongResources,

    // 缓存管理
    clearPlaylistCache,
    getCurrentPlaylistId,

    // 工具函数
    checkHealth
  };
}
