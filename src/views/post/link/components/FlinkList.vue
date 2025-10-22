<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from "vue";
import type { LinkItem } from "@/api/postLink/type";
import { initLazyLoad, destroyLazyLoad } from "@/utils/lazyload";

defineOptions({
  name: "FlinkList"
});

const props = defineProps<{
  links: LinkItem[];
}>();

// 容器引用
const flinkListRef = ref<HTMLElement | null>(null);

// Observer 实例
let observer: IntersectionObserver | null = null;

// 定时器引用，用于清理
let initTimer: number | null = null;

// 防抖计数器
let debounceTimer: number | null = null;

// 是否正在初始化
let isInitializing = false;

// 初始化懒加载
const initLazy = async () => {
  // 如果正在初始化，跳过
  if (isInitializing) {
    console.log("[FlinkList] ⚠️ 正在初始化中，跳过重复调用");
    return;
  }

  // 清除之前的定时器
  if (initTimer) {
    console.log("[FlinkList] 清除之前的定时器");
    clearTimeout(initTimer);
    initTimer = null;
  }

  console.log("[FlinkList] 🔄 开始初始化流程", {
    timestamp: new Date().toISOString(),
    hasContainer: !!flinkListRef.value,
    linksCount: props.links?.length || 0
  });

  // 等待Vue的DOM更新完成
  await nextTick();

  // 检查容器是否存在
  if (!flinkListRef.value) {
    console.warn("[FlinkList] ❌ 容器未找到");
    return;
  }

  const containerRect = flinkListRef.value.getBoundingClientRect();
  console.log("[FlinkList] 📦 容器信息:", {
    position: {
      top: containerRect.top,
      bottom: containerRect.bottom,
      left: containerRect.left,
      right: containerRect.right,
      width: containerRect.width,
      height: containerRect.height
    },
    visibility: {
      isInViewport:
        containerRect.top < window.innerHeight && containerRect.bottom > 0,
      distanceFromViewport: Math.round(containerRect.top - window.innerHeight)
    },
    scrollInfo: {
      scrollY: window.scrollY,
      viewportHeight: window.innerHeight
    },
    childrenCount: flinkListRef.value.children.length
  });

  isInitializing = true;

  // 额外延迟以等待TransitionGroup的enter动画完成
  initTimer = window.setTimeout(() => {
    if (!flinkListRef.value) {
      console.warn("[FlinkList] ❌ 定时器回调中容器已丢失");
      isInitializing = false;
      return;
    }

    console.log("[FlinkList] ⚡ 初始化懒加载 (延迟300ms后)");

    // 清理旧的observer
    if (observer) {
      console.log("[FlinkList] 🧹 销毁旧的observer");
      destroyLazyLoad(observer);
      observer = null;
    }

    // 在容器内查找图片元素
    const images = flinkListRef.value.querySelectorAll("img[data-src]");
    console.log(`[FlinkList] 🖼️  找到 ${images.length} 个待加载图片`);

    // 检查是否有图片已经有src但还有data-src
    const loadedImages = flinkListRef.value.querySelectorAll(
      "img.flink-avatar[src]:not([src=''])"
    );
    const imagesWithoutDataSrc = flinkListRef.value.querySelectorAll(
      "img.flink-avatar:not([data-src])"
    );
    console.log(`[FlinkList] 📊 图片状态统计:`, {
      withDataSrc: images.length,
      withSrc: loadedImages.length,
      withoutDataSrc: imagesWithoutDataSrc.length,
      total: flinkListRef.value.querySelectorAll("img.flink-avatar").length
    });

    if (images.length > 0) {
      // 打印每个图片的详细信息
      Array.from(images).forEach((img, index) => {
        const htmlImg = img as HTMLImageElement;
        const rect = htmlImg.getBoundingClientRect();
        console.log(`[FlinkList] 图片[${index + 1}/${images.length}] 详情:`, {
          alt: htmlImg.alt,
          dataSrc: htmlImg.dataset.src,
          currentSrc: htmlImg.src,
          position: {
            top: Math.round(rect.top),
            bottom: Math.round(rect.bottom),
            height: Math.round(rect.height)
          },
          visibility: {
            isInViewport: rect.top < window.innerHeight && rect.bottom > 0,
            distanceFromViewport: Math.round(rect.top - window.innerHeight)
          },
          classList: Array.from(htmlImg.classList)
        });
      });

      // 创建新的observer，使用容器作为根元素
      console.log("[FlinkList] 🔭 创建新的IntersectionObserver");
      observer = initLazyLoad(flinkListRef.value as unknown as Document, {
        threshold: 0.1,
        rootMargin: "100px",
        selector: "img[data-src]",
        loadedClass: "lazy-loaded",
        loadingClass: "lazy-loading"
      });
      console.log("[FlinkList] ✅ Observer创建完成", {
        observerExists: !!observer
      });
    } else {
      console.warn("[FlinkList] ⚠️ 未找到需要懒加载的图片");
    }

    isInitializing = false;
    initTimer = null;
    console.log("[FlinkList] ✅ 初始化流程完成");
  }, 300);
};

