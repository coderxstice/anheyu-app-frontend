<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { useCommentStore } from "@/store/modules/commentStore";
import type { Comment } from "@/api/comment/type";
import { storeToRefs } from "pinia";
import { gsap } from "gsap";

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
let commentInterval: number | null = null;
let observer: IntersectionObserver | null = null;

const customEase = "cubic-bezier(0.42, 0, 0.3, 1.11)";

const onEnter = (el: Element, done: () => void) => {
  gsap.fromTo(
    el,
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration: 0.3, ease: customEase, onComplete: done }
  );
};

const onLeave = (el: Element, done: () => void) => {
  const htmlEl = el as HTMLElement;
  htmlEl.style.position = "absolute";
  htmlEl.style.width = `${htmlEl.offsetWidth}px`;
  gsap.to(el, {
    opacity: 0,
    y: 30,
    duration: 0.3,
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
  if (barrageList.value.length > 0) {
    commentInterval = window.setInterval(() => {
      if (!hoverOnBarrage.value) {
        popCommentBarrage();
      }
    }, props.barrageTime);
  }
};

watch(
  comments,
  newComments => {
    if (newComments && newComments.length > 0) {
      barrageList.value = flattenComments(newComments);
      commentIndex.value = 0;
      displayedBarrages.value = [];
      startBarrage();
    } else {
      barrageList.value = [];
      displayedBarrages.value = [];
      if (commentInterval) clearInterval(commentInterval);
    }
  },
  { immediate: true, deep: true }
);

const processCommentHtml = (html: string): string => {
  const container = document.createElement("div");
  container.innerHTML = html;
  container.querySelectorAll("pre, img:not(.tk-owo-emotion)").forEach(el => {
    const placeholder = el.tagName === "PRE" ? "【代码】" : "【图片】";
    el.outerHTML = placeholder;
  });
  return container.innerHTML;
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
          <a
            class="barrageTitle"
            :class="{ barrageBloggerTitle: item.is_admin_comment }"
            href="#post-comment"
          >
            {{ item.is_admin_comment ? "博主" : "热评" }}
          </a>
          <div class="barrageNick">{{ item.nickname }}</div>
          <img
            class="barrageAvatar"
            :src="`${props.gravatarUrl}avatar/${item.email_md5}?d=${props.defaultGravatarType}`"
          />
        </div>
        <a
          class="barrageContent"
          :href="`#comment-${item.id}`"
          v-html="processCommentHtml(item.content_html)"
        />
      </div>
    </TransitionGroup>
  </div>
</template>

<style lang="scss" scoped>
.comment-barrage {
  position: fixed;
  bottom: 0;
  right: 60px;
  padding: 0 0 20px 10px;
  z-index: 999;
  display: flex;
  flex-direction: column;
  justify-content: end;
  align-items: flex-end;
  transition: bottom 0.3s;
  pointer-events: none;
}
@media screen and (max-width: 768px) {
  .comment-barrage {
    display: none !important;
  }
}

.comment-barrage-item {
  min-width: 300px;
  max-width: 300px;
  width: fit-content;
  min-height: 80px;
  max-height: 150px;
  margin: 4px;
  padding: 8px 14px;
  border-radius: 8px;
  color: var(--anzhiyu-fontcolor);
  transition: 0.3s;
  display: flex;
  flex-direction: column;
  border: var(--style-border);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: blur(20px);
  transform: translateZ(0);
  box-shadow: var(--anzhiyu-shadow-border);
  pointer-events: auto;
  background: rgba(255, 255, 255, 0.85);
  :deep(blockquote) {
    border: var(--style-border-always);
    background-color: var(--anzhiyu-secondbg);
    color: var(--anzhiyu-secondtext);
    border-radius: 8px;
    margin: 1rem 0;
    padding: 0.5rem 0.8rem;
  }
  :deep(p) {
    margin: 0;
  }
}

[data-theme="dark"] .comment-barrage-item {
  background: rgba(30, 30, 30, 0.8);
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
  color: var(--anzhiyu-secondtext);
  cursor: pointer;
  line-height: 1;
  padding: 4px;
}
.comment-barrage-item .comment-barrage-close:hover {
  color: var(--anzhiyu-main);
}
.comment-barrage-item .barrageHead {
  height: 30px;
  padding: 0;
  line-height: 30px;
  font-size: 12px;
  border-bottom: var(--style-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 700;
  padding-bottom: 6px;
}
.comment-barrage-item .barrageHead .barrageTitle {
  color: var(--anzhiyu-card-bg);
  margin-right: 8px;
  background: var(--anzhiyu-fontcolor);
  line-height: 1;
  padding: 4px;
  border-radius: 4px;
  text-decoration: none;
}
.comment-barrage-item .barrageHead .barrageTitle.barrageBloggerTitle {
  background: var(--anzhiyu-orange);
}
.comment-barrage-item .barrageAvatar {
  width: 16px;
  height: 16px;
  margin: 0;
  margin-left: auto;
  margin-right: 8px;
  border-radius: 50%;
  background: var(--anzhiyu-secondbg);
}
.comment-barrage-item .barrageContent {
  font-size: 14px !important;
  font-weight: 400 !important;
  height: calc(100% - 30px);
  overflow: scroll;
  cursor: pointer;
  margin-top: 6px;
}
.comment-barrage-item .barrageContent::-webkit-scrollbar {
  height: 0;
  width: 4px;
}
.comment-barrage-item .barrageContent::-webkit-scrollbar-button {
  display: none;
}
.comment-barrage-item .barrageContent :deep(p) {
  margin: 0;
  padding: 0;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
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
  font-size: 14px !important;
  font-weight: 400 !important;
  margin: 8px 0 !important;
}
</style>
