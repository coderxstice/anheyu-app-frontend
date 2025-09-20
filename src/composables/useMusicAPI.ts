/**
 * @Description: 音乐API调用逻辑 composable
 * @Author: 安知鱼
 * @Date: 2025-09-20 15:05:00
 */
import { ref } from "vue";
import type {
  Song,
  MusicApiResponse,
  LyricApiResponse,
  HighQualityMusicData
} from "../types/music";

export function useMusicAPI() {
  // API相关常量和配置
  const PLAYLIST_API =
    "https://meting.qjqq.cn/?server=netease&type=playlist&id=8152976493";
  const HIGH_QUALITY_MUSIC_API = "https://api.toubiec.cn/wyapi/getMusicUrl.php";
  const HIGH_QUALITY_LYRIC_API = "https://api.toubiec.cn/wyapi/getLyric.php";
  const MAX_RETRY_COUNT = 3;
  const RETRY_DELAY = 1000; // 1秒

  // 加载状态
  const isLoading = ref(false);

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

  // 网络请求重试函数
  const fetchWithRetry = async (
    url: string,
    retries = MAX_RETRY_COUNT
  ): Promise<Response> => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response;
    } catch (error) {
      if (retries > 0) {
        console.warn(
          `请求失败，${RETRY_DELAY}ms后重试。剩余重试次数: ${retries}`,
          error
        );
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return fetchWithRetry(url, retries - 1);
      }
      throw error;
    }
  };

  // 获取歌单数据
  const fetchPlaylist = async (): Promise<Song[]> => {
    try {
      isLoading.value = true;
      const response = await fetchWithRetry(
        `${PLAYLIST_API}&r=${Math.random()}`
      );
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        // 调试：打印原始数据结构
        console.log("原始歌单数据示例:", data.slice(0, 2));

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

          // 调试：打印每首歌的网易云ID
          if (index < 3) {
            console.log(`歌曲 ${index + 1} - ${mappedSong.name}:`, {
              原始URL: song.url,
              提取的网易云ID: mappedSong.neteaseId,
              有网易云ID: !!mappedSong.neteaseId
            });
          }

          return mappedSong;
        });

        console.log("歌单加载成功", mappedPlaylist.length, "首歌曲");
        return mappedPlaylist;
      } else {
        console.error("歌单数据为空或格式错误");
        return [];
      }
    } catch (error) {
      console.error("获取歌单失败:", error);
      return [];
    } finally {
      isLoading.value = false;
    }
  };

  // 获取歌词
  const fetchLyrics = async (lrcUrl: string): Promise<string> => {
    try {
      const response = await fetchWithRetry(lrcUrl);
      const lrcText = await response.text();

      if (!lrcText || lrcText.trim().length === 0) {
        console.warn("歌词内容为空");
        return "";
      }

      console.log("歌词加载成功");
      return lrcText;
    } catch (error) {
      console.error("获取歌词失败:", error);
      return "";
    }
  };

  // 获取高质量音频URL
  const fetchHighQualityMusicUrl = async (
    neteaseId: string
  ): Promise<string | null> => {
    try {
      console.log("尝试获取高质量音频:", neteaseId);
      const url = `${HIGH_QUALITY_MUSIC_API}?id=${neteaseId}&level=lossless`;
      const response = await fetchWithRetry(url);
      const data: MusicApiResponse = await response.json();

      if (data.code === 200 && data.data && data.data.length > 0) {
        const musicData = data.data[0] as HighQualityMusicData;
        if (musicData.url && musicData.url.trim().length > 0) {
          console.log("高质量音频获取成功:", {
            id: musicData.id,
            level: musicData.level,
            br: musicData.br,
            size: musicData.size,
            duration: musicData.duration
          });
          return musicData.url;
        }
      }

      console.warn("高质量音频API返回无效数据:", data);
      return null;
    } catch (error) {
      console.error("获取高质量音频失败:", error);
      return null;
    }
  };

  // 获取高质量歌词
  const fetchHighQualityLyrics = async (
    neteaseId: string
  ): Promise<string | null> => {
    try {
      console.log("尝试获取高质量歌词:", neteaseId);
      const url = `${HIGH_QUALITY_LYRIC_API}?id=${neteaseId}`;
      const response = await fetchWithRetry(url);
      const data: LyricApiResponse = await response.json();

      if (data.code === 200 && data.data && data.data.lrc) {
        const lrcText = data.data.lrc;
        if (lrcText && lrcText.trim().length > 0) {
          console.log("高质量歌词获取成功");
          return lrcText;
        }
      }

      console.warn("高质量歌词API返回无效数据:", data);
      return null;
    } catch (error) {
      console.error("获取高质量歌词失败:", error);
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

    // 首先尝试使用新API获取高质量音频和歌词
    if (song.neteaseId) {
      console.log("✨ 尝试使用新API获取高质量资源");
      console.log("🎵 歌曲:", song.name, "网易云ID:", song.neteaseId);

      // 尝试获取高质量音频URL
      const highQualityUrl = await fetchHighQualityMusicUrl(song.neteaseId);
      if (highQualityUrl) {
        finalAudioUrl = highQualityUrl;
        usingHighQuality = true;
        console.log("使用高质量音频URL");
      } else {
        console.log("高质量音频获取失败，使用原始URL");
      }

      // 尝试获取高质量歌词
      const highQualityLyrics = await fetchHighQualityLyrics(song.neteaseId);
      if (highQualityLyrics) {
        finalLyricsText = highQualityLyrics;
      } else if (song.lrc) {
        console.log("高质量歌词获取失败，使用原始歌词URL");
        finalLyricsText = await fetchLyrics(song.lrc);
      }
    } else {
      console.log("没有网易云ID，直接使用原始资源");
      if (song.lrc) {
        finalLyricsText = await fetchLyrics(song.lrc);
      }
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
    isValidSong,
    fetchWithRetry
  };
}