// 防抖的初始化函数
const debouncedInitLazy = () => {
  if (debounceTimer) {
    console.log("[FlinkList] ⏱️  取消之前的防抖定时器");
    clearTimeout(debounceTimer);
  }

  console.log("[FlinkList] ⏱️  设置防抖定时器 (100ms)");
  debounceTimer = window.setTimeout(() => {
    console.log("[FlinkList] ⏱️  防抖定时器触发");
    initLazy();
    debounceTimer = null;
  }, 100);
};

// TransitionGroup 的 after-enter 事件处理
const handleAfterEnter = () => {
  console.log("[FlinkList] 🎬 TransitionGroup after-enter 事件触发");
  // 当有新元素进入完成后，重新扫描懒加载图片
  nextTick(() => {
    if (!flinkListRef.value) {
      console.warn("[FlinkList] ⚠️ after-enter: 容器不存在");
      return;
    }

    const newImages = flinkListRef.value.querySelectorAll("img[data-src]");
    console.log(`[FlinkList] 🔍 after-enter 检测图片:`, {
      hasContainer: !!flinkListRef.value,
      hasObserver: !!observer,
      isInitializing: isInitializing,
      newImagesCount: newImages.length,
      timestamp: new Date().toISOString()
    });

    // 只要有新图片需要加载，就触发初始化（无论 observer 是否存在）
    if (newImages.length > 0) {
      // 如果正在初始化中，取消当前定时器
      if (isInitializing && initTimer) {
        console.log(
          `[FlinkList] ⚡ after-enter 检测到正在初始化，取消延迟定时器`
        );
        clearTimeout(initTimer);
        initTimer = null;
        isInitializing = false;
      }

      // after-enter 事件触发时，动画已经完成，使用更短的延迟（50ms）
      console.log(
        `[FlinkList] 🚀 after-enter 触发快速懒加载初始化（检测到 ${newImages.length} 个图片，延迟50ms）`
      );

      // 清除防抖定时器
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // 使用短延迟直接初始化
      debounceTimer = window.setTimeout(() => {
        console.log("[FlinkList] ⏱️ after-enter 快速定时器触发");
        initLazy();
        debounceTimer = null;
      }, 50);
    } else {
      console.log("[FlinkList] ℹ️ after-enter: 没有需要懒加载的图片");
    }
  });
};

// 组件挂载后初始化
onMounted(() => {
  console.log("[FlinkList] 🎉 组件已挂载", {
    linksCount: props.links?.length || 0,
    timestamp: new Date().toISOString(),
    scrollY: window.scrollY,
    viewportHeight: window.innerHeight
  });
  initLazy();
});

// 监听links变化，使用防抖的重新初始化
watch(
  () => props.links,
  (newLinks, oldLinks) => {
    console.log("[FlinkList] 📝 友链列表变化", {
      oldCount: oldLinks?.length || 0,
      newCount: newLinks?.length || 0,
      timestamp: new Date().toISOString()
    });
    debouncedInitLazy();
  }
);

