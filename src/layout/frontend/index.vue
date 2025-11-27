<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-21 17:48:59
 * @LastEditTime: 2025-11-23 12:58:42
 * @LastEditors: 安知鱼
-->
<template>
  <div
    :class="{ frontendLayout: true, [mainContentClass]: true }"
    :style="oneImageStyle"
  >
    <Header />

    <!-- 一图流全屏背景 -->
    <div v-if="currentOneImageConfig?.enable" class="one-image-banner">
      <!-- 视频背景 -->
      <video
        v-if="effectiveMediaType === 'video' && effectiveBackground"
        ref="videoRef"
        :key="effectiveBackground"
        :src="effectiveBackground"
        :loop="effectiveVideoLoop"
        playsinline
        class="one-image-video-background"
        @loadedmetadata="handleVideoLoaded"
      />
      <!-- 视频声音控制按钮 -->
      <div
        v-if="effectiveMediaType === 'video'"
        class="video-sound-control"
        :class="{ 'has-hint': showUnmuteButton }"
        @click="toggleVideoMute"
      >
        <IconifyIconOffline
          :icon="isVideoMuted ? MuteIcon : MicrophoneIcon"
          class="sound-icon"
        />
        <span v-if="showUnmuteButton">点击开启声音</span>
      </div>
      <div id="site-info">
        <h1 id="site-title">{{ currentOneImageConfig.mainTitle }}</h1>
        <div id="site-subtitle">
          <span id="subtitle">{{ displaySubtitle }}</span>
          <span
            v-if="currentOneImageConfig.typingEffect"
            class="typed-cursor"
            aria-hidden="true"
            >|</span
          >
        </div>
      </div>
      <!-- scroll-down 按钮只在首页显示 -->
      <div v-if="isHomePage" id="scroll-down" @click="scrollToMain">
        <IconifyIconOffline :icon="ArrowDownBold" class="scroll-down-icon" />
      </div>
    </div>

    <main class="frontend-main">
      <router-view v-slot="{ Component }">
        <keep-alive :include="cachedViews">
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </main>

    <Footer />

    <SearchModal />

    <RightMenu />

    <KeyboardTips :visible="showShortcutsPanel" :shortcuts="shortcuts" />

    <MusicPlayer v-if="isMusicPlayerEnabled" />

    <MobileMenu
      :is-open="isMobileMenuOpen"
      :nav-config="navConfig"
      :menu-config="menuConfig"
      @close="closeMobileMenu"
    />

    <div
      v-if="isMobileMenuOpen"
      class="mobile-menu-overlay"
      @click="closeMobileMenu"
    />
  </div>
</template>

<script setup lang="ts">
import "@/components/ReIcon/src/offlineIcon";
import {
  onBeforeMount,
  onMounted,
  onUnmounted,
  computed,
  ref,
  watch
} from "vue";
import { useRoute } from "vue-router";
import { useGlobal } from "@pureadmin/utils";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
import { useKeyboardShortcuts } from "@/composables/useKeyboardShortcuts";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import type { PageOneImageItem } from "@/views/system/settings-management/type";
import { IconifyIconOffline } from "@/components/ReIcon";
import ArrowDownBold from "@iconify-icons/ep/arrow-down-bold";
import MuteIcon from "@iconify-icons/ep/mute";
import MicrophoneIcon from "@iconify-icons/ep/microphone";

import Header from "./components/hearder/index.vue";
import Footer from "./components/footer/index.vue";
import SearchModal from "./components/SearchModal/index.vue";
import RightMenu from "./components/RightMenu/index.vue";
import KeyboardTips from "./components/KeyboardTips/index.vue";
import MobileMenu from "./components/MobileMenu/index.vue";
import MusicPlayer from "./components/MusicPlayer/index.vue";
import { useCopyProtection } from "@/composables/useCopyProtection";

const { $storage } = useGlobal<GlobalPropertiesApi>();
const route = useRoute();
const siteConfigStore = useSiteConfigStore();

// 一图流相关
const displaySubtitle = ref("");
const hitokotoText = ref("");

// 视频相关
const videoRef = ref<HTMLVideoElement | null>(null);
const showUnmuteButton = ref(false);
const isVideoMuted = ref(true); // 跟踪当前视频静音状态

