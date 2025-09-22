/*
 * @Description: 音乐API - 调用后端音乐接口
 * @Author: 安知鱼
 * @Date: 2025-09-22 16:00:00
 */

import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";
import type { BaseResponse } from "./post/type";
import type { Song } from "../types/music";

// 播放列表响应接口
export interface PlaylistResponse {
  songs: Song[];
  total: number;
}

// 歌曲资源响应接口
export interface SongResourceResponse {
  audioUrl: string;
  lyricsText: string;
  usingHighQuality: boolean;
}

// 获取歌曲资源请求接口
export interface GetSongResourcesRequest {
  id?: string;
  neteaseId?: string;
  name: string;
  artist: string;
  url: string;
  pic?: string;
  lrc?: string;
}

// 高质量资源响应接口
export interface HighQualityResourceResponse {
  url?: string;
  lyrics?: string;
  available: boolean;
}

// 音乐配置响应接口
export interface MusicConfigResponse {
  highQualityApiEnabled: boolean;
  supportedFormats: string[];
  maxConcurrentRequests: number;
}

// 健康检查响应接口
export interface HealthCheckResponse {
  status: string;
  service: string;
  timestamp: string;
}

/**
 * 获取播放列表
 */
export const getPlaylistApi = () => {
  return http.request<BaseResponse<PlaylistResponse>>(
    "get",
    baseUrlApi("public/music/playlist")
  );
};

/**
 * 获取歌曲资源（音频和歌词）
 * @param song 歌曲信息
 */
export const getSongResourcesApi = (song: GetSongResourcesRequest) => {
  return http.request<BaseResponse<SongResourceResponse>>(
    "post",
    baseUrlApi("public/music/song-resources"),
    {
      data: song
    }
  );
};

/**
 * 获取高质量音频URL
 * @param neteaseId 网易云音乐ID
 */
export const getHighQualityMusicUrlApi = (neteaseId: string) => {
  return http.request<BaseResponse<HighQualityResourceResponse>>(
    "get",
    baseUrlApi("public/music/high-quality-url"),
    {
      params: { neteaseId }
    }
  );
};

/**
 * 获取高质量歌词
 * @param neteaseId 网易云音乐ID
 */
export const getHighQualityLyricsApi = (neteaseId: string) => {
  return http.request<BaseResponse<HighQualityResourceResponse>>(
    "get",
    baseUrlApi("public/music/high-quality-lyrics"),
    {
      params: { neteaseId }
    }
  );
};

/**
 * 获取歌词
 * @param url 歌词URL
 */
export const getLyricsApi = (url: string) => {
  return http.request<BaseResponse<HighQualityResourceResponse>>(
    "get",
    baseUrlApi("public/music/lyrics"),
    {
      params: { url }
    }
  );
};

/**
 * 获取音乐配置
 */
export const getMusicConfigApi = () => {
  return http.request<BaseResponse<MusicConfigResponse>>(
    "get",
    baseUrlApi("public/music/config")
  );
};

/**
 * 音乐服务健康检查
 */
export const musicHealthCheckApi = () => {
  return http.request<BaseResponse<HealthCheckResponse>>(
    "get",
    baseUrlApi("public/music/health")
  );
};
