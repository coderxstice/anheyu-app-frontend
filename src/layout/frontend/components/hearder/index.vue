<template>
  <header v-if="headerConfig" class="frontend-header">
    <div
      class="header-wrapper"
      :class="{
        'is-transparent': isHeaderTransparent,
        'text-is-white': shouldShowTextWhite,
        'is-scrolled': isScrolled,
        'is-route-changing': isRouteChanging
      }"
    >
      <div class="header-content">
        <div class="header-left">
          <BackMenuListGroups :navConfig="navConfig" />

          <router-link to="/" class="site-name-link" accesskey="h">
            <!-- 桌面端显示 tooltip -->
            <el-tooltip
              v-if="!isMobile"
              content="返回主页"
              placement="bottom"
              :show-arrow="false"
            >
              <div>
                <span class="site-title">{{ siteName }}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                >
                  <path
                    fill="currentColor"
                    fill-rule="evenodd"
                    d="M5.37 1.8a1 1 0 0 1 1.26 0l3.814 2.8A1.5 1.5 0 0 1 11 5.7V10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V5.7a1.5 1.5 0 0 1 .556-1zM5 7.2a.5.5 0 0 0-.5.5v1.3a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5V7.7a.5.5 0 0 0-.5-.5z"
                  />
                </svg>
              </div>
            </el-tooltip>
            <!-- 移动端不显示 tooltip -->
            <div v-else>
              <span class="site-title">{{ siteName }}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 12 12"
              >
                <path
                  fill="currentColor"
                  fill-rule="evenodd"
                  d="M5.37 1.8a1 1 0 0 1 1.26 0l3.814 2.8A1.5 1.5 0 0 1 11 5.7V10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V5.7a1.5 1.5 0 0 1 .556-1zM5 7.2a.5.5 0 0 0-.5.5v1.3a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5V7.7a.5.5 0 0 0-.5-.5z"
                />
              </svg>
            </div>
          </router-link>
        </div>

        <div class="page-name-mask">
          <!-- 桌面端显示 tooltip -->
          <el-tooltip
            v-if="!isMobile"
            content="返回顶部"
            placement="bottom"
            :showArrow="false"
          >
            <div class="page-name-container" @click="scrollToTop">
              <span class="page-name">{{ currentPageTitle }}</span>
            </div>
          </el-tooltip>
          <!-- 移动端不显示 tooltip -->
          <div v-else class="page-name-container" @click="scrollToTop">
            <span class="page-name">{{ currentPageTitle }}</span>
          </div>
        </div>

        <nav class="main-nav">
          <div class="menus-items">
            <div
              v-for="menuItem in Array.isArray(menuConfig) ? menuConfig : []"
              :key="menuItem.title"
              class="menus-item"
            >
              <!-- 一级菜单：直接跳转 -->
              <a
                v-if="
                  (menuItem.type ||
                    (menuItem.items && menuItem.items.length > 0
                      ? 'dropdown'
                      : 'direct')) === 'direct'
                "
                :href="menuItem.path || '#'"
                :target="menuItem.isExternal ? '_blank' : '_self'"
                :rel="menuItem.isExternal ? 'noopener noreferrer' : undefined"
                :data-pjax-state="menuItem.isExternal ? undefined : ''"
                class="menu-title direct-link site-page"
                @click="
                  menuItem.path === '/travelling'
                    ? handleDirectMenuTravelClick($event)
                    : null
                "
              >
                <!-- 图片 URL -->
                <img
                  v-if="
                    menuItem.icon &&
                    (menuItem.icon.startsWith('http://') ||
                      menuItem.icon.startsWith('https://'))
                  "
                  :src="menuItem.icon"
                  :alt="menuItem.title"
                  class="menu-icon menu-icon-img"
                />
                <!-- Iconify 图标 -->
                <IconifyIconOnline
                  v-else-if="menuItem.icon && menuItem.icon.includes(':')"
                  :icon="menuItem.icon"
                  width="1em"
                  height="1em"
                  class="menu-icon menu-icon-iconify"
                />
                <!-- anzhiyu 图标 -->
                <i
                  v-else-if="menuItem.icon"
                  :class="['anzhiyufont', menuItem.icon]"
                  class="menu-icon"
                />
                <span>{{ menuItem.title }}</span>
              </a>
              <!-- 二级菜单：下拉菜单 -->
              <template
                v-else-if="
                  (menuItem.type ||
                    (menuItem.items && menuItem.items.length > 0
                      ? 'dropdown'
                      : 'direct')) === 'dropdown'
                "
              >
                <div class="menu-title">
                  <span>{{ menuItem.title }}</span>
                </div>
                <ul class="menus-item-child">
                  <li v-for="item in menuItem.items || []" :key="item.path">
                    <a
                      v-if="item.isExternal"
                      :href="item.path"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="site-page"
                    >
                      <!-- 图片 URL -->
                      <img
                        v-if="
                          item.icon &&
                          (item.icon.startsWith('http://') ||
                            item.icon.startsWith('https://'))
                        "
                        :src="item.icon"
                        :alt="item.title"
                        class="menu-icon menu-icon-img"
                      />
                      <!-- Iconify 图标 -->
                      <IconifyIconOnline
                        v-else-if="item.icon && item.icon.includes(':')"
                        :icon="item.icon"
                        width="1em"
                        height="1em"
                        class="menu-icon menu-icon-iconify"
                      />
                      <!-- anzhiyu 图标 -->
                      <i
                        v-else-if="item.icon"
                        :class="['anzhiyufont', item.icon]"
                        class="menu-icon"
                      />
                      <span>{{ item.title }}</span>
                    </a>
                    <a
                      v-else-if="item.path === '/travelling'"
                      href="#"
                      class="site-page"
                      @click.prevent="handleTreasureLinkClick"
                    >
                      <!-- 图片 URL -->
                      <img
                        v-if="
                          item.icon &&
                          (item.icon.startsWith('http://') ||
                            item.icon.startsWith('https://'))
                        "
                        :src="item.icon"
                        :alt="item.title"
                        class="menu-icon menu-icon-img"
                      />
                      <!-- Iconify 图标 -->
                      <IconifyIconOnline
                        v-else-if="item.icon && item.icon.includes(':')"
                        :icon="item.icon"
                        width="1em"
                        height="1em"
                        class="menu-icon menu-icon-iconify"
                      />
                      <!-- anzhiyu 图标 -->
                      <i
                        v-else-if="item.icon"
                        :class="['anzhiyufont', item.icon]"
                        class="menu-icon"
                      />
                      <span>{{ item.title }}</span>
                    </a>
                    <a
                      v-else-if="
                        item.path &&
                        (item.path.startsWith('http://') ||
                          item.path.startsWith('https://'))
                      "
                      :href="item.path"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="site-page"
                    >
                      <!-- 图片 URL -->
                      <img
                        v-if="
                          item.icon &&
                          (item.icon.startsWith('http://') ||
                            item.icon.startsWith('https://'))
                        "
                        :src="item.icon"
                        :alt="item.title"
                        class="menu-icon menu-icon-img"
                      />
                      <!-- Iconify 图标 -->
                      <IconifyIconOnline
                        v-else-if="item.icon && item.icon.includes(':')"
                        :icon="item.icon"
                        width="1em"
                        height="1em"
                        class="menu-icon menu-icon-iconify"
                      />
                      <!-- anzhiyu 图标 -->
                      <i
                        v-else-if="item.icon"
                        :class="['anzhiyufont', item.icon]"
                        class="menu-icon"
                      />
                      <span>{{ item.title }}</span>
                    </a>
                    <router-link v-else :to="item.path" class="site-page">
                      <!-- 图片 URL -->
                      <img
                        v-if="
                          item.icon &&
                          (item.icon.startsWith('http://') ||
                            item.icon.startsWith('https://'))
                        "
                        :src="item.icon"
                        :alt="item.title"
                        class="menu-icon menu-icon-img"
                      />
                      <!-- Iconify 图标 -->
                      <IconifyIconOnline
                        v-else-if="item.icon && item.icon.includes(':')"
                        :icon="item.icon"
                        width="1em"
                        height="1em"
                        class="menu-icon menu-icon-iconify"
                      />
                      <!-- anzhiyu 图标 -->
                      <i
                        v-else-if="item.icon"
                        :class="['anzhiyufont', item.icon]"
                        class="menu-icon"
                      />
                      <span>{{ item.title }}</span>
                    </router-link>
                  </li>
                </ul>
              </template>
            </div>
          </div>
        </nav>

        <HeaderRight
          :navConfig="navConfig"
          :is-transparent="isHeaderTransparent"
          :scroll-percent="scrollPercent"
          :is-footer-visible="isFooterVisible"
        />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted, ref, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { useArticleStore } from "@/store/modules/articleStore";