// 移动设备检测
const isMobile = ref(false);
const checkIsMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

// 路由名称到一图流配置键的映射
const routeToConfigMap: Record<string, string> = {
  PostHome: "home",
  PostLink: "link",
  PostCategoriesAll: "categories",
  PostTagsAll: "tags",
  PostArchives: "archives"
};

// 判断是否为首页
const isHomePage = computed(() => {
  return route.name === "PostHome";
});

// 获取当前页面的一图流配置
const currentOneImageConfig = computed<PageOneImageItem | null>(() => {
  const routeName = route.name as string;
  const configKey = routeToConfigMap[routeName];

  if (!configKey) return null;

  // 后端返回的结构是 page.one_image.config，unflatten 后变成 page.one_image.config
  const pageConfig =
    siteConfigStore.siteConfig?.page?.one_image?.config ||
    siteConfigStore.siteConfig?.page?.oneImageConfig;

  if (!pageConfig || !pageConfig[configKey]) return null;

  return pageConfig[configKey];
});

// 根据设备类型获取实际的背景URL和媒体类型
const effectiveBackground = computed(() => {
  const config = currentOneImageConfig.value;
  if (!config) return "";

  // 如果是移动设备且配置了移动端背景，使用移动端配置
  if (isMobile.value && config.mobileBackground) {
    return config.mobileBackground;
  }

  return config.background;
});

const effectiveMediaType = computed(() => {
  const config = currentOneImageConfig.value;
  if (!config) return "image";

  // 如果是移动设备且配置了移动端背景，使用移动端媒体类型
  if (isMobile.value && config.mobileBackground) {
    return config.mobileMediaType || "image";
  }

  return config.mediaType;
});

const effectiveVideoAutoplay = computed(() => {
  const config = currentOneImageConfig.value;
  if (!config) return true;

  // 如果是移动设备且配置了移动端背景，使用移动端视频配置
  if (isMobile.value && config.mobileBackground) {
    return config.mobileVideoAutoplay ?? true;
  }

  return config.videoAutoplay ?? true;
});

const effectiveVideoLoop = computed(() => {
  const config = currentOneImageConfig.value;
  if (!config) return true;

  // 如果是移动设备且配置了移动端背景，使用移动端视频配置
  if (isMobile.value && config.mobileBackground) {
    return config.mobileVideoLoop ?? true;
  }

  return config.videoLoop ?? true;
});

const effectiveVideoMuted = computed(() => {
  const config = currentOneImageConfig.value;
  if (!config) return true;

  // 如果是移动设备且配置了移动端背景，使用移动端视频配置
  if (isMobile.value && config.mobileBackground) {
    return config.mobileVideoMuted ?? true;
  }

  return config.videoMuted ?? true;
});

// 一图流背景样式（仅用于图片背景）
const oneImageStyle = computed(() => {
  if (
    !currentOneImageConfig.value?.enable ||
    !effectiveBackground.value ||
    effectiveMediaType.value === "video"
  ) {
    return {};
  }

  return {
    "--one-image-background": `url(${effectiveBackground.value})`
  };
});

// 获取一言
const fetchHitokoto = async () => {
  try {
    // 从配置中获取一言 API 地址，如果没有配置则使用默认值
    const hitokotoAPI =
      siteConfigStore.siteConfig?.page?.one_image?.hitokoto_api ||
      "https://v1.hitokoto.cn/";
    const response = await fetch(hitokotoAPI);
    const data = await response.json();
    hitokotoText.value = data.hitokoto;
  } catch (error) {
    console.error("获取一言失败:", error);
    hitokotoText.value = "";
  }
};

// 打字机效果
const typeWriter = (text: string, speed?: number) => {
  // 从配置中获取打字机速度，如果没有配置则使用默认值
  const configSpeed = siteConfigStore.siteConfig?.page?.one_image?.typing_speed;
  const typingSpeed = speed || Number(configSpeed) || 100;

  let i = 0;
  displaySubtitle.value = "";

  const type = () => {
    if (i < text.length) {
      displaySubtitle.value += text.charAt(i);
      i++;
      setTimeout(type, typingSpeed);
    }
  };

  type();
};

