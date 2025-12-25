<script setup lang="ts">
import {
  type PropType,
  computed,
  ref,
  onMounted,
  onUnmounted,
  watch
} from "vue";
import type { Article } from "@/api/post/type";
import { useRouter } from "vue-router";
import { useArticleStore } from "@/store/modules/articleStore";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useDark } from "@pureadmin/utils";
import { initLazyLoad, destroyLazyLoad } from "@/utils/lazyload";

gsap.registerPlugin(ScrollTrigger);

const props = defineProps({
  article: {
    type: Object as PropType<Article & { comment_count?: number }>,
    required: true
  }
});

const router = useRouter();
const articleStore = useArticleStore();
const siteConfigStore = useSiteConfigStore();
let ctx: gsap.Context;
let observer: IntersectionObserver | null = null;

const articleType = computed(() => {
  const siteOwnerName = siteConfigStore.siteConfig?.frontDesk?.siteOwner?.name;
  if (
    props.article.copyright_author &&
    props.article.copyright_author !== siteOwnerName
  ) {
    return "转载";
  }
  return "原创";
});

// 检查评论功能是否启用
const isCommentEnabled = computed(() => {
  return siteConfigStore.getSiteConfig?.comment?.enable === true;
});

// 检查波浪区域是否启用（默认为 true）
const isWavesEnabled = computed(() => {
  return siteConfigStore.siteConfig?.post?.waves?.enable !== false;
});

onMounted(() => {
  // 初始化封面图片懒加载
  observer = initLazyLoad(document, {
    selector: "img[data-src]",
    threshold: 0.1,
    rootMargin: "100px",
    loadedClass: "lazy-loaded",
    loadingClass: "lazy-loading"
  });

  ctx = gsap.context(() => {
    // 使用 ScrollTrigger.matchMedia 来创建响应式动画
    ScrollTrigger.matchMedia({
      // 桌面端视图
      "(min-width: 769px)": function () {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: ".post-header-container",
            start: "top top",
            end: "bottom top",
            scrub: true
          }
        });

        tl.to(".post-info", {
          scale: 0.8,
          y: 0,
          ease: "none"
        }).to(
          ".post-top-cover",
          {
            scale: 0.5,
            ease: "none"
          },
          "<"
        );
      },

      // 移动端视图
      "(max-width: 768px)": function () {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: ".post-header-container",
            start: "top top",
            end: "bottom top",
            scrub: true
          }
        });

        tl.to(".post-info", {
          scale: 1,
          y: 0,
          ease: "none",
          transformOrigin: "center top"
        }).to(
          ".post-top-cover",
          {
            scale: 1,
            ease: "none"
          },
          "<"
        );
      }
    });
  });
});

onUnmounted(() => {
  ctx.revert();
  destroyLazyLoad(observer);
});

const { isDark } = useDark();

const topCoverUrl = computed(() => {
  return props.article.top_img_url || articleStore.defaultCover;
});

const coverImageRef = ref<HTMLImageElement | null>(null);
const isImageLoaded = ref(false);

const handleImageLoad = () => {
  isImageLoaded.value = true;
};

// 监听文章变化，重置图片加载状态
watch(
  () => props.article.id,
  () => {
    isImageLoaded.value = false;
  }
);

const dynamicStyles = computed(() => {
  if (isDark.value) {
    return {
      "--primary-color":
        props.article.primary_color + "dd" || "var(--anzhiyu-main-op-deep)"
    };
  } else {
    return {
      "--primary-color": props.article.primary_color || "var(--anzhiyu-main)"
    };
  }
});

const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const goToCategory = (categoryName: string) => {
  router.push(`/categories/${categoryName}/`);
};

const goToTag = (tagName: string) => {
  router.push(`/tags/${tagName}/`);
};