import {
  updateMetaThemeColorDynamic,
  getCurrentArticlePrimaryColor
} from "@/utils/themeManager";
import { IconifyIconOnline } from "@/components/ReIcon";

import { useHeader } from "./hooks/useHeader";
import BackMenuListGroups from "./components/back-menu-list-groups.vue";
import HeaderRight from "./components/header-right.vue";

const siteConfigStore = useSiteConfigStore();
const siteConfig = computed(() => siteConfigStore.getSiteConfig);
const route = useRoute();
const router = useRouter();
const articleStore = useArticleStore();

// 移动端检测
const isMobile = ref(false);

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

onMounted(() => {
  checkMobile();
  window.addEventListener("resize", checkMobile);
});

onUnmounted(() => {
  window.removeEventListener("resize", checkMobile);
});

const isPostDetailPage = computed(() => route.name === "PostDetail");
const isMusicPage = computed(() => route.name === "MusicHome");

const { isHeaderTransparent, isScrolled, scrollPercent, isFooterVisible } =
  useHeader(isPostDetailPage.value);

// 立即应用 text-is-white 类名，避免路由切换时的闪烁
const shouldShowTextWhite = ref(false);
const isRouteChanging = ref(false);

// 更新 shouldShowTextWhite 的函数，基于实际滚动位置
const updateTextWhite = () => {
  const scrollTop = Math.max(0, window.scrollY);
  const isAtTop = scrollTop === 0;
  shouldShowTextWhite.value =
    isAtTop && (isPostDetailPage.value || isMusicPage.value);
};

