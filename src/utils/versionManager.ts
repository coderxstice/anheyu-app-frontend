/*
 * @Description: 版本管理工具 - 从 API 获取真实部署版本信息
 * @Author: 安知鱼
 * @Date: 2025-09-30
 * @LastEditTime: 2026-01-17 17:00:00
 * @LastEditors: 安知鱼
 */

export interface VersionInfo {
  name?: string;
  version?: string;
  timestamp?: number; // 缓存时间戳
  buildTime?: number; // 构建时间戳，用于检测版本更新
}

const VERSION_CACHE_KEY = "anheyu_app_version";
const BUILD_TIME_KEY = "anheyu_app_build_time";
const CACHE_DURATION = 1 * 60 * 60 * 1000; // 1小时缓存（确保版本更新及时）

// 模块级变量：标记当前会话是否已经检查过构建版本
let hasCheckedBuildInSession = false;

/**
 * 从静态的 /version.json 获取构建时间戳
 * 用于检测是否有新版本部署
 */
const fetchBuildTime = async (): Promise<number | null> => {
  try {
    const response = await fetch("/version.json", {
      method: "GET",
      cache: "no-cache" // 禁用缓存，确保获取最新文件
    });
    if (response.ok) {
      const data = await response.json();
      return data.buildTime || null;
    }
  } catch (error) {
    console.debug("无法获取 version.json:", error);
  }
  return null;
};

/**
 * 检查是否有新版本部署（通过比较构建时间戳）
 * 如果有新版本，自动清除缓存并强制刷新页面
 * 注意：每个页面会话只检查一次，避免重复请求
 */
const checkAndClearCacheIfNewBuild = async (): Promise<boolean> => {
  // 如果当前会话已经检查过，直接返回
  if (hasCheckedBuildInSession) {
    return false;
  }

  try {
    hasCheckedBuildInSession = true; // 标记已检查

    const newBuildTime = await fetchBuildTime();
    if (!newBuildTime) return false;

    const cachedBuildTime = localStorage.getItem(BUILD_TIME_KEY);
    const oldBuildTime = cachedBuildTime ? Number(cachedBuildTime) : null;

    // 如果构建时间戳变化了，说明有新版本部署
    if (oldBuildTime && newBuildTime !== oldBuildTime) {
      console.log("🔄 检测到新版本部署，正在清除缓存并刷新页面...");
      localStorage.removeItem(VERSION_CACHE_KEY);
      localStorage.setItem(BUILD_TIME_KEY, String(newBuildTime));

      // 强制硬刷新页面，确保浏览器重新加载所有静态资源
      // 避免旧 JS 文件引用已删除的 chunk 导致 404
      window.location.reload();
      return true;
    }

    // 首次访问或构建时间戳未变化，更新存储的构建时间戳
    if (!oldBuildTime) {
      localStorage.setItem(BUILD_TIME_KEY, String(newBuildTime));
    }

    return false;
  } catch (error) {
    console.debug("检查构建版本失败:", error);
    return false;
  }
};

/**
 * 从 /api/version 接口获取当前部署的应用版本信息
 */
const fetchVersionFromAPI = async (): Promise<VersionInfo> => {
  try {
    const response = await fetch("/api/version", {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    });

    if (response.ok) {
      const result = await response.json();
      if (result.code === 200 && result.data?.version) {
        // 去掉 v 前缀，但保留 commit 和 dirty 等后缀
        const version = result.data.version.replace(/^v/, "");

        return {
          name: "anheyu-app",
          version: version,
          timestamp: Date.now()
        };
      }
    }
  } catch (error) {
    console.debug("无法从 API 获取版本信息:", error);
  }

  // fallback：返回未知版本
  return {
    name: "anheyu-app",
    version: "未知版本",
    timestamp: Date.now()
  };
};

/**
 * 从 localStorage 获取缓存的版本信息
 */