// 滚动到评论区（带布局变动稳定器）
const scrollToComment = (event: Event) => {
  event.preventDefault();

  const commentSection = document.getElementById("post-comment");
  if (!commentSection) return;

  const headerHeight = 80;

  const computeTargetTop = () => {
    const elementPosition = commentSection.getBoundingClientRect().top;
    return elementPosition + window.pageYOffset - headerHeight;
  };

  const scrollToTop = (top: number, smooth = true) => {
    window.scrollTo({
      top,
      behavior: smooth ? "smooth" : "auto"
    });
  };

  // 第一次滚动
  scrollToTop(computeTargetTop(), true);

  // 稳定器：在图片懒加载和内容高度变化时，重复校正滚动位置
  const contentRoot =
    (document.querySelector(".post-content") as HTMLElement) || document.body;

  let lastResizeTime = Date.now();
  let settledTimer: number | null = null;
  const settleQuietMs = 300; // 多久没有尺寸变动认为稳定
  const maxDurationMs = 3000; // 最长纠正时长
  const startTime = Date.now();

  const reAlign = () => {
    // 使用 auto 避免叠加过多平滑动画
    scrollToTop(computeTargetTop(), false);
  };

  // 图片加载监听（包括懒加载的逐张加载）
  const images = Array.from(
    (contentRoot.querySelectorAll("img") as NodeListOf<HTMLImageElement>) || []
  );
  images.forEach(img => {
    if (!img.complete) {
      const handler = () => {
        lastResizeTime = Date.now();
        reAlign();
      };
      img.addEventListener("load", handler, { once: true });
    }
  });

  // 尺寸变化监听（应对段落折行、图片高度变化、懒加载切换等）
  let resizeObserver: ResizeObserver | null = null;
  if ("ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(() => {
      lastResizeTime = Date.now();
      reAlign();
      // 重新计时，直到稳定
      if (settledTimer) {
        window.clearTimeout(settledTimer);
      }
      settledTimer = window.setTimeout(() => {
        // 如果已超过最大时长或已稳定一段时间，结束观察
        if (Date.now() - startTime >= maxDurationMs) {
          cleanup();
          return;
        }
        // 若仍有变化，计时器会被上面回调重置；若无变化，则这里触发清理
        cleanup();
      }, settleQuietMs);
    });
    resizeObserver.observe(contentRoot);
  }

  // 兜底：到达最大时长后强制停止
  const hardStopTimer = window.setTimeout(() => {
    cleanup();
  }, maxDurationMs + 200);

  const cleanup = () => {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    if (settledTimer) {
      window.clearTimeout(settledTimer);
    }
    window.clearTimeout(hardStopTimer);
    // 最终再对齐一次，确保停在正确位置
    reAlign();
  };
};
</script>

<template>
  <div class="post-header-container" :style="dynamicStyles">
    <div class="post-info">
      <div class="post-firstinfo">
        <div class="meta-firstline-top">
          <a class="post-meta-original">{{ articleType }}</a>
          <span
            v-if="article.post_categories.length > 0"
            class="post-meta-categories"
          >
            <a
              :href="`/categories/${article.post_categories[0].name}/`"
              @click.prevent="goToCategory(article.post_categories[0].name)"
            >
              {{ article.post_categories[0].name }}
            </a>
          </span>
          <div v-if="article.post_tags.length" class="tag_share">
            <div class="post-meta__tag-list">
              <a
                v-for="tag in article.post_tags"
                :key="tag.id"
                class="post-meta__tags"
                :href="`/tags/${tag.name}/`"
                @click.prevent="goToTag(tag.name)"
              >
                <i class="anzhiyufont anzhiyu-icon-hashtag" />
                <span class="tags-name">{{ tag.name }}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
      <h1 class="post-title">{{ article.title }}</h1>
      <div class="post-meta">
        <div class="meta-firstline" />
        <div class="meta-secondline">
          <el-tooltip
            :content="'这篇文章有' + article.word_count + '字'"
            placement="top"
            :show-arrow="false"
          >
            <div>
              <span class="post-meta-wordcount">
                <i class="anzhiyufont anzhiyu-icon-file-word post-meta-icon" />
                <span>{{ article.word_count }}</span>
              </span>
            </div>
          </el-tooltip>

          <span class="post-meta-separator" />
          <el-tooltip
            :content="'预计阅读时长' + article.reading_time + '分钟'"
            placement="top"
            :show-arrow="false"
          >
            <div>
              <span class="post-meta-wordcount">
                <i class="anzhiyufont anzhiyu-icon-clock post-meta-icon" />
                <span>{{ article.reading_time }}分钟</span>
              </span>
            </div>
          </el-tooltip>

          <span class="post-meta-separator" />
          <el-tooltip
            content="文章发布日期"
            placement="top"
            :show-arrow="false"
          >
            <div>
              <span class="post-meta-date">
                <i
                  class="anzhiyufont anzhiyu-icon-calendar-days post-meta-icon"
                />
                <time :datetime="article.created_at">{{
                  formatDate(article.created_at)
                }}</time>
              </span>
            </div>
          </el-tooltip>

          <span class="post-meta-separator hidden-update-time" />
          <el-tooltip
            content="这篇文章更新于"
            placement="top"
            :show-arrow="false"
          >
            <div>
              <span class="post-meta-date hidden-update-time">
                <i class="anzhiyufont anzhiyu-icon-history post-meta-icon" />
                <time :datetime="article.updated_at">{{
                  formatDate(article.updated_at)
                }}</time>
              </span>
            </div>
          </el-tooltip>

          <span class="post-meta-separator" />
          <el-tooltip content="热度" placement="top" :show-arrow="false">
            <div>
              <span class="post-meta-viewcount">
                <i class="anzhiyufont anzhiyu-icon-fire post-meta-icon" />
                <span>{{ article.view_count }}</span>
              </span>
            </div>
          </el-tooltip>

          <span class="post-meta-separator" />
          <el-tooltip
            v-if="article.ip_location"
            content="作者IP属地"
            placement="top"
            :show-arrow="false"
          >
            <div>
              <span class="post-meta-position">
                <i class="anzhiyufont anzhiyu-icon-location-dot" />
                {{ article.ip_location }}
              </span>
            </div>
          </el-tooltip>

          <template v-if="isCommentEnabled">
            <span class="post-meta-separator" />
            <el-tooltip content="评论数" placement="top" :show-arrow="false">
              <div>
                <span class="post-meta-commentcount" @click="scrollToComment">
                  <i class="anzhiyufont anzhiyu-icon-comments post-meta-icon" />
                  <span>{{ article.comment_count || 0 }}</span>
                </span>
              </div>
            </el-tooltip>
          </template>
        </div>
      </div>
    </div>
    <div class="post-top-cover">
      <img
        ref="coverImageRef"
        :key="article.id || topCoverUrl"
        class="post-top-bg"
        :class="{ 'is-loaded': isImageLoaded }"
        :src="topCoverUrl"
        :alt="article.title"
        @load="handleImageLoad"
      />
    </div>
    <section v-if="isWavesEnabled" class="main-hero-waves-area waves-area">
      <svg
        class="waves-svg"
        xmlns="http://www.w3.org/2000/svg"
        xlink="http://www.w3.org/1999/xlink"
        viewBox="0 24 150 28"
        preserveAspectRatio="none"
        shape-rendering="auto"
      >
        <defs>
          <path
            id="gentle-wave"
            d="M-160 44c30 0 58-18 88-18s58 18 88 18 58-18 88-18 58 18 88 18v44h-352Z"
          />
        </defs>
        <g class="parallax">
          <use href="#gentle-wave" x="48" y="0" />
          <use href="#gentle-wave" x="48" y="3" />
          <use href="#gentle-wave" x="48" y="5" />
          <use href="#gentle-wave" x="48" y="7" />
        </g>
      </svg>
    </section>
    <!-- 当波浪区域关闭时，显示圆角过渡元素 -->
    <div v-if="!isWavesEnabled" class="post-radius-bottom" />
  </div>
