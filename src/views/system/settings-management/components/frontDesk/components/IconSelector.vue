<template>
  <div class="icon-selector">
    <div class="icon-selector-trigger">
      <el-popover
        v-model:visible="popoverVisible"
        placement="bottom-start"
        :width="520"
        trigger="click"
        popper-class="icon-selector-popover"
      >
        <template #reference>
          <div class="icon-preview">
            <!-- 图片 URL -->
            <img
              v-if="isImageUrl(modelValue)"
              :src="modelValue"
              alt="icon"
              class="preview-image"
            />
            <!-- Iconify 图标 -->
            <IconifyIconOnline
              v-else-if="isIconifyIcon(modelValue)"
              :icon="modelValue"
              width="20"
              height="20"
            />
            <!-- anzhiyu 图标 -->
            <i
              v-else-if="isAnzhiyuIcon(modelValue)"
              class="anzhiyufont preview-icon"
              :class="modelValue"
            />
            <!-- 空状态 -->
            <span v-else class="preview-placeholder">选择图标</span>
          </div>
        </template>

        <div class="icon-selector-content">
          <div class="content-header">
            <h3 class="content-title">选择图标</h3>
          </div>
          <el-tabs v-model="activeTab" class="icon-selector-tabs">
            <!-- Remix Icon 标签页 -->
            <el-tab-pane label="Remix Icon" name="remix">
              <div class="tab-content">
                <el-input
                  v-model="remixSearchText"
                  placeholder="搜索 Remix Icon..."
                  clearable
                  class="search-input"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
                <div ref="iconGridRef" class="icon-grid">
                  <div
                    v-for="icon in filteredRemixIcons"
                    :key="icon"
                    class="icon-item"
                    :class="{ active: modelValue === icon }"
                    @click="selectIcon(icon)"
                  >
                    <div class="icon-wrapper">
                      <IconifyIconOnline :icon="icon" width="20" height="20" />
                    </div>
                    <span class="icon-name" :title="icon">{{ icon }}</span>
                  </div>
                  <!-- 滚动加载触发器 - 放在图标网格内部 -->
                  <div
                    v-if="
                      hasMoreIcons && !remixIconsLoading && !remixSearchText
                    "
                    ref="loadMoreTrigger"
                    class="load-more-trigger"
                  />
                </div>
                <el-empty
                  v-if="filteredRemixIcons.length === 0"
                  description="未找到匹配的图标"
                  :image-size="80"
                />
              </div>
            </el-tab-pane>

            <!-- anzhiyu 图标标签页 -->
            <el-tab-pane
              v-if="!excludeAnzhiyu"
              label="anzhiyu 图标"
              name="anzhiyu"
            >
              <div class="tab-content">
                <el-input
                  v-model="anzhiyuSearchText"
                  placeholder="搜索 anzhiyu 图标..."
                  clearable
                  class="search-input"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
                <div class="icon-grid">
                  <div
                    v-for="icon in filteredAnzhiyuIcons"
                    :key="icon"
                    class="icon-item"
                    :class="{ active: modelValue === icon }"
                    @click="selectIcon(icon)"
                  >
                    <div class="icon-wrapper">
                      <i class="anzhiyufont" :class="icon" />
                    </div>
                    <span class="icon-name" :title="icon">{{ icon }}</span>
                  </div>
                </div>
                <el-empty
                  v-if="filteredAnzhiyuIcons.length === 0"
                  description="未找到匹配的图标"
                  :image-size="80"
                />
              </div>
            </el-tab-pane>

            <!-- 图片 URL 标签页 -->
            <el-tab-pane label="图片 URL" name="image">
              <div class="tab-content">
                <el-input
                  v-model="imageUrl"
                  placeholder="输入图片 URL (例如: https://example.com/icon.png)"
                  clearable
                  class="url-input"
                  @blur="handleImageUrlBlur"
                >
                  <template #append>
                    <el-button @click="selectIcon(imageUrl)">确认</el-button>
                  </template>
                </el-input>
                <div
                  v-if="imageUrl && isValidImageUrl(imageUrl)"
                  class="image-preview"
                >
                  <img
                    :src="imageUrl"
                    alt="preview"
                    class="preview-image-large"
                  />
                </div>
                <div class="form-item-help">
                  支持 http:// 或 https:// 开头的图片链接
                </div>
              </div>
            </el-tab-pane>

            <!-- 自定义输入标签页 -->
            <el-tab-pane label="自定义输入" name="custom">
              <div class="tab-content">
                <el-input
                  v-model="customInput"
                  placeholder="输入图标类名、iconify图标或图片URL"
                  clearable
                  class="url-input"
                  @blur="handleCustomInputBlur"
                >
                  <template #append>
                    <el-button @click="selectIcon(customInput)">确认</el-button>
                  </template>
                </el-input>
                <div class="form-item-help">
                  可以输入：
                  <br />• Remix Icon (例如: ri:github-fill) <br />• anzhiyu
                  图标类名 (例如: anzhiyu-icon-github) <br />• 图片 URL (例如:
                  https://example.com/icon.png)
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-popover>
      <el-input
        :model-value="modelValue"
        placeholder="输入图标类名、iconify图标或图片URL"
        @update:model-value="emit('update:modelValue', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import { Search } from "@element-plus/icons-vue";
import { IconifyIconOnline } from "@/components/ReIcon";

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    excludeAnzhiyu?: boolean; // 是否排除 anzhiyu 图标
  }>(),
  {
    modelValue: "",
    excludeAnzhiyu: false
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const popoverVisible = ref(false);
const activeTab = ref("remix");
const remixSearchText = ref("");
const anzhiyuSearchText = ref("");
const imageUrl = ref("");
const customInput = ref("");
const remixIconsLoading = ref(false);

// 常用 Remix Icon 图标列表（作为后备）
const defaultRemixIcons = [
  "ri:github-fill",
  "ri:github-line",
  "ri:twitter-x-fill",
  "ri:twitter-x-line",
  "ri:wechat-fill",
  "ri:wechat-line",
  "ri:qq-fill",
  "ri:qq-line",
  "ri:weibo-fill",
  "ri:weibo-line",
  "ri:facebook-fill",
  "ri:facebook-line",
  "ri:instagram-fill",
  "ri:instagram-line",
  "ri:youtube-fill",
  "ri:youtube-line",
  "ri:bilibili-fill",
  "ri:bilibili-line",
  "ri:zhihu-fill",
  "ri:zhihu-line",
  "ri:douban-fill",
  "ri:douban-line",
  "ri:telegram-fill",
  "ri:telegram-line",
  "ri:discord-fill",
  "ri:discord-line",
  "ri:linkedin-fill",
  "ri:linkedin-line",
  "ri:mail-fill",
  "ri:mail-line",
  "ri:rss-fill",
  "ri:rss-line",
  "ri:home-fill",
  "ri:home-line",
  "ri:user-fill",
  "ri:user-line",
  "ri:heart-fill",
  "ri:heart-line",
  "ri:star-fill",
  "ri:star-line",
  "ri:bookmark-fill",
  "ri:bookmark-line",
  "ri:settings-fill",
  "ri:settings-line",
  "ri:search-fill",
  "ri:search-line",
  "ri:menu-fill",
  "ri:menu-line",
  "ri:close-fill",
  "ri:close-line",
  "ri:add-fill",
  "ri:add-line",
  "ri:delete-bin-fill",
  "ri:delete-bin-line",
  "ri:edit-fill",
  "ri:edit-line",
  "ri:share-fill",
  "ri:share-line",
  "ri:download-fill",
  "ri:download-line",
  "ri:upload-fill",
  "ri:upload-line",
  "ri:image-fill",
  "ri:image-line",
  "ri:video-fill",
  "ri:video-line",
  "ri:music-fill",
  "ri:music-line",
  "ri:file-fill",
  "ri:file-line",
  "ri:folder-fill",
  "ri:folder-line",
  "ri:links-fill",
  "ri:links-line",
  "ri:external-link-fill",
  "ri:external-link-line",
  "ri:link-m",
  "ri:global-fill",
  "ri:global-line",
  "ri:cloud-fill",
  "ri:cloud-line",
  "ri:code-fill",
  "ri:code-line",
  "ri:terminal-fill",
  "ri:terminal-line"
];

// Remix Icon 图标列表（从 Iconify API 获取）
const remixIcons = ref<string[]>(defaultRemixIcons);
const allRemixIcons = ref<string[]>([]); // 存储完整的图标列表
const displayedRemixIcons = ref<string[]>(defaultRemixIcons); // 当前显示的图标列表
const iconsPerPage = 100; // 每页显示的图标数量
const currentPage = ref(1);
const loadMoreTrigger = ref<HTMLElement | null>(null); // 滚动加载触发器
const iconGridRef = ref<HTMLElement | null>(null); // 图标网格容器引用
let intersectionObserver: IntersectionObserver | null = null;

// 缓存相关常量
const CACHE_KEY = "remix-icons-list";
const CACHE_EXPIRY_DAYS = 7; // 缓存过期时间（天）
const CACHE_EXPIRY_MS = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

// 获取缓存
const getCachedIcons = (): string[] | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { icons, timestamp } = JSON.parse(cached);
    const now = Date.now();

    // 检查缓存是否过期
    if (now - timestamp > CACHE_EXPIRY_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return icons;
  } catch (error) {
    console.warn("读取图标缓存失败:", error);
    return null;
  }
};

