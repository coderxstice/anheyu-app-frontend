/**
 * @Description: 音乐API调用逻辑 composable
 * @Author: 安知鱼
 * @Date: 2025-09-20 15:05:00
 */
import { ref, computed } from "vue";
import type {
  Song,
  MusicApiResponse,
  LyricApiResponse,
  HighQualityMusicData
} from "../types/music";
import { useSiteConfigStore } from "../store/modules/siteConfig";

export function useMusicAPI() {
  // 获取站点配置
  const siteConfigStore = useSiteConfigStore();

  // API相关常量和配置
  const HIGH_QUALITY_MUSIC_API = "https://wyapi.toubiec.cn/api/music/url";
  const HIGH_QUALITY_LYRIC_API = "https://wyapi.toubiec.cn/api/music/lyric";

  // 从后端配置获取播放列表ID，如果没有则使用默认值
  const playlistId = computed(() => {
    return (
      siteConfigStore.getSiteConfig.music?.player?.playlist_id ||
      siteConfigStore.getSiteConfig["music.player.playlist_id"] ||
      siteConfigStore.getSiteConfig["MUSIC_PLAYER_PLAYLIST_ID"] ||
      "8152976493"
    ); // 默认值作为后备
  });

  // 动态构建播放列表API URL
  const PLAYLIST_API = computed(
    () =>
      `https://meting.qjqq.cn/?server=netease&type=playlist&id=${playlistId.value}`
  );

  // 加载状态
  const isLoading = ref(false);

  // 全局状态控制
  const isHighQualityApiEnabled = ref(true); // 高质量API是否可用

  // 禁用高质量API
  const disableHighQualityApi = (_reason: string) => {
    if (isHighQualityApiEnabled.value) {
      isHighQualityApiEnabled.value = false;
    }
  };

  // 验证歌曲数据
  const isValidSong = (song: any): boolean => {
    return (
      song &&
      typeof song.name === "string" &&
      typeof song.artist === "string" &&
      typeof song.url === "string" &&
      song.url.trim().length > 0
    );
  };

  // 获取歌单数据
  const fetchPlaylist = async (): Promise<Song[]> => {
    try {
      isLoading.value = true;
      const response = await fetch(`${PLAYLIST_API.value}&r=${Math.random()}`);
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        // 验证和过滤有效歌曲
        const validSongs = data.filter(isValidSong);

        if (validSongs.length === 0) {
          throw new Error("没有找到有效的歌曲数据");
        }

        const mappedPlaylist = validSongs.map((song: any, index: number) => {
          // 从URL中提取网易云音乐ID
          let neteaseId = "";
          if (song.url) {
            const urlMatch = song.url.match(/[?&]id=(\d+)/);
            if (urlMatch) {
              neteaseId = urlMatch[1];
            }
          }
          // 如果URL中没有找到，尝试从歌词链接中提取
          if (!neteaseId && song.lrc) {
            const lrcMatch = song.lrc.match(/[?&]id=(\d+)/);
            if (lrcMatch) {
              neteaseId = lrcMatch[1];
            }
          }

          const mappedSong: Song = {
            id: index.toString(),
            neteaseId: neteaseId, // 网易云音乐ID，从URL中提取
            name: song.name || "未知歌曲",
            artist: song.artist || "未知艺术家",
            url: song.url,
            pic: song.pic || "",
            lrc: song.lrc || ""
          };

          return mappedSong;
        });

        return mappedPlaylist;
      } else {
        return [];
      }
    } catch {
      return [];
    } finally {
      isLoading.value = false;
    }
  };

  // 获取歌词 - 原始API (返回纯LRC文本)
  const fetchLyrics = async (lrcUrl: string): Promise<string> => {
    try {
      const response = await fetch(lrcUrl);
      const lrcText = await response.text();

      if (!lrcText || lrcText.trim().length === 0) {
        return "";
      }

      // 验证是否为有效的LRC格式
      const lrcLinePattern = /\[\d{1,2}:\d{2}[\.:]?\d{0,3}\]/;
      if (!lrcLinePattern.test(lrcText)) {
        return "";
      }

      return lrcText;
    } catch {
      return "";
    }
  };

  // 获取高质量音频URL
  const fetchHighQualityMusicUrl = async (
    neteaseId: string
  ): Promise<string | null> => {
    // 检查API是否已被禁用
    if (!isHighQualityApiEnabled.value) {
      return null;
    }

    try {
      const response = await fetch(HIGH_QUALITY_MUSIC_API, {
        method: "POST",
        mode: "cors", // 明确指定跨域模式
        credentials: "omit", // 不发送cookies，避免跨域认证问题
        headers: {
          Accept: "*/*",
          "Accept-Language": "zh-CN,zh;q=0.9",
          "Cache-Control": "no-cache",
          "Content-Type": "application/json",
          Pragma: "no-cache"
        },
        body: JSON.stringify({
          id: neteaseId,
          level: "lossless"
        })
      });

      const data: MusicApiResponse = await response.json();

      if (data.code === 200 && data.data && data.data.length > 0) {
        const musicData = data.data[0] as HighQualityMusicData;
        if (musicData.url && musicData.url.trim().length > 0) {
          return musicData.url;
        }
      }

      return null;
    } catch {
      disableHighQualityApi("首次请求失败，禁用高质量API");
      return null;
    }
  };

  // 获取高质量歌词 - 网易云API (返回JSON格式)
  const fetchHighQualityLyrics = async (
    neteaseId: string
  ): Promise<string | null> => {
    // 检查API是否已被禁用
    if (!isHighQualityApiEnabled.value) {
      return null;
    }

    try {
      const response = await fetch(HIGH_QUALITY_LYRIC_API, {
        method: "POST",
        mode: "cors", // 明确指定跨域模式
        credentials: "omit", // 不发送cookies，避免跨域认证问题
        headers: {
          Accept: "*/*",
          "Accept-Language": "zh-CN,zh;q=0.9",
          "Cache-Control": "no-cache",
          "Content-Type": "application/json",
          // 移除Origin和Referer，让浏览器自动处理
          // Origin: "https://wyapi.toubiec.cn",
          // Referer: "https://wyapi.toubiec.cn/",
          Pragma: "no-cache"
          // 移除User-Agent，浏览器会自动添加且不允许手动修改
        },
        body: JSON.stringify({
          id: neteaseId
        })
      });

      const data: LyricApiResponse = await response.json();

      if (data.code === 200 && data.data && data.data.lrc) {
        const lrcText = data.data.lrc;
        if (lrcText && lrcText.trim().length > 0) {
          // 验证是否为有效的LRC格式
          const lrcLinePattern = /\[\d{1,2}:\d{2}[\.:]?\d{0,3}\]/;
          if (!lrcLinePattern.test(lrcText)) {
            return null;
          }

          return lrcText;
        }
      }

      return null;
    } catch {
      disableHighQualityApi("首次请求失败，禁用高质量API");
      return null;
    }
  };

  // 获取歌曲的音频和歌词资源
  const fetchSongResources = async (
    song: Song
  ): Promise<{
    audioUrl: string;
    lyricsText: string;
    usingHighQuality: boolean;
  }> => {
    let finalAudioUrl = song.url;
    let finalLyricsText = "";
    let usingHighQuality = false;
    let lyricsAlreadyFetched = false; // 添加标记避免重复请求歌词

    // 首先尝试使用高质量API获取资源
    if (song.neteaseId) {
      if (!isHighQualityApiEnabled.value) {
        // 高质量API已禁用，直接使用原始歌词
        if (song.lrc) {
          finalLyricsText = await fetchLyrics(song.lrc);
          lyricsAlreadyFetched = true;
        }
      } else {
        // 先获取高质量音频
        const highQualityUrl = await fetchHighQualityMusicUrl(song.neteaseId);

        if (highQualityUrl) {
          // 音频获取成功，使用高质量资源
          finalAudioUrl = highQualityUrl;
          usingHighQuality = true;

          // 音频成功后才获取高质量歌词
          const highQualityLyrics = await fetchHighQualityLyrics(
            song.neteaseId
          );
          if (highQualityLyrics) {
            finalLyricsText = highQualityLyrics;
            lyricsAlreadyFetched = true;
          }
          // 如果高质量歌词获取失败，稍后统一处理原始歌词
        }
        // 如果高质量音频获取失败，保持使用原始音频URL，稍后统一处理原始歌词
      }
    }

    // 统一处理原始歌词的获取（避免重复请求）
    if (!lyricsAlreadyFetched && song.lrc) {
      finalLyricsText = await fetchLyrics(song.lrc);
    }

    return {
      audioUrl: finalAudioUrl,
      lyricsText: finalLyricsText,
      usingHighQuality
    };
  };

  return {
    // 状态
    isLoading,

    // 方法
    fetchPlaylist,
    fetchLyrics,
    fetchHighQualityMusicUrl,
    fetchHighQualityLyrics,
    fetchSongResources,

    // 工具函数
    isValidSong
  };
}