</template>

<style lang="scss" scoped>
.post-header-container {
  position: relative;
  display: flex;
  justify-content: center;
  width: 100%;
  height: 30rem;
  min-height: 300px;
  overflow: hidden;
  color: var(--anzhiyu-white);

  &::before {
    position: absolute;
    top: 0;
    left: 0;
    display: block;
    width: 100%;
    height: 100%;
    content: "";
    background-color: var(--primary-color);
    opacity: 1;
    transition: 0s;
  }
}

.post-info {
  position: absolute;
  top: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  max-width: 1400px;
  height: 100%;
  padding: 0 3.75rem;
  margin: 0 auto;
  color: var(--anzhiyu-white);
  text-align: center;
  transform-origin: top left;
  animation: slide-in 0.6s 0s backwards;
}

.post-top-cover {
  position: relative;
  width: 70%;
  height: 100%;
  margin: 0 -20% 0 auto;
  margin-bottom: 0;
  overflow: hidden;
  filter: blur(30px);
  opacity: 0.5;
  transform: rotate(10deg) translateY(30%) scale(2) translateZ(0);
}

.post-top-cover .post-top-bg {
  width: 100%;
  min-width: 50vw;
  height: 100%;
  min-height: 25rem;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.5s ease-out;

  &:not([src]),
  &[src=""] {
    opacity: 0;
  }

  &.is-loaded {
    opacity: 0.8;
  }

  &::after {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    content: "";
    box-shadow: 110px -130px 300px 60px var(--anzhiyu-bar-background) inset;
  }
}

.post-firstinfo .meta-firstline-top {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 1rem;
}

.post-meta-original,
.post-meta-categories a {
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  font-size: 1rem;
  font-weight: 600;
  white-space: nowrap;
  background: var(--anzhiyu-white-op);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  transition: all 0.3s;

  &:hover {
    color: var(--anzhiyu-main);
    background: var(--anzhiyu-white);
  }
}

.tag_share .post-meta__tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag_share .post-meta__tag-list i.anzhiyu-icon-hashtag {
  font-size: 17px;
  opacity: 0.6;
}

