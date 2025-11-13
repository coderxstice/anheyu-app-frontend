<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { useCommentStore } from "@/store/modules/commentStore";
import type { Comment } from "@/api/comment/type";
import { storeToRefs } from "pinia";
import { gsap } from "gsap";
import md5 from "blueimp-md5";

defineOptions({
  name: "CommentBarrage"
});

const props = withDefaults(
  defineProps<{
    gravatarUrl: string;
    defaultGravatarType: string;
    maxBarrage?: number;
    barrageTime?: number;
    observeTargetId?: string;
  }>(),
  {
    maxBarrage: 1,
    barrageTime: 5000,
    observeTargetId: "post-comment"
  }
);

const commentStore = useCommentStore();
const { comments } = storeToRefs(commentStore);

const barrageContainer = ref<HTMLElement | null>(null);
const hoverOnBarrage = ref(false);
const barrageList = ref<Comment[]>([]);
const displayedBarrages = ref<Comment[]>([]);
const commentIndex = ref(0);
const isFirstBarrage = ref(true);
let commentInterval: number | null = null;
let observer: IntersectionObserver | null = null;
let firstBarrageTimeout: number | null = null;

const customEase = "cubic-bezier(0.42, 0, 0.3, 1.11)";

const onEnter = (el: Element, done: () => void) => {
  // 第一个热评使用特殊的入场动画
  if (isFirstBarrage.value) {
    isFirstBarrage.value = false;
    gsap.fromTo(
      el,
      {
        opacity: 0,
        y: 50,
        scale: 0.8,
        rotationZ: -5
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        rotationZ: 0,
        duration: 0.6,
        ease: "back.out(1.7)",
        onComplete: done
      }
    );
  } else {
    // 后续热评使用普通动画
    gsap.fromTo(
      el,
      {
        opacity: 0,
        y: 30,
        scale: 1,
        rotationZ: 0
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        rotationZ: 0,
        duration: 0.4,
        ease: customEase,
        onComplete: done
      }
    );
  }
};

const onLeave = (el: Element, done: () => void) => {
  const htmlEl = el as HTMLElement;
  htmlEl.style.position = "absolute";
  htmlEl.style.width = `${htmlEl.offsetWidth}px`;
  gsap.to(el, {
    opacity: 0,
    y: 30,
    scale: 1,
    duration: 0.4,
    ease: customEase,
    onComplete: done
  });
};

const getCommentReplies = (item: Comment): Comment[] => {
  let list: Comment[] = [];
  if (item.content_html) {
    list.push(item);
  }
  if (item.children && item.children.length > 0) {
    for (const reply of item.children) {
      list.push(...getCommentReplies(reply));
    }
  }
  return list;
};