// 保存缓存
const setCachedIcons = (icons: string[]) => {
  try {
    const cacheData = {
      icons,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.warn("保存图标缓存失败:", error);
  }
};

// 从 Iconify API 获取 Remix Icon 图标列表
const fetchRemixIcons = async () => {
  if (remixIconsLoading.value) return;

  // 先检查缓存
  const cachedIcons = getCachedIcons();
  if (cachedIcons && cachedIcons.length > 0) {
    allRemixIcons.value = cachedIcons;
    updateDisplayedIcons(cachedIcons);
    return;
  }

  try {
    remixIconsLoading.value = true;

    // 使用 Iconify API 获取 Remix Icon 集合的所有图标
    const response = await fetch(
      "https://api.iconify.design/collection?prefix=ri"
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const allIcons: string[] = [];

    // Iconify API 返回格式可能是多种形式
    if (data.uncategorized) {
      // 格式1: uncategorized 对象，每个键对应一个分类
      Object.values(data.uncategorized).forEach((category: any) => {
        if (Array.isArray(category)) {
          category.forEach((iconName: string) => {
            allIcons.push(`ri:${iconName}`);
          });
        } else if (typeof category === "object") {
          Object.keys(category).forEach(iconName => {
            allIcons.push(`ri:${iconName}`);
          });
        }
      });
    } else if (data.icons) {
      // 格式2: icons 对象，键是图标名称
      Object.keys(data.icons).forEach(iconName => {
        allIcons.push(`ri:${iconName}`);
      });
    } else if (data.categories) {
      // 格式3: categories 对象
      Object.values(data.categories).forEach((category: any) => {
        if (Array.isArray(category)) {
          category.forEach((iconName: string) => {
            allIcons.push(`ri:${iconName}`);
          });
        }
      });
    } else if (Array.isArray(data)) {
      // 格式4: 直接是数组
      data.forEach((iconName: string) => {
        allIcons.push(`ri:${iconName}`);
      });
    }

    if (allIcons.length > 0) {
      // 排序并去重
      const sortedIcons = Array.from(new Set(allIcons)).sort();
      allRemixIcons.value = sortedIcons;
      // 保存到缓存
      setCachedIcons(sortedIcons);
      // 初始只显示第一页
      updateDisplayedIcons(sortedIcons);
    } else {
      // 如果没有获取到图标，使用默认列表
      allRemixIcons.value = defaultRemixIcons;
      displayedRemixIcons.value = defaultRemixIcons;
      remixIcons.value = defaultRemixIcons;
    }
  } catch (error) {
    console.warn("获取 Remix Icon 列表失败，使用默认图标列表:", error);
    // 使用默认图标列表作为后备
    allRemixIcons.value = defaultRemixIcons;
    displayedRemixIcons.value = defaultRemixIcons;
    remixIcons.value = defaultRemixIcons;
  } finally {
    remixIconsLoading.value = false;
  }
};

// 更新显示的图标列表（按需加载）
const updateDisplayedIcons = (icons: string[]) => {
  currentPage.value = 1;
  const endIndex = currentPage.value * iconsPerPage;
  displayedRemixIcons.value = icons.slice(0, endIndex);
  remixIcons.value = displayedRemixIcons.value;
};

// 加载更多图标
const loadMoreIcons = () => {
  if (allRemixIcons.value.length > displayedRemixIcons.value.length) {
    currentPage.value++;
    const endIndex = currentPage.value * iconsPerPage;
    displayedRemixIcons.value = allRemixIcons.value.slice(0, endIndex);
    remixIcons.value = displayedRemixIcons.value;
  }
};

// 检查是否需要加载更多
const hasMoreIcons = computed(() => {
  return (
    !remixSearchText.value &&
    allRemixIcons.value.length > displayedRemixIcons.value.length
  );
});

// 监听弹窗打开，按需加载图标
watch(
  () => popoverVisible.value,
  isVisible => {
    if (isVisible && allRemixIcons.value.length === 0) {
      // 只有在弹窗打开且还没有加载完整图标列表时才加载
      fetchRemixIcons();
    } else if (isVisible) {
      // 如果已经加载过，重置为第一页
      currentPage.value = 1;
      if (allRemixIcons.value.length > 0) {
        updateDisplayedIcons(allRemixIcons.value);
      }
    }
  }
);

// anzhiyu 图标列表（根据实际 iconfont 类名）
const anzhiyuIcons = [
  "anzhiyu-icon-anzhiyu",
  "anzhiyu-icon-arrow-right",
  "anzhiyu-icon-arrow-left",
  "anzhiyu-icon-dice",
  "anzhiyu-icon-copy",
  "anzhiyu-icon-cube",
  "anzhiyu-icon-circle-arrow-right",
  "anzhiyu-icon-clock",
  "anzhiyu-icon-book",
  "anzhiyu-icon-calendar-alt",
  "anzhiyu-icon-eye-outline",
  "anzhiyu-icon-circle-half-stroke",
  "anzhiyu-icon-arrow-up",
  "anzhiyu-icon-file-word",
  "anzhiyu-icon-fire",
  "anzhiyu-icon-dove",
  "anzhiyu-icon-gear",
  "anzhiyu-icon-inbox",
  "anzhiyu-icon-history",
  "anzhiyu-icon-magnifying-glass",
  "anzhiyu-icon-message",
  "anzhiyu-icon-moon",
  "anzhiyu-icon-shapes",
  "anzhiyu-icon-shuffle",
  "anzhiyu-icon-language",
  "anzhiyu-icon-tags",
  "anzhiyu-icon-train",
  "anzhiyu-icon-warning",
  "anzhiyu-icon-circle-arrow-up-right",
  "anzhiyu-icon-fish",
  "anzhiyu-icon-envelope",
  "anzhiyu-icon-music",
  "anzhiyu-icon-fan",
  "anzhiyu-icon-heartbeat",
  "anzhiyu-icon-link",
  "anzhiyu-icon-chevron-left",
  "anzhiyu-icon-rocket",
  "anzhiyu-icon-lightbulb",
  "anzhiyu-icon-shoe-prints",
  "anzhiyu-icon-images",
  "anzhiyu-icon-box-archive",
  "anzhiyu-icon-artstation",
  "anzhiyu-icon-paper-plane",
  "anzhiyu-icon-house-chimney",
  "anzhiyu-icon-grip-vertical",
  "anzhiyu-icon-bars",
  "anzhiyu-icon-arrows-left-right",
  "anzhiyu-icon-book-open",
  "anzhiyu-icon-list-ul",
  "anzhiyu-icon-comments",
  "anzhiyu-icon-comment-sms",
  "anzhiyu-icon-angles-right",
  "anzhiyu-icon-tag",
  "anzhiyu-icon-chevron-right",
  "anzhiyu-icon-radio",
  "anzhiyu-icon-forward",
  "anzhiyu-icon-window-restore",
  "anzhiyu-icon-backward",
  "anzhiyu-icon-download",
  "anzhiyu-icon-comment-medical",
  "anzhiyu-icon-paste",
  "anzhiyu-icon-arrow-rotate-right",
  "anzhiyu-icon-play",
  "anzhiyu-icon-circle-xmark",
  "anzhiyu-icon-angle-down",
  "anzhiyu-icon-chart-line",
  "anzhiyu-icon-pencil",
  "anzhiyu-icon-thumbtack",
  "anzhiyu-icon-location-dot",
  "anzhiyu-icon-fw-fire",
  "anzhiyu-icon-calendar-days",
  "anzhiyu-icon-angle-right",
  "anzhiyu-icon-dice-d20",
  "anzhiyu-icon-instagram",
  "anzhiyu-icon-xmark",
  "anzhiyu-icon-spinner",
  "anzhiyu-icon-bullhorn",
  "anzhiyu-icon-stream",
  "anzhiyu-icon-caret-left",
  "anzhiyu-icon-folder-open",
  "anzhiyu-icon-thumbs-up",
  "anzhiyu-icon-angle-double-down",
  "anzhiyu-icon-sign-out-alt",
  "anzhiyu-icon-angle-double-left",
  "anzhiyu-icon-angle-double-right",
  "anzhiyu-icon-angle-left",
  "anzhiyu-icon-fw-eye",
  "anzhiyu-icon-repeat",
  "anzhiyu-icon-arrows-rotate",
  "anzhiyu-icon-pause",
  "anzhiyu-icon-jike",
  "anzhiyu-icon-rss",
  "anzhiyu-icon-qq",
  "anzhiyu-icon-github",
  "anzhiyu-icon-bilibili",
  "anzhiyu-icon-hashtag",
  "anzhiyu-icon-hand-heart-fill",
  "anzhiyu-icon-plant-fill",
  "anzhiyu-icon-qrcode",
  "anzhiyu-icon-weibo",
  "anzhiyu-icon-copyright",
  "anzhiyu-icon-bolt",
  "anzhiyu-icon-circle-info",
  "anzhiyu-icon-triangle-exclamation",
  "anzhiyu-icon-circle-check",
  "anzhiyu-icon-circle-minus",
  "anzhiyu-icon-circle-plus",
  "anzhiyu-icon-circle-dot",
  "anzhiyu-icon-scissors",
  "anzhiyu-icon-arrow-down",
  "anzhiyu-icon-dengpao",
  "anzhiyu-icon-danmu",
  "anzhiyu-icon-zonglan",
  "anzhiyu-icon-linggan",
  "anzhiyu-icon-sanmingzhi",
  "anzhiyu-icon-keyboard",
  "anzhiyu-icon-tiktok",
  "anzhiyu-icon-creative-commons-nd-line",
  "anzhiyu-icon-creative-commons-by-line",
  "anzhiyu-icon-creative-commons-nc-line",
  "anzhiyu-icon-copyright-line",
  "anzhiyu-icon-font",
  "anzhiyu-icon-stopwatch",
  "anzhiyu-icon-file-lines",
  "anzhiyu-icon-square-poll-vertical",
  "anzhiyu-icon-universal-access",
  "anzhiyu-icon-hourglass-start"
];

const filteredRemixIcons = computed(() => {
  if (!remixSearchText.value) {
    return remixIcons.value;
  }
  // 搜索时使用完整的图标列表
  const search = remixSearchText.value.toLowerCase();
  return allRemixIcons.value.length > 0
    ? allRemixIcons.value.filter(icon => icon.toLowerCase().includes(search))
    : remixIcons.value.filter(icon => icon.toLowerCase().includes(search));
});

const filteredAnzhiyuIcons = computed(() => {
  if (!anzhiyuSearchText.value) {
    return anzhiyuIcons;
  }
  const search = anzhiyuSearchText.value.toLowerCase();
  return anzhiyuIcons.filter(icon => icon.toLowerCase().includes(search));
});

// 判断是否为图片 URL
const isImageUrl = (value: string) => {
  if (!value) return false;
  return value.startsWith("http://") || value.startsWith("https://");
};

// 判断是否为 Iconify 图标
const isIconifyIcon = (value: string) => {
  if (!value) return false;
  return value.includes(":") && !isImageUrl(value);
};

// 判断是否为 anzhiyu 图标
const isAnzhiyuIcon = (value: string) => {
  if (!value) return false;
  return value.startsWith("anzhiyu") && !isImageUrl(value);
};

// 验证图片 URL 是否有效
const isValidImageUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  } catch {
    return false;
  }
};