// 监听路由变化，立即更新类名
watch(
  [isPostDetailPage, isMusicPage],
  () => {
    // 路由切换时立即检查实际滚动位置并应用类名
    updateTextWhite();
  },
  { immediate: true }
);

// 监听滚动状态变化，更新 text-is-white
watch(
  isHeaderTransparent,
  () => {
    if (!isRouteChanging.value) {
      updateTextWhite();
    }
  },
  { immediate: true }
);

// 监听路由变化，在路由切换时禁用动画并立即检查滚动位置
router.beforeEach(() => {
  isRouteChanging.value = true;
});

router.afterEach(() => {
  // 路由切换后立即检查实际滚动位置
  // 使用 nextTick 确保 DOM 已更新，然后立即检查滚动位置
  nextTick(() => {
    // 立即检查滚动位置并应用类名
    updateTextWhite();

    // 短暂延迟后恢复正常状态，允许后续滚动事件正常触发
    requestAnimationFrame(() => {
      setTimeout(() => {
        isRouteChanging.value = false;
        // 再次检查确保状态正确
        updateTextWhite();
      }, 50);
    });
  });
});

// 监听页面类型变化，更新 meta theme-color
watch(
  isPostDetailPage,
  newValue => {
    const scrollTop = Math.max(0, window.scrollY);
    const isAtTop = scrollTop === 0;

    if (isAtTop) {
      if (newValue) {
        // 文章页顶部：使用文章主色调（如果已加载）
        const articleColor = getCurrentArticlePrimaryColor();
        if (articleColor) {
          updateMetaThemeColorDynamic(articleColor);
        } else {
          // 如果没有获取到文章主色，使用背景色作为备用方案
          updateMetaThemeColorDynamic("var(--anzhiyu-background)");
        }
      } else {
        // 首页顶部：使用背景色
        updateMetaThemeColorDynamic("var(--anzhiyu-background)");
      }
    } else {
      // 不在顶部：使用卡片背景色
      updateMetaThemeColorDynamic("var(--anzhiyu-card-bg)");
    }
  },
  { immediate: true }
);