const flattenComments = (commentTree: Comment[]): Comment[] => {
  const flatList: Comment[] = [];
  for (const item of commentTree) {
    flatList.push(...getCommentReplies(item));
  }
  return flatList.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

const popCommentBarrage = () => {
  if (barrageList.value.length === 0) return;
  displayedBarrages.value.push(barrageList.value[commentIndex.value]);
  commentIndex.value = (commentIndex.value + 1) % barrageList.value.length;
  if (displayedBarrages.value.length > props.maxBarrage) {
    displayedBarrages.value.shift();
  }
};

const startBarrage = () => {
  if (commentInterval) clearInterval(commentInterval);
  if (firstBarrageTimeout) clearTimeout(firstBarrageTimeout);

  if (barrageList.value.length > 0) {
    // 第一个热评延迟1.5秒后出现
    firstBarrageTimeout = window.setTimeout(() => {
      if (!hoverOnBarrage.value) {
        popCommentBarrage();
      }
      // 然后启动定时器显示后续热评
      commentInterval = window.setInterval(() => {
        if (!hoverOnBarrage.value) {
          popCommentBarrage();
        }
      }, props.barrageTime);
    }, 1500);
  }
};

watch(
  comments,
  newComments => {
    if (newComments && newComments.length > 0) {
      barrageList.value = flattenComments(newComments);
      commentIndex.value = 0;
      displayedBarrages.value = [];
      isFirstBarrage.value = true; // 重置第一次动画标志
      startBarrage();
    } else {
      barrageList.value = [];
      displayedBarrages.value = [];
      if (commentInterval) clearInterval(commentInterval);
      if (firstBarrageTimeout) clearTimeout(firstBarrageTimeout);
    }
  },
  { immediate: true, deep: true }
);

const getAvatarSrc = (comment: Comment): string => {
  // 优先使用用户自定义头像
  if (comment.avatar_url) {
    return comment.avatar_url;
  }

  // 如果是匿名评论，使用匿名头像
  if (comment.is_anonymous) {
    return `${props.gravatarUrl}avatar/anonymous?d=mp&s=140&f=y`;
  }

  // 检查是否是 QQ 号
  const isQQ = /^[1-9]\d{4,10}$/.test(comment.nickname?.trim() || "");
  if (isQQ) {
    const qqEmailMd5 = md5(`${comment.nickname?.trim()}@qq.com`).toLowerCase();
    if (comment.email_md5?.toLowerCase() === qqEmailMd5) {
      return `https://thirdqq.qlogo.cn/g?b=sdk&nk=${comment.nickname.trim()}&s=140`;
    }
  }

  // 默认使用 Gravatar
  return `${props.gravatarUrl}avatar/${comment.email_md5}?d=${props.defaultGravatarType}`;
};

const processCommentHtml = (html: string): string => {
  // 使用正则表达式替换，避免 innerHTML 触发图片加载
  let processed = html;

  // 替换 <pre> 标签为【代码】（不包括其内容）
  processed = processed.replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, "【代码】");

  // 替换非表情的 <img> 标签为【图片】
  // 保留带有 tk-owo-emotion 类的表情图片
  processed = processed.replace(
    /<img(?![^>]*class=["'][^"']*tk-owo-emotion[^"']*["'])[^>]*>/gi,
    "【图片】"
  );

  return processed;
};

// 等待图片加载完成
const waitForImages = (callback: () => void, timeout = 3000) => {
  const images = document.querySelectorAll(
    "img[loading='lazy'], img:not([complete])"
  );
  let loadedCount = 0;
  const totalImages = images.length;

  if (totalImages === 0) {
    callback();
    return;
  }

  const checkComplete = () => {
    loadedCount++;
    if (loadedCount >= totalImages) {
      callback();
    }
  };

  const timeoutId = setTimeout(() => {
    callback();
  }, timeout);

  images.forEach(img => {
    if ((img as HTMLImageElement).complete) {
      checkComplete();
    } else {
      img.addEventListener("load", checkComplete, { once: true });
      img.addEventListener("error", checkComplete, { once: true });
    }
  });

  // 如果所有图片都已加载，清除超时
  if (loadedCount >= totalImages) {
    clearTimeout(timeoutId);
  }
};

// 滚动到评论区（带布局变动稳定器，兼容目标未渲染与图片懒加载）
const scrollToComment = (commentId?: string | number) => {
  const targetId = commentId ? `comment-${commentId}` : props.observeTargetId;

  // 动态头部偏移：优先读取目标或评论容器的 scroll-margin-top，兜底 80
  const getHeaderOffset = (el?: HTMLElement | null) => {
    let offset = 80;
    const candidate =
      el ||
      (document.getElementById(targetId) as HTMLElement | null) ||
      (document.getElementById(props.observeTargetId) as HTMLElement | null);
    if (candidate) {
      const styles = window.getComputedStyle(candidate);
      const smt = parseFloat((styles as any).scrollMarginTop || "0");
      if (!Number.isNaN(smt) && smt > 0) {
        offset = Math.max(offset, smt);
      }
    }
    return offset;
  };

  const getTargetElement = () =>
    (document.getElementById(targetId) as HTMLElement | null) ||
    (document.getElementById(props.observeTargetId) as HTMLElement | null);

  const computeTargetTop = () => {
    const el = getTargetElement();
    if (!el) return window.scrollY;
    const rect = el.getBoundingClientRect();
    return rect.top + window.pageYOffset - getHeaderOffset(el);
  };

  const scrollToTop = (top: number, smooth = true) => {
    window.scrollTo({
      top,
      behavior: smooth ? "smooth" : "auto"
    });
  };

  // 若目标元素不存在（评论尚未渲染），先滚到评论容器，并等待渲染完成
  let targetElement = getTargetElement();
  if (!targetElement) {
    const container = document.getElementById(props.observeTargetId);
    if (container) {
      container.scrollIntoView({ behavior: "smooth", block: "start" });
      const mo = new MutationObserver(() => {
        targetElement = getTargetElement();
        if (targetElement) {
          mo.disconnect();
          // 初次定位
          scrollToTop(computeTargetTop(), true);
          // 启动稳定器
          startStabilizer();
        }
      });
      mo.observe(container, { childList: true, subtree: true });
      // 兜底超时
      window.setTimeout(() => mo.disconnect(), 5000);
      return;
    }
  }

  // 初次滚动
  scrollToTop(computeTargetTop(), true);
  // 启动稳定器
  startStabilizer();

  function startStabilizer() {
    const contentRoot =
      (document.querySelector(".post-content") as HTMLElement) || document.body;
    const commentRoot =
      (document.getElementById(props.observeTargetId) as HTMLElement) ||
      document.body;

    let settledTimer: number | null = null;
    const settleQuietMs = 300;
    const maxDurationMs = 3000;
    const startTime = Date.now();

    const reAlign = () => {
      scrollToTop(computeTargetTop(), false);
    };

    // 图片加载监听（正文与评论区）
    const imgs = [
      ...Array.from(
        (contentRoot.querySelectorAll("img") as NodeListOf<HTMLImageElement>) ||
          []
      ),
      ...Array.from(
        (commentRoot.querySelectorAll("img") as NodeListOf<HTMLImageElement>) ||
          []
      )
    ];
    imgs.forEach(img => {
      if (!img.complete) {
        const handler = () => {
          reAlign();
        };
        img.addEventListener("load", handler, { once: true });
        img.addEventListener("error", handler, { once: true });
      }
    });

    // 尺寸变化监听（正文与评论区）
    let resizeObserver: ResizeObserver | null = null;
    if ("ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(() => {
        reAlign();
        if (settledTimer) {
          window.clearTimeout(settledTimer);
        }
        settledTimer = window.setTimeout(() => {
          if (Date.now() - startTime >= maxDurationMs) {
            cleanup();
            return;
          }
          cleanup();
        }, settleQuietMs);
      });
      resizeObserver.observe(contentRoot);
      if (commentRoot !== contentRoot) {
        resizeObserver.observe(commentRoot);
      }
    }

    const hardStopTimer = window.setTimeout(() => {
      cleanup();
    }, maxDurationMs + 300);

    const cleanup = () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      if (settledTimer) {
        window.clearTimeout(settledTimer);
      }
      window.clearTimeout(hardStopTimer);
      reAlign();
    };
  }
};