// 滚动到主内容区
const scrollToMain = () => {
  const main = document.querySelector(".frontend-main");
  if (main) {
    const mainPosition = main.getBoundingClientRect().top + window.scrollY;
    const offsetPosition = mainPosition - 70;
    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth"
    });
  }
};

// 处理视频加载完成
const handleVideoLoaded = async () => {
  const video = videoRef.value;
  if (!video || !currentOneImageConfig.value) return;

  const shouldAutoplay = effectiveVideoAutoplay.value;
  const shouldMute = effectiveVideoMuted.value;

  if (!shouldAutoplay) {
    isVideoMuted.value = shouldMute;
    video.muted = shouldMute;
    return;
  }

  // 如果配置为静音，直接静音播放
  if (shouldMute) {
    video.muted = true;
    isVideoMuted.value = true;
    showUnmuteButton.value = false;
    try {
      await video.play();
    } catch {
      console.warn("视频自动播放失败");
    }
    return;
  }

  // 如果配置为非静音，先尝试带声音播放
  video.muted = false;
  try {
    await video.play();
    isVideoMuted.value = false;
    showUnmuteButton.value = false;
  } catch {
    // 浏览器策略阻止带声音自动播放，改为静音播放并显示提示
    console.info("浏览器策略阻止带声音自动播放，已切换为静音播放");
    video.muted = true;
    isVideoMuted.value = true;
    showUnmuteButton.value = true;
    try {
      await video.play();
    } catch {
      console.warn("视频播放失败");
    }
  }
};

// 切换视频静音状态
const toggleVideoMute = () => {
  const video = videoRef.value;
  if (!video) return;

  if (isVideoMuted.value) {
    // 取消静音
    video.muted = false;
    isVideoMuted.value = false;
    showUnmuteButton.value = false;
  } else {
    // 静音
    video.muted = true;
    isVideoMuted.value = true;
  }
};

// 监听路由变化，更新副标题和视频状态
watch(
  () => currentOneImageConfig.value,
  async config => {
    // 重置视频静音提示状态
    showUnmuteButton.value = false;

    if (!config?.enable) {
      displaySubtitle.value = "";
      return;
    }

    // 如果开启一言
    if (config.hitokoto) {
      await fetchHitokoto();
      const text = hitokotoText.value || config.subTitle;

      if (config.typingEffect) {
        typeWriter(text);
      } else {
        displaySubtitle.value = text;
      }
    } else {
      // 使用手动设置的副标题
      if (config.typingEffect) {
        typeWriter(config.subTitle);
      } else {
        displaySubtitle.value = config.subTitle;
      }
    }
  },
  { immediate: true }
);

const { showShortcutsPanel, shortcuts } = useKeyboardShortcuts();

// 初始化文章复制保护功能
useCopyProtection();

// 管理需要缓存的组件名称（使用组件的 name，不是路由的 name）
const cachedViews = ref<string[]>([]);

// 监听路由变化，根据 meta.keepAlive 动态管理缓存
watch(
  () => route,
  toRoute => {
    if (!toRoute.name) return;

    const matchedRoute = toRoute.matched.find(r => r.name === toRoute.name);
    if (!matchedRoute?.meta?.keepAlive) return;

    // 获取组件名称（从路由配置中获取组件的 name）
    // 注意：keep-alive 的 include 需要的是组件的 name（defineOptions 中定义的）
    // 这里我们使用路由的 name，因为组件名通常与路由名一致
    const componentName = toRoute.name as string;

    // 如果组件需要缓存且不在缓存列表中，添加到缓存列表
    if (componentName && !cachedViews.value.includes(componentName)) {
      cachedViews.value.push(componentName);
    }
  },
  { immediate: true }
);

const mainContentClass = computed(() => {
  return route.name === "PostDetail" ? "is-post-detail" : "";
});

// 音乐播放器是否启用
const isMusicPlayerEnabled = computed(() => {
  const musicConfig = siteConfigStore.getSiteConfig?.music?.player?.enable;
  return Boolean(musicConfig);
});

const navConfig = computed(() => siteConfigStore.getSiteConfig?.header?.nav);
const menuConfig = computed(() => {
  const menu = siteConfigStore.getSiteConfig?.header?.menu;
  return Array.isArray(menu) ? menu : [];
});