// 选择图标
const selectIcon = (icon: string) => {
  emit("update:modelValue", icon);
  popoverVisible.value = false;
};

// 处理图片 URL 失焦
const handleImageUrlBlur = () => {
  if (imageUrl.value && isValidImageUrl(imageUrl.value)) {
    selectIcon(imageUrl.value);
  }
};

// 处理自定义输入失焦
const handleCustomInputBlur = () => {
  if (customInput.value) {
    selectIcon(customInput.value);
  }
};

// 监听 modelValue 变化，同步到各个输入框
watch(
  () => props.modelValue,
  newValue => {
    if (isImageUrl(newValue)) {
      imageUrl.value = newValue;
      activeTab.value = "image";
    } else {
      customInput.value = newValue;
      if (isIconifyIcon(newValue)) {
        activeTab.value = "remix";
      } else if (isAnzhiyuIcon(newValue)) {
        // 如果排除了 anzhiyu 图标，切换到自定义标签页
        activeTab.value = props.excludeAnzhiyu ? "custom" : "anzhiyu";
      } else {
        activeTab.value = "custom";
      }
    }
  },
  { immediate: true }
);

// 监听弹窗打开和 excludeAnzhiyu 变化，确保标签页正确
watch(
  [() => popoverVisible.value, () => props.excludeAnzhiyu],
  ([isVisible, exclude]) => {
    if (isVisible && exclude && activeTab.value === "anzhiyu") {
      // 如果排除了 anzhiyu 且当前在 anzhiyu 标签页，切换到 remix
      activeTab.value = "remix";
    }
  }
);