const headerConfig = computed(() => siteConfig.value?.header);
const navConfig = computed(() => headerConfig.value?.nav);
const menuConfig = computed(() => {
  const menu = headerConfig.value?.menu;
  return Array.isArray(menu) ? menu : [];
});
const siteName = computed(() => siteConfig.value?.APP_NAME || "安和鱼");

const currentPageTitle = computed(() => {
  if (route.name === "PostDetail" && articleStore.currentArticleTitle) {
    // 文章详情页：标题格式为 "文章标题"
    return `${articleStore.currentArticleTitle}`;
  }

  const title = route.meta.title;
  if (typeof title === "function") {
    return title();
  }
  return title || "";
});

const handleTreasureLinkClick = () => {
  articleStore.navigateToRandomLink();
};

const handleDirectMenuTravelClick = (event: Event) => {
  event.preventDefault();
  articleStore.navigateToRandomLink();
};

// SSR 场景：记录是否是首次执行
let isFirstExecution = true;

watch(
  currentPageTitle,
  newTitle => {
    // SSR 场景：如果是首次执行且有服务端渲染的标题且有初始数据，跳过标题更新
    if (isFirstExecution) {
      const hasInitialData =
        window.__INITIAL_DATA__ && window.__INITIAL_DATA__.data;
      const hasServerTitle = document.title && document.title !== "";

      // 如果是 SSR 场景（有初始数据且有服务端标题），保留服务端标题
      if (hasInitialData && hasServerTitle) {
        isFirstExecution = false;
        return;
      }

      isFirstExecution = false;
    }

    // 正常更新标题
    if (newTitle) {
      document.title = newTitle;
    }
  },
  { immediate: true }
);

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
};
</script>

<style scoped lang="scss">
.is-post-detail {
  .frontend-header {
    position: fixed;
    z-index: 99;
  }
}