// 组件卸载时清理
onUnmounted(() => {
  // 清理定时器
  if (initTimer) {
    clearTimeout(initTimer);
    initTimer = null;
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  // 清理observer
  destroyLazyLoad(observer);
  observer = null;
});
</script>

<template>
  <div ref="flinkListRef" class="flink-list">
    <TransitionGroup name="flink-item" @after-enter="handleAfterEnter">
      <div v-for="link in links" :key="link.id" class="flink-list-item">
        <template v-if="link.tag">
          <span class="link-tag" :style="{ background: link.tag.color }">
            {{ link.tag.name }}
            <i class="light" />
          </span>
        </template>

        <a
          class="cf-friends-link"
          :href="link.url"
          rel="external nofollow"
          :title="link.name"
          target="_blank"
        >
          <img
            class="flink-avatar lazy-loading"
            :data-src="link.logo"
            :alt="link.name"
          />
          <div class="flink-item-info">
            <span class="flink-item-name">{{ link.name }}</span>
            <span class="flink-item-desc" :title="link.description">{{
              link.description
            }}</span>
          </div>
        </a>
      </div>
    </TransitionGroup>
  </div>
</template>

<style lang="scss" scoped>
.flink-list {
  padding: 0;
  margin: 0.625rem -6px 1.25rem;
  overflow: hidden;
  text-align: center;
}

// TransitionGroup 动画
.flink-item-enter-active {
  transition: all 0.5s ease;
}

.flink-item-leave-active {
  transition: all 0.3s ease;
}

.flink-item-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.flink-item-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.flink-item-move {
  transition: transform 0.5s ease;
}

.flink-list-item {
  position: relative;
  display: flex;
  float: left;
  width: calc(20% - 12px);
  height: 90px;
  margin: 6px;
  overflow: hidden;
  line-height: 17px;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border-always);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-border);
  transition: 0.3s ease-in-out;
  transform: translateZ(0);

  &:hover {
    background: var(--anzhiyu-lighttext);
    border: var(--style-border-hover);
    box-shadow: var(--anzhiyu-shadow-main);
    transform: scale(1.02);

    .link-tag {
      left: -70px;
    }

    .cf-friends-link {
      .flink-avatar {
        width: 0;
        min-width: 0;
        height: 0;
        min-height: 0;
        margin: 5px;
        opacity: 0;
        transition: 0.6s;
      }

      .flink-item-info {
        min-width: calc(100% - 20px);

        .flink-item-name {
          color: var(--anzhiyu-white);
        }

        .flink-item-desc {
          width: 100%;
          overflow: hidden;
          color: var(--anzhiyu-white);
        }
      }
    }
  }

  .link-tag {
    position: absolute;
    top: -1px;
    left: 0;
    z-index: 1;
    padding: 4px 8px;
    overflow: hidden;
    font-size: 0.6rem;
    color: var(--anzhiyu-white);
    background-color: var(--anzhiyu-blue);
    border-radius: 12px 0;
    box-shadow: var(--anzhiyu-shadow-blue);
    transition: 0.3s;
  }

  .cf-friends-link {
    display: flex;
    align-items: center;
    width: 100%;
    height: 100%;
    padding: 0 4px;
    font-weight: 700;
    color: var(--anzhiyu-fontcolor);
    text-decoration: none;
    border-color: initial;
    border-style: none;
    border-width: initial;
    border-radius: 4px 4px 0 0;
    border-image: initial;

    .flink-avatar {
      float: left;
      width: 60px;
      min-width: 60px;
      height: 60px;
      min-height: 60px;
      margin: 15px 20px 15px 15px;
      object-fit: cover;
      background: var(--anzhiyu-background);
      border-radius: 32px;
      transition: 0.3s;

      // CSS 图片懒加载优化
      &[data-src] {
        background: var(--anzhiyu-secondbg);
        opacity: 0;
      }

      &.lazy-loaded {
        opacity: 1;
        animation: imageFadeIn 0.4s ease-out forwards;
      }
    }

    .flink-item-info {
      display: flex;
      flex-direction: column;
      justify-content: center;
      width: calc(100% - 90px);
      height: fit-content;

      .flink-item-name {
        display: block;
        max-width: calc(100% - 12px);
        padding: 0 10px 0 0;
        overflow: hidden;
        font-size: 19px;
        font-weight: 700;
        line-height: 20px;
        color: var(--anzhiyu-fontcolor);
        text-align: left;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .flink-item-desc {
        height: 40px;
        padding: 5px 10px 16px 0;
        overflow: hidden;
        font-size: 0.93rem;
        color: var(--anzhiyu-fontcolor);
        text-align: left;
        text-overflow: ellipsis;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        white-space: normal;
        opacity: 0.7;
        -webkit-box-orient: vertical;
      }
    }
  }

  .light {
    position: absolute;
    top: 0;
    width: 100px;
    height: 50px;
    cursor: pointer;
    background-image: -webkit-linear-gradient(
      0deg,
      rgba(255, 255, 255, 0),
      rgba(255, 255, 255, 0.5),
      rgba(255, 255, 255, 0)
    );
    animation: 4s ease 0s infinite normal both running light_tag;
  }
}

// 移动端适配
@media screen and (max-width: 768px) {
  .flink-list {
    margin: 0.625rem -4px 1.25rem;
  }

  .flink-list-item {
    width: calc(50% - 8px);
    height: 80px;
    margin: 4px;

    .cf-friends-link {
      padding: 0 2px;

      .flink-avatar {
        width: 50px;
        min-width: 50px;
        height: 50px;
        min-height: 50px;
        margin: 15px 12px 15px 10px;
        margin-left: 30px;
      }

      .flink-item-info {
        width: calc(100% - 72px);
      }
    }

    &:hover {
      .cf-friends-link {
        .flink-item-info {
          min-width: calc(100% - 16px);
        }
      }
    }
  }
}

@media screen and (max-width: 480px) {
  .flink-list {
    margin: 0.625rem -2px 1.25rem;
  }

  .flink-list-item {
    width: calc(100% - 4px);
    margin: 2px;

    &:hover {
      .cf-friends-link {
        .flink-avatar {
          margin: 10px 8px 10px 6px;
        }

        .flink-item-info {
          min-width: calc(100% - 12px);
        }
      }
    }
  }

  .link-tag {
    padding: 3px 6px;
    font-size: 0.5rem;
  }
}

// 图片淡入动画
@keyframes imageFadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
</style>