// 移动端菜单状态管理
const isMobileMenuOpen = ref(false);

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
  // 防止背景滚动
  if (isMobileMenuOpen.value) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
  document.body.style.overflow = "";
};

onBeforeMount(() => {
  useDataThemeChange().dataThemeChange($storage.layout?.overallStyle);
});

onMounted(() => {
  // 初始化移动设备检测
  checkIsMobile();
  window.addEventListener("resize", checkIsMobile);
  // 监听移动端菜单切换事件
  window.addEventListener("toggle-mobile-menu", toggleMobileMenu);
});

onUnmounted(() => {
  // 清理事件监听器
  window.removeEventListener("resize", checkIsMobile);
  window.removeEventListener("toggle-mobile-menu", toggleMobileMenu);
  // 确保移除body样式
  document.body.style.overflow = "";
});
</script>

<style scoped lang="scss">
.frontendLayout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;

  /* 一图流背景（图片） */
  &::before {
    content: "";
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    background-image: var(--one-image-background);
    background-attachment: local;
    background-position: center;
    background-size: cover;
    background-repeat: no-repeat;
    z-index: -1;
    opacity: 0;
    transition: opacity 0.6s ease;
  }

  &:has(.one-image-banner)::before {
    opacity: 1;
  }
}

.frontend-main {
  flex: 1;
  animation: slide-in 0.6s 0.1s backwards;
}

/* 一图流全屏横幅 */
.one-image-banner {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
  color: #fff;
  text-align: center;
  overflow: hidden;

  /* 视频背景样式 */
  .one-image-video-background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    object-fit: cover;
    z-index: -1;
    opacity: 1;
    transition: opacity 0.6s ease;
  }

  /* 视频声音控制按钮 */
  .video-sound-control {
    position: absolute;
    bottom: 120px;
    right: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 44px;
    height: 44px;
    padding: 0;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    color: #fff;
    cursor: pointer;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
    animation: fade-in-up 0.8s 0.8s ease-out backwards;
    z-index: 10;

    &:hover {
      background: rgba(0, 0, 0, 0.7);
      transform: scale(1.1);
    }

    .sound-icon {
      font-size: 1.3rem;
    }

    span {
      display: none;
    }

    /* 有提示文字时的样式（首次需要开启声音时） */
    &.has-hint {
      width: auto;
      padding: 10px 20px;
      border-radius: 25px;
      right: auto;
      left: 50%;
      transform: translateX(-50%);

      &:hover {
        transform: translateX(-50%) scale(1.05);
      }

      span {
        display: inline;
        font-size: 0.9rem;
        font-weight: 500;
      }
    }
  }

  #site-info {
    margin-bottom: 60px;
    animation: fade-in-up 0.8s ease-out;

    #site-title {
      margin: 0 0 20px;
      font-size: 3.5rem;
      font-weight: 700;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
      animation: fade-in-up 0.8s 0.2s ease-out backwards;

      @media (max-width: 768px) {
        font-size: 2.5rem;
      }
    }

    #site-subtitle {
      font-size: 1.5rem;
      font-weight: 300;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
      animation: fade-in-up 0.8s 0.4s ease-out backwards;

      @media (max-width: 768px) {
        font-size: 1.2rem;
      }

      #subtitle {
        display: inline-block;
      }

      .typed-cursor {
        display: inline-block;
        margin-left: 4px;
        font-weight: 400;
        animation: blink 1s infinite;
      }
    }
  }

  #scroll-down {
    position: absolute;
    bottom: 60px;
    left: 50%;
    transform: translateX(-50%);
    cursor: pointer;
    animation: fade-in-up 0.8s 0.6s ease-out backwards;

    .scroll-down-icon {
      position: relative;
      font-size: 2rem;
      color: #fff;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
      animation: scroll-down-bounce 2s infinite;
    }
  }
}

/* 移动端菜单遮罩层 */
.mobile-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1008;
  width: 100vw;
  height: 100vh;
  background: var(--anzhiyu-maskbg);
  backdrop-filter: saturate(180%) blur(20px);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 动画定义 */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

@keyframes scroll-down-bounce {
  0% {
    top: 0px;
    opacity: 0.4;
  }
  50% {
    top: -16px;
    opacity: 1;
    filter: none;
  }
  100% {
    top: 0px;
    opacity: 0.4;
  }
}
</style>