// 设置 Intersection Observer 监听滚动加载
const setupScrollObserver = () => {
  if (!loadMoreTrigger.value || !iconGridRef.value) return;

  // 清理旧的 observer
  if (intersectionObserver) {
    intersectionObserver.disconnect();
  }

  intersectionObserver = new IntersectionObserver(
    entries => {
      const entry = entries[0];
      if (
        entry.isIntersecting &&
        hasMoreIcons.value &&
        !remixIconsLoading.value &&
        !remixSearchText.value
      ) {
        loadMoreIcons();
      }
    },
    {
      root: iconGridRef.value, // 使用图标网格容器作为滚动根
      rootMargin: "50px", // 提前 50px 开始加载
      threshold: 0.1
    }
  );

  intersectionObserver.observe(loadMoreTrigger.value);
};

// 清理 Intersection Observer
const cleanupScrollObserver = () => {
  if (intersectionObserver) {
    intersectionObserver.disconnect();
    intersectionObserver = null;
  }
};

// 监听 loadMoreTrigger、iconGridRef 和弹窗状态，设置/清理 observer
watch(
  [
    () => loadMoreTrigger.value,
    () => iconGridRef.value,
    () => popoverVisible.value,
    () => activeTab.value
  ],
  () => {
    if (popoverVisible.value && activeTab.value === "remix") {
      nextTick(() => {
        setupScrollObserver();
      });
    } else {
      cleanupScrollObserver();
    }
  }
);