.tag_share .post-meta__tag-list .tags-name {
  margin-left: 4px;
  font-size: 1rem;
  color: var(--anzhiyu-white);
  transition: color 0.3s;
}

.post-meta__tags {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 12px 0 8px;
  font-size: 1rem;
  white-space: nowrap;
  border-radius: 12px;
  opacity: 0.8;
  transition: all 0.3s;

  &:hover {
    color: var(--anzhiyu-white);
    background: var(--anzhiyu-white-op);
    opacity: 1;
  }
}

.post-title {
  margin: 0;
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  line-height: 1.2;
  text-align: left;
}

.post-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  font-size: 1rem;
  opacity: 0.9;
}

.post-meta .meta-firstline,
.post-meta .meta-secondline {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 0;
  align-items: center;
}

.post-meta-icon {
  margin-right: 0.4rem;
}

.post-meta-label {
  margin-right: 0.2rem;
}

.post-meta-separator {
  margin: 0 0.15rem;
}

.post-meta-date,
.post-meta-wordcount,
.post-meta-viewcount,
.post-meta-position,
.post-meta-commentcount {
  display: inline-flex;
  align-items: center;
  opacity: 0.6;
  transition: 0.3s;
  border-radius: 12px;
  padding: 2px 8px;
  cursor: default;
}

.post-meta-commentcount {
  cursor: pointer;
  font-weight: 800;

  &:hover {
    opacity: 1;
    background: var(--anzhiyu-white-op);
  }
}

.hidden-update-time {
  display: none !important;
}

.main-hero-waves-area {
  position: absolute;
  bottom: -11px;
  left: 0;
  z-index: 5;
  width: 100%;
  pointer-events: none;
}

.post-radius-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  z-index: 5;
  width: 100%;
  height: 16px;
  background-color: var(--anzhiyu-background);
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  pointer-events: none;
}

.waves-area .waves-svg {
  width: 100%;
  height: 3.75rem;
}

.parallax > use {
  animation: move-forever 25s cubic-bezier(0.55, 0.5, 0.45, 0.5) infinite;
  will-change: transform;
}

.parallax > use:nth-child(1) {
  fill: #f7f9febd;
  animation-duration: 7s;
  animation-delay: -2s;
}

.parallax > use:nth-child(2) {
  fill: #f7f9fe82;
  animation-duration: 10s;
  animation-delay: -3s;
}

.parallax > use:nth-child(3) {
  fill: #f7f9fe36;
  animation-duration: 13s;
  animation-delay: -4s;
}

.parallax > use:nth-child(4) {
  fill: #f7f9fe;
  animation-duration: 20s;
  animation-delay: -5s;
}

@keyframes move-forever {
  0% {
    transform: translate3d(-90px, 0, 0);
  }

  100% {
    transform: translate3d(85px, 0, 0);
  }
}

[data-theme="dark"] .parallax {
  & > use:nth-child(1) {
    fill: #18171dc8;
  }

  & > use:nth-child(2) {
    fill: #18171d80;
  }

  & > use:nth-child(3) {
    fill: #18171d3e;
  }

  & > use:nth-child(4) {
    fill: rgb(0 0 0 / 39%);
  }
}

@media (width <= 768px) {
  .main-hero-waves-area.waves-area {
    display: none;
    visibility: hidden;
  }

  .post-info {
    position: absolute;
    top: auto;
    bottom: 0;
    left: 0;
    gap: 0;
    align-items: center;
    justify-content: normal;
    height: fit-content;
    padding: 11rem 6% 1rem;
    background-image: linear-gradient(
      to bottom,
      var(--anzhiyu-none),
      var(--anzhiyu-main)
    );

    .tag_share {
      display: none;
    }

    .post-meta {
      align-items: center;
      margin-top: 1rem;
    }

    .post-meta .meta-firstline,
    .post-meta .meta-secondline {
      justify-content: center;
      font-size: 0.75rem;
    }
  }

  .post-top-cover {
    position: fixed;
    z-index: 1;
    width: 100%;
    height: 30rem;
    margin: 0 0 0 auto;
    filter: blur(0);
    opacity: 1;
    transform: rotate(0) translateY(0) scale(1);

    &::after {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 70%;
      content: "";
      box-shadow: 0 0 105px 99px var(--anzhiyu-main) inset;
    }

    .post-top-bg {
      height: 70%;
      min-height: 18.75rem;
      filter: none;
      border-radius: 0;
      opacity: 1;
    }
  }

  .post-header-container {
    z-index: 1;
    height: 30rem;
    background-color: var(--anzhiyu-main);

    &::before {
      display: none;
    }
  }
}
</style>
