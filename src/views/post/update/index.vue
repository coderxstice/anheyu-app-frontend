<!--
 * @Description: 更新日志页面
 * @Author: 安知鱼
 * @Date: 2025-09-26
 * @LastEditTime: 2026-01-04 14:08:28
 * @LastEditors: 安知鱼
-->
<template>
  <div class="update-page">
    <AnBannerCard
      tips="更新日志"
      title="更新日志"
      description="每一次更新，都是一次成长"
      background-image="https://upload-bbs.miyoushe.com/upload/2025/09/26/125766904/00961b9c22d3e633de8294555f3a3375_2015751252958610528.png?x-oss-process=image/format,avif"
      :height="300"
    />
    <!-- 更新内容 -->
    <div class="update-content">
      <div class="container">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner">
            <div class="spinner" />
          </div>
          <p>正在获取更新日志...</p>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="error" class="error-state">
          <FontIcon icon="ri:error-warning-line" class="error-icon" />
          <h3>获取更新日志失败</h3>
          <p>{{ error }}</p>
          <el-button type="primary" @click="fetchUpdateLog">重试</el-button>
        </div>

        <!-- 更新日志列表 -->
        <div v-else class="update-list-wrapper">
          <!-- 全局版本检查区域 -->
          <div v-if="currentVersion" class="global-version-check">
            <div class="version-info">
              <div class="version-current">
                <span class="version-label">当前版本</span>
                <span class="version-tag">{{ currentVersion }}</span>
              </div>
              <div class="version-status">
                <span
                  :class="[
                    'status-badge',
                    getVersionStatus(currentVersion, changelogs[0])
                  ]"
                >
                  <i class="status-icon">{{
                    getVersionStatusIcon(currentVersion, changelogs[0])
                  }}</i>
                  <span>{{
                    getVersionStatusText(currentVersion, changelogs[0])
                  }}</span>
                </span>
              </div>
            </div>
          </div>

          <div class="timeline-container">
            <div
              v-for="(changelog, index) in changelogs"
              :key="changelog.id"
              class="changelog-item"
              :class="{ latest: changelog.isLatest }"
              :style="{ animationDelay: `${index * 0.1}s` }"
            >
              <!-- 时间轴节点 -->
              <div class="timeline-node">
                <div class="node-dot" :class="{ latest: changelog.isLatest }" />
                <div class="node-line" />
              </div>

              <div class="changelog-card">
                <div class="changelog-header">
                  <div class="changelog-info">
                    <div class="changelog-title-wrapper">
                      <h2 class="changelog-title">
                        {{ changelog.tagName }}
                      </h2>
                      <div class="changelog-badges">
                        <span v-if="changelog.isLatest" class="latest-badge">
                          <FontIcon icon="ri:rocket-line" />
                          最新
                        </span>
                        <span
                          v-if="changelog.prerelease"
                          class="prerelease-badge"
                        >
                          <FontIcon icon="ri:test-tube-line" />
                          预览版
                        </span>
                      </div>
                    </div>
                    <div class="changelog-meta">
                      <span class="changelog-date">
                        <FontIcon icon="ri:calendar-line" />
                        {{ formatDate(changelog.publishedAt) }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="changelog-body">
                  <div
                    v-if="changelog.body"
                    class="changelog-content"
                    v-html="renderParsedContent(changelog)"
                  />
                  <div v-else class="no-content">暂无详细说明</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 加载更多指示器 -->
          <div v-if="loadingMore" class="loading-more">
            <div class="loading-spinner">
              <div class="spinner" />
            </div>
            <p>正在加载更多...</p>
          </div>

          <!-- 没有更多数据提示 -->
          <div v-else-if="!hasMore && changelogs.length > 0" class="no-more">
            <FontIcon icon="ri:check-line" />
            <span>已加载全部 {{ total }} 个版本</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import { ElButton, ElMessage } from "element-plus";
import {
  getChangelogList,
  type Changelog,
  type ChangelogListResponse,
  type ApiResponse
} from "@/api/update";
import { getVersionInfo } from "@/utils/versionManager";
import AnBannerCard from "@/components/AnBannerCard";

const loading = ref(true);
const loadingMore = ref(false);
const error = ref<string>("");
const changelogs = ref<Changelog[]>([]);
const currentPage = ref(1);
const hasMore = ref(true);
const total = ref(0);
const currentVersion = ref<string>(""); // 当前应用版本

// 滚动分页相关
const isNearBottom = ref(false);

const fetchUpdateLog = async () => {
  try {
    loading.value = true;
    error.value = "";

    const response: ApiResponse<ChangelogListResponse> = await getChangelogList(
      {
        page: 1,
        limit: 10,
        detail: true,
        prerelease: false, // 过滤掉预发布版本
        draft: false // 过滤掉草稿版本
      }
    );

    if (response.code === 200) {
      changelogs.value = response.data.list || [];
      total.value = response.data.total || 0;
      currentPage.value = 1;
      hasMore.value =
        response.data.list.length === 10 &&
        response.data.list.length < total.value;
    } else {
      throw new Error(response.message || "获取更新日志失败");
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : "获取更新日志失败";
    console.error("Failed to fetch changelogs:", err);
  } finally {
    loading.value = false;
  }
};

const loadMoreChangelogs = async () => {
  if (!hasMore.value || loadingMore.value) return;

  try {
    loadingMore.value = true;
    const nextPage = currentPage.value + 1;

    const response: ApiResponse<ChangelogListResponse> = await getChangelogList(
      {
        page: nextPage,
        limit: 10,
        detail: true
      }
    );

    if (response.code === 200 && response.data.list.length > 0) {
      changelogs.value.push(...response.data.list);
      currentPage.value = nextPage;
      hasMore.value = changelogs.value.length < total.value;
    } else {
      hasMore.value = false;
    }
  } catch (err) {
    ElMessage.error("加载更多失败");
    console.error("Failed to load more changelogs:", err);
  } finally {
    loadingMore.value = false;
  }
};

// 滚动监听函数
const handleScroll = () => {
  if (loadingMore.value || !hasMore.value) return;

  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;

  const scrollRatio = (scrollTop + windowHeight) / documentHeight;

  // 当滚动到底部 85% 时触发加载更多
  if (scrollRatio >= 0.85 && !isNearBottom.value) {
    isNearBottom.value = true;
    loadMoreChangelogs();
  } else if (scrollRatio < 0.85) {
    isNearBottom.value = false;
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}年${month}月${day}日 ${hours}:${minutes}`;
};

const formatReleaseNotes = (body: string) => {
  if (!body) return "";

  // 简单的 Markdown 转 HTML
  return body
    .replace(/### (.*$)/gim, "<h3>$1</h3>")
    .replace(/## (.*$)/gim, "<h2>$1</h2>")
    .replace(/# (.*$)/gim, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/gim, "<em>$1</em>")
    .replace(/\n/gim, "<br>");
};

// 渲染解析后的结构化内容
const renderParsedContent = (changelog: Changelog) => {
  const { parsedContent } = changelog;
  if (!parsedContent?.sections?.length) {
    return formatReleaseNotes(changelog.body);
  }

  // 从 htmlUrl 中提取仓库信息
  const repoMatch = changelog.htmlUrl?.match(/github\.com\/([^/]+\/[^/]+)/);
  const repoPath = repoMatch ? repoMatch[1] : "";

  let html = "";

  // 按分类展示更新
  parsedContent.sections
    .filter(section => {
      const title = section.title.toLowerCase();
      return (
        !title.includes("相关链接") &&
        !title.includes("links") &&
        section.count > 0
      );
    })
    .sort((a, b) => a.order - b.order)
    .forEach(section => {
      html += `<div class="changelog-section">
        <div class="section-header">
          <div class="section-title">
            <span class="section-icon">${section.icon}</span>
            <span class="section-name">${section.title.replace(section.icon, "").trim()}</span>
          </div>
        </div>
        <div class="section-content">`;

      section.items.forEach((item, index) => {
        const shortHash = item.commitHash
          ? item.commitHash.substring(0, 7)
          : "";
        const authorMatch = item.description?.match(/\(@([^)]+)\)/);
        const author = authorMatch ? authorMatch[1] : "";

        const commitUrl =
          repoPath && item.commitHash
            ? `https://github.com/${repoPath}/commit/${item.commitHash}`
            : "";
        const authorUrl = author ? `https://github.com/${author}` : "";

        html += `<div class="change-item ${item.breaking ? "breaking" : ""}">
          <div class="change-dot"></div>
          <div class="change-content">
            <div class="change-main">
              ${shortHash ? `<a href="${commitUrl}" target="_blank" rel="noopener noreferrer" class="change-hash"><i class="ri-git-commit-line"></i>${shortHash}</a>` : ""}
              <span class="change-message">${item.scope ? `<span class="change-scope">${item.scope}</span>` : ""}${item.message}</span>
              ${item.breaking ? '<span class="breaking-badge">BREAKING</span>' : ""}
            </div>
            <div class="change-meta">
              ${author ? `<a href="${authorUrl}" target="_blank" rel="noopener noreferrer" class="change-author">@${author}</a>` : ""}
            </div>
          </div>
        </div>`;
      });

      html += `</div></div>`;
    });

  return html;
};

