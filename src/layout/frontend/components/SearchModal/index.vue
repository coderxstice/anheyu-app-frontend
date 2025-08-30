<template>
  <div class="SearchModal">
    <div ref="dialogRef" class="search-dialog">
      <div class="search-nav">
        <div class="search-dialog-title">搜索</div>
        <button
          class="search-close-button"
          aria-label="关闭搜索框"
          @click="closeModal"
        >
          <i class="anzhiyufont anzhiyu-icon-xmark" />
        </button>
      </div>
      <div class="search-wrap">
        <div class="search-input-container">
          <input
            ref="inputRef"
            v-model="keyword"
            class="search-input"
            type="text"
            placeholder="输入关键字，按 Enter 搜索"
            @keydown.enter.prevent="handleEnter"
            @input="handleInput"
          />
        </div>
        <div v-if="tipsVisible && !keyword.trim()" class="search-tips">
          <span>按 Esc 关闭</span>
          <span>·</span>
          <span>按 Ctrl/⌘ + K 打开</span>
        </div>

        <!-- 搜索结果 -->
        <div v-if="keyword.trim() && !loading" class="search-results">
          <div v-if="searchResults.length > 0" class="results-header">
            <span class="results-count">找到 {{ total }} 条结果</span>
          </div>

          <div class="results-list">
            <div
              v-for="result in searchResults"
              :key="result.id"
              class="result-item"
              @click="handleResultClick(result)"
            >
              <div class="result-title" v-html="result.title" />
              <div class="result-snippet" v-html="result.snippet" />
              <div class="result-meta">
                <span class="result-author">{{ result.author }}</span>
                <span class="result-category">{{ result.category }}</span>
                <span class="result-date">
                  {{ formatDate(result.publish_date) }}
                </span>
                <span
                  v-if="result.tags && result.tags.length > 0"
                  class="result-tags"
                >
                  <span v-for="tag in result.tags" :key="tag" class="tag">
                    {{ tag }}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <!-- 分页 -->
          <div v-if="totalPages > 1" class="pagination">
            <button
              class="page-btn"
              :disabled="currentPage <= 1"
              @click="changePage(currentPage - 1)"
            >
              上一页
            </button>
            <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
            <button
              class="page-btn"
              :disabled="currentPage >= totalPages"
              @click="changePage(currentPage + 1)"
            >
              下一页
            </button>
          </div>
        </div>

        <!-- 无结果提示 -->
        <div
          v-if="keyword.trim() && !loading && searchResults.length === 0"
          class="no-results"
        >
          <div class="no-results-icon">🔍</div>
          <div class="no-results-text">未找到相关结果</div>
          <div class="no-results-tip">尝试使用其他关键词或检查拼写</div>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading">
          <div class="loading-spinner" />
          <div class="loading-text">搜索中...</div>
        </div>
      </div>
    </div>
    <div ref="maskRef" class="search-mask" @click="closeModal" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from "vue";
import { gsap } from "gsap";

// 搜索结果类型定义
interface SearchHit {
  id: string;
  title: string;
  snippet: string;
  author: string;
  category: string;
  tags: string[];
  publish_date: string;
  cover_url?: string;
  abbrlink?: string;
  view_count?: number;
  word_count?: number;
  reading_time?: number;
}

interface SearchResult {
  pagination: {
    total: number;
    page: number;
    size: number;
    totalPages: number;
  };
  hits: SearchHit[];
}

interface SearchResponse {
  code: number;
  message: string;
  data: SearchResult;
}

const maskRef = ref<HTMLDivElement | null>(null);
const dialogRef = ref<HTMLDivElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);

const isOpen = ref(false);
const keyword = ref("");
const loading = ref(false);
const searchResults = ref<SearchHit[]>([]);
const total = ref(0);
const currentPage = ref(1);
const totalPages = ref(0);
const pageSize = 10;

// 是否展示提示与占位内容
const tipsVisible = ref(true);

// 防抖搜索
let searchTimeout: NodeJS.Timeout | null = null;

/**
 * 执行搜索
 */
async function performSearch(page: number = 1) {
  if (!keyword.value.trim()) {
    searchResults.value = [];
    total.value = 0;
    totalPages.value = 0;
    return;
  }

  loading.value = true;
  currentPage.value = page;

  try {
    const response = await fetch(
      `/api/search?q=${encodeURIComponent(keyword.value.trim())}&page=${page}&size=${pageSize}`
    );

    if (!response.ok) {
      throw new Error(`搜索请求失败: ${response.status}`);
    }

    const data: SearchResponse = await response.json();

    if (data.code === 0) {
      searchResults.value = data.data.hits;
      total.value = data.data.pagination.total;
      totalPages.value = data.data.pagination.totalPages;
    } else {
      throw new Error(data.message || "搜索失败");
    }
  } catch (error) {
    console.error("搜索错误:", error);
    searchResults.value = [];
    total.value = 0;
    totalPages.value = 0;
    // 这里可以添加错误提示UI
  } finally {
    loading.value = false;
  }
}