// 阻止默认锚点跳转
const handleClick = (event: Event, commentId?: string | number) => {
  event.preventDefault();
  scrollToComment(commentId);
};

onMounted(() => {
  nextTick(() => {
    const observeTarget = document.getElementById(props.observeTargetId);
    if (observeTarget && barrageContainer.value) {
      const observerCallback = (entries: IntersectionObserverEntry[]) => {
        entries.forEach(entry => {
          if (barrageContainer.value && document.body.clientWidth > 768) {
            barrageContainer.value.style.bottom = entry.isIntersecting
              ? `-100%`
              : "0px";
          }
        });
      };
      observer = new IntersectionObserver(observerCallback, { threshold: 0 });
      observer.observe(observeTarget);
    }
  });
});

onBeforeUnmount(() => {
  if (commentInterval) {
    window.clearInterval(commentInterval);
  }
  if (firstBarrageTimeout) {
    window.clearTimeout(firstBarrageTimeout);
  }
  if (observer) {
    observer.disconnect();
  }
});
</script>

<template>
  <div
    ref="barrageContainer"
    class="comment-barrage"
    @mouseenter="hoverOnBarrage = true"
    @mouseleave="hoverOnBarrage = false"
  >
    <TransitionGroup tag="div" @enter="onEnter" @leave="onLeave">
      <div
        v-for="item in displayedBarrages"
        :key="item.id"
        class="comment-barrage-item"
      >
        <div class="barrageHead">
          <span
            class="barrageTitle"
            :class="{ barrageBloggerTitle: item.is_admin_comment }"
          >
            {{ item.is_admin_comment ? "博主" : "热评" }}
          </span>
          <div class="barrageNick">{{ item.nickname }}</div>
          <img class="barrageAvatar" :src="getAvatarSrc(item)" />
        </div>
        <a
          class="barrageContent"
          :href="`#comment-${item.id}`"
          @click="e => handleClick(e, item.id)"
          v-html="processCommentHtml(item.content_html)"
        />
      </div>
    </TransitionGroup>
  </div>