.frontend-header {
  position: relative;
  width: 100%;
  height: 60px;
  font-size: 1rem;

  a {
    color: var(--anzhiyu-fontcolor);
    text-decoration: none;
    transition: color 0.3s;

    &:hover {
      color: var(--anzhiyu-main);
    }
  }

  .header-wrapper {
    position: fixed;
    top: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    background-color: var(--anzhiyu-card-bg);
    outline: 1px solid var(--anzhiyu-card-border);
    transition:
      background-color 0.3s,
      outline-color 0.3s;

    // 路由切换时禁用所有过渡动画，立即应用类名
    &.is-route-changing {
      transition: none !important;

      * {
        transition: none !important;
      }
    }

    .header-content {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
      max-width: 1400px;
      padding: 0 1.5rem;

      .header-left {
        z-index: 102;
        display: flex;
        flex-wrap: nowrap;
        align-items: center;
        height: 60px;
        transition: 0.3s;

        .site-name-link {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 35px;
          padding: 0 2px;
          overflow: hidden;
          line-height: 35px;
          white-space: nowrap;
          border-radius: 50px;
          transition: 0.3s;

          svg {
            position: absolute;
            left: 50%;
            font-weight: 700;
            opacity: 0;
            transition: 0.3s;
            transform: translateX(-50%);
            display: inline;
            line-height: 38px;
            height: 38px;
            width: 22px;
          }

          &:hover {
            color: var(--anzhiyu-white);
            background: var(--anzhiyu-main);

            svg {
              color: var(--anzhiyu-white);
              filter: none;
              opacity: 1;
            }

            .site-title {
              opacity: 0;
            }
          }

          .site-title {
            padding: 0 5px;
            font-size: 1.2rem;
            font-weight: 700;
            line-height: 2;
            letter-spacing: normal;
            cursor: pointer;
            transition:
              all 0.3s,
              color 0s,
              opacity 0.3s;
          }
        }
      }

      .page-name-mask {
        position: absolute;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;

        .page-name-container {
          position: absolute;
          top: 62px;
          right: 0;
          left: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: fit-content;
          height: 40px;
          margin: auto;
          pointer-events: none;
          cursor: pointer;
          border-radius: 12px;
          opacity: 0;
          /* 优化过渡：使用 GPU 加速 + 更流畅的缓动 */
          transition:
            transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
            opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          transform: translateY(10px) translateZ(0);
          will-change: transform, opacity;
          backface-visibility: hidden;

          &:hover .page-name {
            color: var(--anzhiyu-main);
          }

          .page-name {
            position: relative;
            top: 0;
            display: inline;
            padding: 4px 8px;
            overflow: hidden;
            font-size: 1.1rem;
            font-weight: 700;
            text-align: center;
            text-overflow: ellipsis;
            white-space: nowrap;
            cursor: pointer;
            filter: none;
            opacity: 1;
            transition: color 0.3s;
            animation-timing-function: ease-in;
          }
        }
      }

      .main-nav {
        position: absolute;
        left: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 60px;
        margin: 0;
        transform: translateZ(0);

        .menus-items {
          position: relative;
          top: 0;
          right: 0;
          left: 0;
          display: flex;
          flex-direction: row;
          justify-content: center;
          width: fit-content;
          text-align: center;
          pointer-events: auto;
          opacity: 1;
          transition:
            transform 0.2s ease-out,
            opacity 0.2s ease-out;
          transform: translateY(0) scale(1);

          .menus-item {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 0 0.4rem;
            margin: auto;
            border-radius: 30px;

            &:first-child .menus-item-child::after {
              position: absolute;
              top: -60px;
              left: 0;
              width: 50%;
              height: 60px;
              content: "";
            }

            &:last-child .menus-item-child::after {
              position: absolute;
              top: -60px;
              right: 0;
              width: 50%;
              height: 60px;
              content: "";
            }

            .menu-title {
              height: 35px;
              padding: 0 0.8em 0 1em;
              font-size: 1rem;
              font-weight: 700;
              line-height: 35px;
              letter-spacing: 0.3rem;
              cursor: pointer;
              border-radius: 50px;
              transition: all 0.3s;
            }

            .menus-item-child {
              position: absolute;
              top: 35px;
              right: auto;
              left: auto;
              box-sizing: content-box;
              width: max-content;
              padding: 6px 4px;
              margin-top: 8px;
              line-height: 35px;
              pointer-events: none;
              background-color: var(--anzhiyu-card-bg);
              filter: alpha(opacity=0);
              border: var(--style-border);
              border-radius: 50px;
              box-shadow: var(--anzhiyu-shadow-black);
              backdrop-filter: blur(20px);
              opacity: 0;
              transition: 0.3s;
              transform: translateY(-10px) scale(0);
              transform-origin: top;

              li {
                display: inline-block;
                margin: 0 3px;
                border-radius: 50px;
                transition: all 0.3s;

                a {
                  padding: 2px 16px;
                }
              }

              &::before {
                position: absolute;
                top: -12px;
                left: 0;
                width: 100%;
                height: 16px;
                content: "";
              }

              .site-page {
                display: flex;
                align-items: center;
                min-height: 35px;
                padding: 0.3rem 0.8rem;
                color: var(--anzhiyu-fontcolor);
                text-shadow: none;
                letter-spacing: 0;
                border-radius: 100px;
                transition: 0.3s;

                &:hover {
                  padding: 0.3rem 1rem;
                  margin: 0 auto;
                  color: var(--anzhiyu-card-bg);
                  background: var(--anzhiyu-lighttext);
                  transform: scale(1);
                }

                i.menu-icon {
                  margin-right: 6px;
                  font-size: 0.9rem;
                }

                .menu-icon-iconify {
                  display: inline-flex;
                  flex-shrink: 0;
                  align-items: center;
                  justify-content: center;
                  width: 0.9rem;
                  height: 0.9rem;
                  margin-right: 6px;

                  :deep(svg) {
                    width: 100%;
                    height: 100%;
                  }
                }

                // 当 site-page 包含 Iconify 图标时，整体下移对齐
                &:has(.menu-icon-iconify) {
                  transform: translateY(2px);
                }
              }
            }

            &:hover {
              .menu-title {
                color: var(--anzhiyu-white) !important;
                background: var(--anzhiyu-main);
              }

              .menus-item-child {
                pointer-events: all;
                filter: none;
                border: var(--style-border-hover);
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
          }
        }
      }
    }

    &.is-scrolled {
      .main-nav .menus-items {
        pointer-events: none;
        opacity: 0;
        transform: translateY(-50px) scale(1.1);
      }

      .page-name-mask .page-name-container {
        z-index: 1;
        pointer-events: auto;
        opacity: 1;
        /* 优化：减少位移幅度，移除 scale 变化 */
        transform: translateY(-52px) translateZ(0);
      }
    }

    &.is-transparent {
      background-color: var(--anzhiyu-background);
      outline-color: transparent;

      // 文章详情页和音乐页顶部时，导航栏完全透明
      &.text-is-white {
        background-color: transparent;
      }
    }

    &.text-is-white {
      a,
      :deep(.header-right a),
      :deep(.back-menu-button),
      :deep(.nav-button) {
        transition: color 0.2s ease-out;
        color: var(--anzhiyu-white);

        &:hover {
          color: var(--anzhiyu-white);
          background: var(--anzhiyu-white-op);
        }
      }

      :deep(#toggle-menu) {
        transition: color 0.2s ease-out;
        color: var(--anzhiyu-white);
      }

      :deep(#center-console + label i) {
        transition:
          background 0.2s ease-out,
          all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        background: var(--anzhiyu-white);
      }

      .header-content .header-left .site-name-link:hover {
        color: var(--anzhiyu-white);
        background: var(--anzhiyu-white-op);
      }

      .back-home-button {
        transition: color 0.2s ease-out;
        color: var(--anzhiyu-white);

        &:hover {
          background: var(--anzhiyu-white-op);
        }
      }

      .main-nav .menus-items .menus-item .menu-title {
        transition: color 0.2s ease-out;
        color: var(--anzhiyu-white);

        &:hover {
          color: var(--anzhiyu-white);
        }
      }

      .header-content .main-nav .menus-items .menus-item:hover .menu-title {
        background: var(--anzhiyu-white-op);
      }

      .main-nav .menus-items .menus-item:hover .menu-title {
        color: var(--anzhiyu-white) !important;
      }
    }
  }
}

@media (width <= 768px) {
  .page-name-mask {
    display: none;
  }

  .main-nav {
    display: none !important;
  }

  .frontend-header .header-wrapper .header-content {
    padding: 0 1rem;
  }

  // 移动端禁用 site-name-link 的 hover 效果
  .header-left .site-name-link {
    &:hover {
      color: inherit !important;
      background: transparent !important;

      svg {
        color: inherit !important;
        opacity: 0 !important;
      }

      .site-title {
        opacity: 1 !important;
      }
    }
  }

  // 禁用透明状态下的 hover 效果
  .header-wrapper.text-is-white
    .header-content
    .header-left
    .site-name-link:hover {
    color: var(--anzhiyu-white) !important;
    background: transparent !important;
  }
}

#toggle-menu {
  display: block;
  font-size: 1.2rem;

  @media (width >= 992px) {
    display: none;
  }
}

/* 支持一级菜单的直接链接样式 */
.menus-items .menus-item a.direct-link {
  display: flex;
  gap: 4px;
  align-items: center;
  color: inherit;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    color: var(--anzhiyu-main);
  }

  .menu-icon {
    font-size: 14px;
  }

  .menu-icon-img {
    width: 14px;
    height: 14px;
    object-fit: contain;
  }

  .menu-icon-iconify {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    font-size: 14px;
    vertical-align: middle;

    :deep(svg) {
      width: 100%;
      height: 100%;
    }
  }
}
</style>