// 比较版本号
const compareVersions = (v1: string, v2: string): number => {
  // 去掉 v 前缀，但保留 commit 和 dirty 等后缀
  // v1.2.3-1-g817a841-dirty -> 1.2.3-1-g817a841-dirty
  // v1.2.3 -> 1.2.3
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

// 获取类型图标
const getTypeIcon = (type: string) => {
  const icons = {
    feat: "🚀",
    fix: "🐛",
    docs: "📚",
    perf: "⚡",
    chore: "🔧",
    refactor: "🔧",
    style: "🔧",
    other: "📝"
  };
  return icons[type] || "📝";
};

// 获取版本状态类名
const getVersionStatus = (current: string, latest?: Changelog): string => {
  if (!latest) return "unknown";

  if (current === latest.tagName) {
    return "current";
  }

  const comparison = compareVersions(current, latest.tagName);
  if (comparison < 0) {
    return "outdated"; // 当前版本低于最新版本
  } else if (comparison > 0) {
    return "newer"; // 当前版本高于最新版本（可能是开发版本）
  }

  return "current";
};

// 获取版本状态图标
const getVersionStatusIcon = (current: string, latest?: Changelog): string => {
  const status = getVersionStatus(current, latest);
  const icons = {
    current: "✅",
    outdated: "⚠️",
    newer: "🚀",
    unknown: "❓"
  };
  return icons[status] || "📱";
};

// 获取版本状态文本
const getVersionStatusText = (current: string, latest?: Changelog): string => {
  const status = getVersionStatus(current, latest);
  const texts = {
    current: "已是最新版本",
    outdated: "有新版本可用",
    newer: "使用开发版本",
    unknown: "版本状态未知"
  };
  return texts[status] || "当前版本";
};

onMounted(async () => {
  // 获取当前应用版本（使用缓存）
  const versionInfo = await getVersionInfo();
  currentVersion.value = versionInfo.version || "";
  console.log("📦 当前应用版本:", currentVersion.value);

  // 获取更新日志列表
  await fetchUpdateLog();

  // 添加滚动监听
  await nextTick();
  window.addEventListener("scroll", handleScroll, { passive: true });
});

// 清理滚动监听
onBeforeUnmount(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<style scoped lang="scss">
.update-page {
  max-width: 1200px;
  padding: 1.5rem;
  margin: 0 auto;

  .update-content {
    margin-top: 1rem;
    padding: 0;
    border-radius: 12px;
    width: 100%;
    animation: slide-in 0.6s 0.1s backwards;
    position: relative;

    .container {
      padding: 0;
    }
  }

  // 加载状态
  .loading-state,
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 6rem 2rem;
    text-align: center;
    background: var(--anzhiyu-card-bg);
    border: var(--style-border);
    border-radius: 16px;

    .loading-spinner,
    .error-icon {
      font-size: 3.5rem;
      margin-bottom: 1.5rem;
      color: var(--anzhiyu-main);
    }

    .spinner {
      width: 3.5rem;
      height: 3.5rem;
      border: 4px solid rgba(var(--anzhiyu-main-rgb), 0.1);
      border-top: 4px solid var(--anzhiyu-main);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    h3 {
      margin: 0 0 0.5rem;
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--anzhiyu-fontcolor);
    }

    p {
      margin: 0 0 2rem;
      color: var(--anzhiyu-secondtext);
      font-size: 1rem;
    }
  }

  // 全局版本检查区域
  .global-version-check {
    background: var(--anzhiyu-card-bg);
    border: var(--style-border);
    border-radius: 8px;
    padding: 0.5rem 1rem;
    margin-bottom: 1.5rem;
    box-shadow: var(--anzhiyu-shadow-border);

    .version-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;

      @media (max-width: 768px) {
        flex-direction: row;
        justify-content: space-between;
        text-align: left;
      }
    }

    .version-current {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .version-label {
        font-size: 0.8125rem;
        color: var(--anzhiyu-secondtext);
        font-weight: 500;
      }

      .version-tag {
        background: var(--anzhiyu-main);
        color: white;
        padding: 0.15rem 0.5rem;
        border-radius: 4px;
        font-size: 0.8125rem;
        font-weight: 700;
        font-family: "Monaco", "Menlo", "Consolas", monospace;
      }
    }

    .version-status {
      .status-badge {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.2rem 0.6rem;
        border-radius: 6px;
        font-size: 0.8125rem;
        font-weight: 600;

        &.current {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        &.outdated {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }

        &.newer {
          background: rgba(99, 102, 241, 0.1);
          color: var(--anzhiyu-main);
        }

        .status-icon {
          font-style: normal;
          font-size: 0.875rem;
        }
      }
    }
  }

  // 时间轴容器
  .timeline-container {
    position: relative;
    padding: 1rem 0;

    &::before {
      content: "";
      position: absolute;
      left: 24px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: var(--anzhiyu-main);
      opacity: 0.15;
      border-radius: 2px;
    }
  }

  // 更新日志项目
  .changelog-item {
    position: relative;
    display: flex;
    gap: 1.5rem;
    margin-bottom: 2rem;
    animation: fade-in-up 0.6s ease-out backwards;

    &:last-child {
      margin-bottom: 0;
      .timeline-node .node-line {
        display: none;
      }
    }
  }

  // 时间轴节点
  .timeline-node {
    position: relative;
    width: 40px;
    flex-shrink: 0;
    display: flex;
    justify-content: center;

    .node-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--anzhiyu-card-bg);
      border: 2px solid var(--anzhiyu-main);
      z-index: 2;
      margin-top: 1.25rem;
      transition: all 0.3s ease;
      position: relative;

      &::after {
        content: "";
        position: absolute;
        inset: -4px;
        border-radius: 50%;
        background: var(--anzhiyu-main);
        opacity: 0;
        transition: all 0.3s ease;
      }

      &.latest {
        background: var(--anzhiyu-main);
        box-shadow: 0 0 0 3px rgba(var(--anzhiyu-main-rgb), 0.2);

        &::after {
          opacity: 0.2;
          animation: pulse 2s infinite;
        }
      }
    }
  }

  .changelog-card {
    flex: 1;
    background: var(--anzhiyu-card-bg);
    border: var(--style-border);
    border-radius: 12px;
    padding: 1.25rem 1.5rem;
    box-shadow: var(--anzhiyu-shadow-border);
    min-width: 0;
  }

  // 更新日志头部
  .changelog-header {
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--anzhiyu-border-thin);
  }

  .changelog-title-wrapper {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.25rem;
    flex-wrap: wrap;
  }

  .changelog-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--anzhiyu-fontcolor);
    line-height: 1.2;
  }

  .changelog-badges {
    display: flex;
    gap: 0.4rem;

    span {
      display: inline-flex;
      align-items: center;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;

      i {
        font-size: 0.8rem;
      }
    }

    .latest-badge {
      background: var(--anzhiyu-main);
      color: white;
    }

    .prerelease-badge {
      background: #f59e0b;
      color: white;
    }
  }

  .changelog-meta {
    display: flex;
    color: var(--anzhiyu-secondtext);
    font-size: 0.875rem;
    font-weight: 500;

    .changelog-date {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
  }

  // 更新日志内容
  .changelog-body {
    .no-content {
      padding: 2rem;
      text-align: center;
      color: var(--anzhiyu-secondtext);
      background: var(--anzhiyu-background);
      border-radius: 12px;
      font-style: italic;
    }
  }

  .changelog-content {
    :deep(.changelog-section) {
      margin-bottom: 1rem;

      &:last-child {
        margin-bottom: 0;
      }

      .section-header {
        margin-bottom: 0.5rem;
      }

      .section-title {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        font-weight: 600;
        color: var(--anzhiyu-fontcolor);
        font-size: 1rem;

        .section-icon {
          font-size: 1rem;
        }

        .section-name {
          flex: 1;
        }
      }

      .change-item {
        position: relative;
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.5rem 0;
        transition: all 0.2s ease;

        .change-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--anzhiyu-main);
          opacity: 0.3;
          flex-shrink: 0;
        }

        .change-content {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .change-main {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
          min-width: 0;
        }

        .change-hash {
          display: inline-flex;
          align-items: center;
          background: var(--anzhiyu-main);
          color: white;
          padding: 0.15rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          flex-shrink: 0;
          text-decoration: none;
          margin-right: 0.5rem;

          i {
            margin-right: 0.25rem;
          }

          &:hover {
            opacity: 0.9;
          }
        }

        .change-scope {
          display: inline-block;
          background: var(--anzhiyu-background);
          color: var(--anzhiyu-secondtext);
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          margin-right: 0.4rem;
        }

        .change-message {
          flex: 1;
          font-size: 0.9375rem;
          color: var(--anzhiyu-fontcolor);
          line-height: 1.5;
          min-width: 0;
        }

        .breaking-badge {
          background: #ef4444;
          color: white;
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .change-meta {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-shrink: 0;

          a {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            font-size: 0.75rem;
            color: var(--anzhiyu-secondtext);
            text-decoration: none;
            padding: 0.15rem 0.4rem;
            background: var(--anzhiyu-background);
            border-radius: 4px;
            border: 1px solid transparent;
            transition: all 0.2s ease;

            &:hover {
              color: var(--anzhiyu-main);
              border-color: var(--anzhiyu-main);
              background: rgba(var(--anzhiyu-main-rgb), 0.05);
            }

            i {
              font-size: 0.8rem;
            }
          }
        }
      }
    }
  }

  // 加载更多和完成状态
  .loading-more,
  .no-more {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 2rem;
    margin-top: 2rem;
    color: var(--anzhiyu-secondtext);
    font-size: 0.9375rem;
    font-weight: 500;
  }

  .no-more {
    background: rgba(16, 185, 129, 0.05);
    border: 1px dashed rgba(16, 185, 129, 0.3);
    border-radius: 12px;
    color: #10b981;
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.5);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 0.5;
  }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .update-page {
    padding: 1rem;

    .timeline-container::before {
      left: 12px;
    }

    .changelog-item {
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .timeline-node {
      width: 24px;
      .node-dot {
        margin-top: 1.25rem;
      }
    }

    .changelog-card {
      padding: 1.25rem;
      border-radius: 12px;
    }

    .changelog-title {
      font-size: 1.25rem;
    }
  }
}
</style>