</template>

<style lang="scss" scoped>
.comment-barrage {
  position: fixed;
  right: 60px;
  bottom: 0;
  z-index: 999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: end;
  padding: 0 0 20px 10px;
  pointer-events: none;
  transition: bottom 0.3s;
}

@media screen and (width <= 768px) {
  .comment-barrage {
    display: none !important;
  }
}

.comment-barrage-item {
  display: flex;
  flex-direction: column;
  width: fit-content;
  min-width: 300px;
  max-width: 300px;
  min-height: 80px;
  max-height: 150px;
  padding: 8px 14px;
  margin: 4px;
  color: var(--anzhiyu-fontcolor);
  pointer-events: auto;
  background: rgb(255 255 255 / 85%);
  backdrop-filter: blur(20px);
  backdrop-filter: saturate(180%) blur(20px);
  border: var(--style-border);
  border-radius: 8px;
  box-shadow: var(--anzhiyu-shadow-border);
  transition: 0.3s;
  transform: translateZ(0);

  :deep(blockquote) {
    padding: 0.5rem 0.8rem;
    margin: 1rem 0;
    color: var(--anzhiyu-secondtext);
    background-color: var(--anzhiyu-secondbg);
    border: var(--style-border-always);
    border-radius: 8px;
  }

  :deep(p) {
    margin: 0;
  }
}

[data-theme="dark"] .comment-barrage-item {
  background: rgb(30 30 30 / 80%);
}

.comment-barrage-item:hover {
  border: var(--style-border-hover);
  box-shadow: var(--anzhiyu-shadow-main);
}

.barrageContent {
  color: var(--anzhiyu-fontcolor);
  text-decoration: none;
}

.barrageContent:hover {
  color: var(--anzhiyu-main);
}

.comment-barrage-item .comment-barrage-close {
  padding: 4px;
  line-height: 1;
  color: var(--anzhiyu-secondtext);
  cursor: pointer;
}

.comment-barrage-item .comment-barrage-close:hover {
  color: var(--anzhiyu-main);
}

.comment-barrage-item .barrageHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 30px;
  padding: 0;
  padding-bottom: 6px;
  font-size: 12px;
  font-weight: 700;
  line-height: 30px;
  border-bottom: var(--style-border);
}

.comment-barrage-item .barrageHead .barrageTitle {
  padding: 4px;
  margin-right: 8px;
  line-height: 1;
  color: var(--anzhiyu-card-bg);
  text-decoration: none;
  background: var(--anzhiyu-fontcolor);
  border-radius: 4px;
}

.comment-barrage-item .barrageHead .barrageTitle.barrageBloggerTitle {
  background: var(--anzhiyu-orange);
}

.comment-barrage-item .barrageAvatar {
  width: 16px;
  height: 16px;
  margin: 0;
  margin-right: 8px;
  margin-left: auto;
  background: var(--anzhiyu-secondbg);
  border-radius: 50%;
}

.comment-barrage-item .barrageContent {
  height: calc(100% - 30px);
  margin-top: 6px;
  overflow: scroll;
  font-size: 14px !important;
  font-weight: 400 !important;
  cursor: pointer;
}

.comment-barrage-item .barrageContent::-webkit-scrollbar {
  width: 4px;
  height: 0;
}

.comment-barrage-item .barrageContent::-webkit-scrollbar-button {
  display: none;
}

.comment-barrage-item .barrageContent :deep(p) {
  display: -webkit-box;
  padding: 0;
  margin: 0;
  overflow: hidden;
  line-height: 1.3;
  text-overflow: ellipsis;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.comment-barrage-item .barrageContent :deep(blockquote p) {
  margin: 0;
}

.comment-barrage-item .barrageContent :deep(h1),
.comment-barrage-item .barrageContent :deep(h2),
.comment-barrage-item .barrageContent :deep(h3),
.comment-barrage-item .barrageContent :deep(h4) {
  margin: 8px 0 !important;
  font-size: 14px !important;
  font-weight: 400 !important;
}
</style>
