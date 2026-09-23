import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getPlaylistApi } from "@/lib/api/music";
import { useSiteConfigStore } from "@/store/site-config-store";
import type { Song } from "@/types/music";
import { useMusicAPI } from "./use-music-api";

vi.mock("@/lib/api/music", () => ({
  getPlaylistApi: vi.fn(),
}));

const cachedSong: Song = {
  id: "cached",
  name: "缓存歌曲",
  artist: "缓存歌手",
  url: "",
  pic: "",
  lrc: "",
};

const freshSong: Song = {
  id: "fresh",
  name: "新歌曲",
  artist: "新歌手",
  url: "",
  pic: "",
  lrc: "",
};

function setMusicConfig() {
  useSiteConfigStore.setState({
    siteConfig: {
      "music.api.base_url": "https://musicapi.acacia-ma.com/",
      "music.player.playlist_id": "8152976493",
    },
  });
}

function setCachedPlaylist(cacheKey: string) {
  localStorage.setItem(
    cacheKey,
    JSON.stringify({
      data: [cachedSong],
      playlistId: "8152976493",
      customPlaylistUrl: null,
      apiBaseURL: "https://metings.qjqq.cn",
      timestamp: Date.now(),
    })
  );
}

describe("useMusicAPI 播放列表缓存", () => {
  beforeEach(() => {
    localStorage.clear();
    setMusicConfig();
    vi.mocked(getPlaylistApi).mockResolvedValue({
      code: 200,
      message: "success",
      data: { songs: [freshSong], total: 1 },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
    act(() => {
      useSiteConfigStore.setState({ siteConfig: {} });
    });
  });

  it("Meting 歌曲直接使用协议音源，不请求 Song_V1", async () => {
    useSiteConfigStore.setState({ siteConfig: { "music.api.protocol": "meting" } });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() => useMusicAPI());
    const resources = await result.current.fetchSongResources({ ...freshSong, url: "https://audio.test/song.mp3", lrc: "[00:01]歌词", neteaseId: "meting-0" });
    expect(resources.audioUrl).toBe("https://audio.test/song.mp3");
    expect(resources.lyricsText).toBe("[00:01]歌词");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("Meting 缺失音源也不会回退到旧 Song_V1 协议", async () => {
    useSiteConfigStore.setState({ siteConfig: { "music.api.protocol": "meting" } });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() => useMusicAPI());
    expect(await result.current.fetchSongResources({ ...freshSong, neteaseId: "meting-0", url: "" })).toMatchObject({ audioUrl: "", errorType: "no_resources" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["anheyu-playlist-cache", "music.api.protocol", "meting"],
    ["anheyu-capsule-playlist-cache", "music.api.protocol", "meting"],
    ["anheyu-playlist-cache", "music.api.meting_server", "tencent"],
    ["anheyu-capsule-playlist-cache", "music.api.meting_server", "tencent"],
  ])("协议或平台变化刷新 %s (%s)", async (cacheKey, setting, value) => {
    localStorage.setItem(cacheKey, JSON.stringify({ data: [cachedSong], playlistId: "8152976493", customPlaylistUrl: null,
      apiBaseURL: "https://musicapi.acacia-ma.com|legacy|netease", timestamp: Date.now() }));
    useSiteConfigStore.setState({ siteConfig: { ...useSiteConfigStore.getState().siteConfig, [setting]: value } });
    const { result } = renderHook(() => useMusicAPI());
    await act(async () => { await (cacheKey.includes("capsule") ? result.current.fetchCapsulePlaylist() : result.current.fetchPlaylist()); });
    expect(getPlaylistApi).toHaveBeenCalledOnce();
    expect(JSON.parse(localStorage.getItem(cacheKey)!).apiBaseURL).toContain(value);
  });

  it("音乐 API 地址变化后刷新音乐馆缓存", async () => {
    setCachedPlaylist("anheyu-playlist-cache");
    const { result } = renderHook(() => useMusicAPI());

    let songs: Song[] = [];
    await act(async () => {
      songs = await result.current.fetchPlaylist();
    });

    expect(getPlaylistApi).toHaveBeenCalledOnce();
    expect(songs[0]?.id).toBe("fresh");
  });

  it("音乐 API 地址变化后刷新胶囊缓存", async () => {
    setCachedPlaylist("anheyu-capsule-playlist-cache");
    const { result } = renderHook(() => useMusicAPI());

    let songs: Song[] = [];
    await act(async () => {
      songs = await result.current.fetchCapsulePlaylist();
    });

    expect(getPlaylistApi).toHaveBeenCalledOnce();
    expect(songs[0]?.id).toBe("fresh");
  });

  it("拼接单曲接口前移除 API 地址末尾斜杠", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 200,
        success: true,
        data: { url: "https://example.com/song.mp3", lyric: "", level: "exhigh", size: "1 MB" },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() => useMusicAPI());

    await result.current.fetchSongResources({ ...freshSong, neteaseId: "123456789" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://musicapi.acacia-ma.com/Song_V1",
      expect.objectContaining({ method: "POST" })
    );
  });
});