/**
 * 处理输入变化，防抖搜索
 */
function handleInput() {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  searchTimeout = setTimeout(() => {
    if (keyword.value.trim()) {
      performSearch(1);
    } else {
      searchResults.value = [];
      total.value = 0;
      totalPages.value = 0;
    }
  }, 300);
}

/**
 * 回车搜索
 */
function handleEnter() {
  if (keyword.value.trim()) {
    performSearch(1);
  }
}

/**
 * 切换页面
 */
function changePage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    performSearch(page);
  }
}

/**
 * 点击搜索结果
 */
function handleResultClick(result: SearchHit) {
  // 跳转到文章页面
  if (result.abbrlink) {
    window.location.href = `/${result.abbrlink}`;
  } else {
    window.location.href = `/article/${result.id}`;
  }
  closeModal();
}

/**
 * 格式化日期
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  } catch {
    return dateString;
  }
}

/**
 * 打开弹窗：执行遮罩与对话框入场动画，并锁定页面滚动
 */
function openModal() {
  if (isOpen.value) return;
  isOpen.value = true;

  const mask = maskRef.value;
  const dialog = dialogRef.value;
  if (!mask || !dialog) return;

  // 锁定滚动，防止背景滚动
  document.documentElement.style.overflow = "hidden";

  // 先显示元素，再做入场动画
  gsap.set(mask, { display: "block", opacity: 0, pointerEvents: "auto" });
  gsap.set(dialog, { display: "flex", opacity: 0, y: 24, scale: 0.98 });

  const tl = gsap.timeline();
  tl.to(mask, {
    duration: 0.3,
    opacity: 1,
    ease: "power2.out",
    force3D: true
  })
    .fromTo(
      dialog,
      { opacity: 0, y: 24, scale: 0.98 },
      {
        duration: 0.35,
        opacity: 1,
        y: 0,
        scale: 1,
        ease: "power3.out",
        force3D: true
      },
      "<"
    )
    .add(() => {
      nextTick(() => inputRef.value?.focus());
    });
}

/**
 * 关闭弹窗：执行遮罩与对话框退场动画，动画结束后隐藏并解锁滚动
 */
function closeModal() {
  if (!isOpen.value) return;
  const mask = maskRef.value;
  const dialog = dialogRef.value;
  if (!mask || !dialog) return;

  const tl = gsap.timeline({ onComplete: onClosed });
  tl.to(dialog, {
    duration: 0.25,
    opacity: 0,
    y: 16,
    scale: 0.98,
    ease: "power2.inOut",
    force3D: true
  }).to(
    mask,
    { duration: 0.3, opacity: 0, ease: "power2.inOut", force3D: true },
    "<"
  );

  function onClosed() {
    gsap.set(dialog, { display: "none" });
    gsap.set(mask, { display: "none" });
    document.documentElement.style.overflow = "";
    isOpen.value = false;
    keyword.value = "";
    searchResults.value = [];
    total.value = 0;
    totalPages.value = 0;
  }
}

/**
 * 键盘事件：
 * - Esc 关闭
 * - Ctrl/⌘ + K 打开
 */
function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") {
    e.preventDefault();
    closeModal();
    return;
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    openModal();
  }
}

/**
 * 文档点击事件委托：
 * - 监听带有放大镜图标 `.anzhiyu-icon-magnifying-glass` 的点击来打开弹窗
 */
function onDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement | null;
  if (!target) return;

  const isSearchIcon = !!(
    target.closest(".anzhiyufont.anzhiyu-icon-magnifying-glass") ||
    target
      .closest("a")
      ?.querySelector(".anzhiyufont.anzhiyu-icon-magnifying-glass")
  );
  if (isSearchIcon) {
    e.preventDefault();
    openModal();
  }
}

onMounted(() => {
  // 初始化为隐藏状态
  if (maskRef.value) {
    gsap.set(maskRef.value, { display: "none", opacity: 0 });
  }
  if (dialogRef.value) {
    gsap.set(dialogRef.value, { display: "none", opacity: 0 });
  }

  // 绑定事件
  window.addEventListener("keydown", onKeydown);
  document.addEventListener("click", onDocumentClick, {
    capture: true
  });

  window.addEventListener("frontend-open-search", openModal as EventListener);
});

