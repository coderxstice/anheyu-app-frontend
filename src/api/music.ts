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
