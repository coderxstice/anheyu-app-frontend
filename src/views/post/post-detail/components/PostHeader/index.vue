<script setup lang="ts">
import { type PropType, computed, onMounted, onUnmounted } from "vue";
import type { Article } from "@/api/post/type";
import { useRouter } from "vue-router";
import { useArticleStore } from "@/store/modules/articleStore";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useDark } from "@pureadmin/utils";

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

onMounted(() => {
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
          scale: 0.5,
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
});

const { isDark } = useDark();

const topCoverUrl = computed(() => {
  return props.article.top_img_url || articleStore.defaultCover;
});

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
        <div class="meta-firstline">
          <span class="post-meta-date">
            <i class="anzhiyufont anzhiyu-icon-calendar-days post-meta-icon" />
            <span class="post-meta-label">发表于</span>
            <time :datetime="article.created_at">{{
              formatDate(article.created_at)
            }}</time>

            <span class="post-meta-separator" />
            <i class="anzhiyufont anzhiyu-icon-history post-meta-icon" />
            <span class="post-meta-label">更新于</span>
            <time :datetime="article.updated_at">{{
              formatDate(article.updated_at)
            }}</time>
          </span>
        </div>
        <div class="meta-secondline">
          <span class="post-meta-wordcount">
            <i class="anzhiyufont anzhiyu-icon-file-word post-meta-icon" />
            <span class="post-meta-label">字数总计:</span>
            <span>{{ article.word_count }}</span>
          </span>
          <span class="post-meta-separator" />
          <span class="post-meta-wordcount">
            <i class="anzhiyufont anzhiyu-icon-clock post-meta-icon" />
            <span class="post-meta-label">阅读时长:</span>
            <span>{{ article.reading_time }}分钟</span>
          </span>
          <span class="post-meta-separator" />
          <span class="post-meta-viewcount">
            <i class="anzhiyufont anzhiyu-icon-fw-eye post-meta-icon" />
            <span class="post-meta-label">阅读量:</span>
            <span>{{ article.view_count }}</span>
          </span>
          <span class="post-meta-separator" />
          <span v-if="article.ip_location" class="post-meta-position">
            <i class="anzhiyufont anzhiyu-icon-location-dot" />
            {{ article.ip_location }}
          </span>
          <span class="post-meta-separator" />
          <span class="post-meta-commentcount">
            <i class="anzhiyufont anzhiyu-icon-comments post-meta-icon" />
            <span class="post-meta-label">评论数:</span>
            <a href="#post-comment">{{ article.comment_count || 0 }}</a>
          </span>
        </div>
      </div>
    </div>
    <div class="post-top-cover">
      <img class="post-top-bg" :src="topCoverUrl" :alt="article.title" />
    </div>
    <section class="main-hero-waves-area waves-area">
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
  </div>
</template>

<style lang="scss" scoped>
.post-header-container {
  position: relative;
  width: 100%;
  height: 30rem;
  min-height: 300px;
  display: flex;
  color: var(--anzhiyu-white);
  overflow: hidden;
  justify-content: center;
  &::before {
    transition: 0s;
    height: 100%;
    background-color: var(--primary-color);
    opacity: 1;
    position: absolute;
    top: 0;
    left: 0;
    display: block;
    width: 100%;
    content: "";
  }
}

.post-info {
  height: 100%;
  width: 100%;
  text-align: center;
  gap: 16px;
  top: 0;
  display: flex;
  justify-content: center;
  position: absolute;
  padding: 0 3.75rem;
  margin: 0 auto;
  z-index: 10;
  color: var(--anzhiyu-white);
  max-width: 1400px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  animation: slide-in 0.6s 0s backwards;
  transform-origin: top left;
}

.post-top-cover {
  transform: rotate(10deg) translateY(30%) scale(2) translateZ(0);
  filter: blur(30px);
  opacity: 0.5;
  width: 70%;
  height: 100%;
  position: relative;
  margin: 0 -20% 0 auto;
  overflow: hidden;
  margin-bottom: 0;
}

.post-top-cover .post-top-bg {
  width: 100%;
  height: 100%;
  object-fit: cover;
  min-width: 50vw;
  min-height: 25rem;
  opacity: 0.8;
  transition: 0s;
  &::after {
    position: absolute;
    content: "";
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    box-shadow: 110px -130px 300px 60px var(--anzhiyu-bar-background) inset;
  }
}