onBeforeUnmount(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  window.removeEventListener("keydown", onKeydown);
  document.removeEventListener("click", onDocumentClick, {
    capture: true
  } as any);
  window.removeEventListener(
    "frontend-open-search",
    openModal as EventListener
  );
});
</script>

<style scoped lang="scss">
.search-mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1000;
  pointer-events: auto;
  transform: translateZ(0);
  background: var(--anzhiyu-maskbgdeep);
  backdrop-filter: blur(12px);
}

.search-dialog {
  position: fixed;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  padding: 0;
  width: 36rem;
  max-width: 90vw;
  background: var(--anzhiyu-card-bg);
  border-radius: 16px;
  box-shadow: var(--anzhiyu-shadow-lightblack);
  border: var(--style-border);
  transition:
    background-color 0.3s,
    box-shadow 0.3s,
    border-color 0.3s;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  margin: 5rem auto;
  height: fit-content;
  max-height: 80dvh;
  will-change: transform, opacity;
}

.search-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  flex-shrink: 0;
}

.search-dialog-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--anzhiyu-fontcolor);
}

.search-close-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: transparent;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  color: var(--anzhiyu-secondtext);
  transition: background-color 0.2s;
}

.search-close-button:hover {
  color: var(--anzhiyu-white);
  background: var(--anzhiyu-lighttext);
}

.search-close-button .anzhiyufont {
  font-size: 1.1rem;
}

.search-wrap {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 0 1.5rem 1.5rem;
}

.search-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  font-size: 1rem;
  outline: none;
  transition:
    border-color 0.2s,
    background-color 0.2s,
    box-shadow 0.2s;
  color: var(--anzhiyu-fontcolor);
  padding: 0.75rem 1rem;
  outline: 0px;
  background: var(--anzhiyu-secondbg);
  border: var(--style-border);
  border-radius: 8px;
}

.search-input:focus {
  border-color: var(--anzhiyu-theme);
  background-color: var(--anzhiyu-card-bg);
  box-shadow: 0 0 0 3px var(--anzhiyu-theme-op);
}

.search-input::placeholder {
  color: var(--anzhiyu-secondtext);
}

.search-tips {
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: var(--anzhiyu-secondtext);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
}

// 搜索结果样式
.search-results {
  margin-top: 1rem;
}

.results-header {
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--anzhiyu-gray-2);
}

.results-count {
  font-size: 0.9rem;
  color: var(--anzhiyu-secondtext);
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.result-item {
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--anzhiyu-gray-2);
  background: var(--anzhiyu-card-bg);
  cursor: pointer;
  transition: all 0.2s ease;
}

.result-item:hover {
  border-color: var(--anzhiyu-theme);
  box-shadow: 0 2px 8px var(--anzhiyu-theme-op);
  transform: translateY(-1px);
}

.result-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--anzhiyu-fontcolor);
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.result-snippet {
  font-size: 0.9rem;
  color: var(--anzhiyu-secondtext);
  margin-bottom: 0.75rem;
  line-height: 1.5;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.result-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  font-size: 0.8rem;
  color: var(--anzhiyu-secondtext);
}

.result-author,
.result-category,
.result-date {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.result-tags {
  display: flex;
  gap: 0.25rem;
}

.tag {
  padding: 0.2rem 0.5rem;
  background: var(--anzhiyu-theme-op);
  color: var(--anzhiyu-theme);
  border-radius: 4px;
  font-size: 0.75rem;
}

// 分页样式
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--anzhiyu-gray-2);
}

.page-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--anzhiyu-gray-2);
  background: var(--anzhiyu-card-bg);
  color: var(--anzhiyu-fontcolor);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--anzhiyu-theme);
  background: var(--anzhiyu-theme-op);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.9rem;
  color: var(--anzhiyu-secondtext);
}

// 无结果样式
.no-results {
  margin-top: 2rem;
  text-align: center;
  padding: 2rem;
}

.no-results-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.no-results-text {
  font-size: 1.1rem;
  color: var(--anzhiyu-fontcolor);
  margin-bottom: 0.5rem;
}

.no-results-tip {
  font-size: 0.9rem;
  color: var(--anzhiyu-secondtext);
}

// 加载样式
.loading {
  margin-top: 2rem;
  text-align: center;
  padding: 2rem;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid var(--anzhiyu-gray-2);
  border-top: 2px solid var(--anzhiyu-theme);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

.loading-text {
  font-size: 0.9rem;
  color: var(--anzhiyu-secondtext);
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