const getCachedVersion = (): VersionInfo | null => {
  try {
    const cached = localStorage.getItem(VERSION_CACHE_KEY);
    if (!cached) return null;

    const versionInfo: VersionInfo = JSON.parse(cached);

    // 检查缓存是否过期
    if (
      versionInfo.timestamp &&
      Date.now() - versionInfo.timestamp < CACHE_DURATION
    ) {
      return versionInfo;
    }

    return null;
  } catch (error) {
    console.error("读取版本缓存失败:", error);
    return null;
  }
};

/**
 * 保存版本信息到 localStorage
 */
const setCachedVersion = (versionInfo: VersionInfo): void => {
  try {
    localStorage.setItem(VERSION_CACHE_KEY, JSON.stringify(versionInfo));
  } catch (error) {
    console.error("保存版本缓存失败:", error);
  }
};

/**
 * 清除版本缓存
 */
export const clearVersionCache = (): void => {
  try {
    localStorage.removeItem(VERSION_CACHE_KEY);
    localStorage.removeItem(BUILD_TIME_KEY);
    console.log("✅ 版本缓存已清除");
  } catch (error) {
    console.error("清除版本缓存失败:", error);
  }
};

/**
 * 获取当前应用版本信息（优先使用缓存）
 * @param forceRefresh 是否强制刷新，忽略缓存
 */
export const getVersionInfo = async (
  forceRefresh = false
): Promise<VersionInfo> => {
  // 检查是否有新版本部署，如果有则自动清除缓存
  const hasNewBuild = await checkAndClearCacheIfNewBuild();

  // 如果检测到新构建或强制刷新，则跳过缓存
  if (!forceRefresh && !hasNewBuild) {
    const cached = getCachedVersion();
    if (cached) {
      console.debug("📦 使用缓存的版本信息:", cached.version);
      return cached;
    }
  }

  // 从 API 获取最新版本信息
  console.debug("🔄 正在从 API 获取最新版本信息...");
  const versionInfo = await fetchVersionFromAPI();

  // 保存到缓存
  setCachedVersion(versionInfo);
  console.debug("✅ 版本信息已更新:", versionInfo.version);

  return versionInfo;
};

/**
 * 获取版本号（快速同步方法）
 * 如果缓存存在则立即返回，否则返回未知版本
 * 注意：首次调用时建议使用异步的 getVersionInfo()
 */
export const getVersionSync = (): string => {
  const cached = getCachedVersion();
  if (cached?.version) {
    return cached.version;
  }
  return "未知版本";
};

/**
 * 比较两个版本号
 * @returns 1: v1 > v2, 0: v1 === v2, -1: v1 < v2
 */
export const compareVersions = (v1: string, v2: string): number => {
  // 去掉 v 前缀，但保留 commit 和 dirty 等后缀
  const cleanV1 = v1.replace(/^v/, "");
  const cleanV2 = v2.replace(/^v/, "");

  // 提取主版本号进行比较（x.y.z 部分）
  const extractMainVersion = (version: string): string => {
    const match = version.match(/^(\d+\.\d+\.\d+)/);
    return match ? match[1] : version;
  };

  const mainV1 = extractMainVersion(cleanV1);
  const mainV2 = extractMainVersion(cleanV2);

  const parts1 = mainV1.split(".").map(Number);
  const parts2 = mainV2.split(".").map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;

    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }

  return 0;
};

/**
 * 检查是否有新版本
 */
export const hasNewVersion = async (
  latestVersion: string
): Promise<boolean> => {
  const currentVersion = await getVersionInfo();
  if (!currentVersion.version) return false;

  return compareVersions(latestVersion, currentVersion.version) > 0;
};

/**
 * 在 PWA 更新时刷新版本信息
 */
export const onPWAUpdated = async (): Promise<void> => {
  console.log("🔄 PWA 已更新，正在刷新版本信息...");
  await getVersionInfo(true); // 强制刷新版本信息
};

export default {
  getVersionInfo,
  getVersionSync,
  clearVersionCache,
  compareVersions,
  hasNewVersion,
  onPWAUpdated
};