// 组件卸载时清理
onUnmounted(() => {
  cleanupScrollObserver();
});
</script>

<style lang="scss" scoped>
.icon-selector {
  width: 100%;
}

.icon-selector-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;

  .icon-preview {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    background-color: var(--anzhiyu-card-bg);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--anzhiyu-theme);
      background-color: var(--anzhiyu-card-bg-grey);
    }

    .preview-image {
      width: 24px;
      height: 24px;
      object-fit: contain;
    }

    .preview-icon {
      font-size: 20px;
      color: var(--anzhiyu-fontcolor);
    }

    .preview-placeholder {
      font-size: 12px;
      color: var(--anzhiyu-secondtext);
    }
  }

  .el-input {
    flex: 1;
  }
}

.icon-selector-content {
  padding: 12px;

  .content-header {
    margin-bottom: 12px;

    .content-title {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: var(--anzhiyu-fontcolor);
    }
  }

  .icon-selector-tabs {
    :deep(.el-tabs__header) {
      margin: 0 0 12px 0;
      padding: 0 2px;
      background-color: var(--anzhiyu-card-bg-grey);
      border-radius: 6px;
    }

    :deep(.el-tabs__nav-wrap::after) {
      display: none;
    }

    :deep(.el-tabs__item) {
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 500;
      color: var(--anzhiyu-secondtext);
      transition: all 0.3s ease;
      border-radius: 4px;
      margin: 2px 1px;

      &:hover {
        color: var(--anzhiyu-theme);
        background-color: var(--anzhiyu-card-bg);
      }

      &.is-active {
        color: var(--anzhiyu-theme);
        background-color: var(--anzhiyu-card-bg);
        font-weight: 600;
      }
    }

    :deep(.el-tabs__content) {
      padding: 0;
    }
  }

  .tab-content {
    padding: 0;
  }

  .search-input {
    margin-bottom: 12px;

    :deep(.el-input__wrapper) {
      border-radius: 6px;
      box-shadow: 0 0 0 1px var(--el-border-color) inset;
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 0 0 1px var(--anzhiyu-theme) inset;
      }

      &.is-focus {
        box-shadow: 0 0 0 2px var(--anzhiyu-theme-op) inset;
      }
    }
  }

  .url-input {
    margin-bottom: 12px;
  }

  .icon-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(85px, 1fr));
    gap: 6px;
    max-height: 320px;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 4px 4px 8px 4px;
    margin-right: -4px;

    // 自定义滚动条样式
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--anzhiyu-secondtext);
      border-radius: 3px;
      opacity: 0.3;
      transition: opacity 0.3s ease;

      &:hover {
        opacity: 0.5;
      }
    }

    .icon-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: 10px 6px;
      border: 1px solid var(--el-border-color);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      background-color: var(--anzhiyu-card-bg);
      position: relative;
      overflow: hidden;

      &::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
          135deg,
          var(--anzhiyu-theme-op) 0%,
          transparent 100%
        );
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      &:hover {
        border-color: var(--anzhiyu-theme);
        background-color: var(--anzhiyu-card-bg-grey);
        transform: translateY(-2px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

        &::before {
          opacity: 0.1;
        }

        .icon-wrapper {
          transform: scale(1.1);
        }
      }

      &.active {
        border-color: var(--anzhiyu-theme);
        background: linear-gradient(
          135deg,
          var(--anzhiyu-theme-op) 0%,
          var(--anzhiyu-card-bg) 100%
        );
        box-shadow: 0 0 0 2px var(--anzhiyu-theme-op);

        .icon-wrapper {
          transform: scale(1.05);
        }

        .icon-name {
          color: var(--anzhiyu-theme);
          font-weight: 500;
        }
      }

      .icon-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        margin-bottom: 6px;
        transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        border-radius: 4px;
        background-color: var(--anzhiyu-card-bg-grey);

        i {
          font-size: 20px;
          color: var(--anzhiyu-fontcolor);
        }

        :deep(svg) {
          color: var(--anzhiyu-fontcolor);
        }
      }

      .icon-name {
        font-size: 10px;
        color: var(--anzhiyu-secondtext);
        text-align: center;
        word-break: break-word;
        line-height: 1.2;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        transition: color 0.2s ease;
      }
    }
  }

  .image-preview {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
    margin-top: 12px;
    border: 1px solid var(--el-border-color);
    border-radius: 6px;
    background: linear-gradient(
      135deg,
      var(--anzhiyu-card-bg-grey) 0%,
      var(--anzhiyu-card-bg) 100%
    );

    .preview-image-large {
      max-width: 150px;
      max-height: 150px;
      object-fit: contain;
      border-radius: 4px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    }
  }

  .load-more-trigger {
    height: 20px;
    width: 100%;
    grid-column: 1 / -1; // 占据整行
    pointer-events: none; // 不阻挡点击事件
    margin-top: 4px;
  }

  .form-item-help {
    position: relative;
    margin-top: 10px;
    padding: 8px 10px 8px 18px;
    font-size: 11px;
    line-height: 1.5;
    color: var(--anzhiyu-secondtext);
    background-color: var(--anzhiyu-card-bg-grey);
    border-radius: 4px;

    &::before {
      content: "";
      position: absolute;
      left: 8px;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 12px;
      background-color: var(--anzhiyu-theme);
      border-radius: 2px;
    }
  }
}
</style>

<style lang="scss">
.icon-selector-popover {
  padding: 0 !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1) !important;
  border: 1px solid var(--el-border-color-lighter) !important;
  overflow: hidden;

  .el-popover__title {
    padding: 10px 12px;
    margin: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background-color: var(--anzhiyu-card-bg-grey);
  }

  .el-tabs__content {
    padding: 0;
  }
}
</style>