.post-firstinfo .meta-firstline-top {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 1rem;
}

.post-meta-original,
.post-meta-categories a {
  display: flex;
  align-items: center;
  padding: 0 12px;
  height: 32px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  background: var(--anzhiyu-white-op);
  backdrop-filter: blur(10px);
  transition: all 0.3s;
  white-space: nowrap;
  &:hover {
    color: var(--anzhiyu-main);
    background: var(--anzhiyu-white);
  }
}

.tag_share .post-meta__tag-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag_share .post-meta__tag-list i.anzhiyu-icon-hashtag {
  opacity: 0.6;
  font-size: 17px;
}

.tag_share .post-meta__tag-list .tags-name {
  margin-left: 4px;
  color: var(--anzhiyu-white);
  font-size: 1rem;
  transition: color 0.3s;
}

.post-meta__tags {
  display: inline-flex;
  align-items: center;
  font-size: 1rem;
  opacity: 0.8;
  height: 32px;
  transition: all 0.3s;
  white-space: nowrap;
  border-radius: 12px;
  padding: 0 12px 0 8px;
  &:hover {
    color: var(--anzhiyu-white);
    opacity: 1;
    background: var(--anzhiyu-white-op);
  }
}

.post-title {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  margin: 0;
  text-align: left;
  line-height: 1.2;
}

.post-meta {
  margin-top: 1.5rem;
  font-size: 1rem;
  opacity: 0.9;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
}

.post-meta .meta-firstline,
.post-meta .meta-secondline {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem 0;
}

.post-meta-icon {
  margin-right: 0.4rem;
}

.post-meta-label {
  margin-right: 0.2rem;
}

.post-meta-separator {
  margin: 0 0.75rem;
}

.post-meta-date,
.post-meta-wordcount,
.post-meta-viewcount,
.post-meta-position,
.post-meta-commentcount {
  display: inline-flex;
  align-items: center;
}

.main-hero-waves-area {
  width: 100%;
  position: absolute;
  left: 0;
  bottom: -11px;
  z-index: 5;
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
  animation-delay: -2s;
  animation-duration: 7s;
  fill: #f7f9febd;
}

.parallax > use:nth-child(2) {
  animation-delay: -3s;
  animation-duration: 10s;
  fill: #f7f9fe82;
}

.parallax > use:nth-child(3) {
  animation-delay: -4s;
  animation-duration: 13s;
  fill: #f7f9fe36;
}

.parallax > use:nth-child(4) {
  animation-delay: -5s;
  animation-duration: 20s;
  fill: #f7f9fe;
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

@media (max-width: 768px) {
  .main-hero-waves-area.waves-area {
    display: none;
    visibility: hidden;
  }
  .post-info {
    padding: 11rem 6% 1rem;
    align-items: center;
    gap: 0;

    justify-content: normal;
    background-image: linear-gradient(
      to bottom,
      var(--anzhiyu-none),
      var(--anzhiyu-main)
    );
    height: fit-content;
    position: absolute;
    bottom: 0;
    left: 0;
    top: auto;
    align-items: center;

    .tag_share {
      display: none;
    }
    .post-meta {
      align-items: center;
      margin-top: 1rem;
    }
    .post-meta .meta-firstline,
    .post-meta .meta-secondline {
      font-size: 0.75rem;
      justify-content: center;
    }
  }
  .post-top-cover {
    transform: rotate(0) translateY(0) scale(1);
    filter: blur(0);
    width: 100%;
    position: fixed;
    height: 30rem;
    z-index: 1;
    margin: 0 0 0 auto;
    opacity: 1;
    &:after {
      box-shadow: 0 0 105px 99px var(--anzhiyu-main) inset;
      height: 70%;
      top: 0;
      left: 0;
      position: absolute;
      content: "";
      width: 100%;
    }

    .post-top-bg {
      min-height: 18.75rem;
      height: 70%;
      opacity: 1;
      filter: none;
      border-radius: 0;
    }
  }
  .post-header-container {
    height: 30rem;
    background-color: var(--anzhiyu-main);
    &::before {
      display: none;
    }
  }
}
</style>
