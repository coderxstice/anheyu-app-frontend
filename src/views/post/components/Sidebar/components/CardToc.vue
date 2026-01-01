<script setup lang="ts">
import {
  ref,
  watch,
  inject,
  onMounted,
  onUnmounted,
  nextTick,
  computed
} from "vue";
import type { Ref } from "vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";

interface TocItem {
  id: string; // 原始 HTML 中的 ID，用于滚动定位
  uniqueId: string; // 唯一标识符，用于 Vue key 和激活状态比较
  text: string;
  level: number;
  index: number; // 在原始数组中的索引，用于定位 DOM 元素
}

defineOptions({
  name: "CardToc"
});

const siteConfigStore = useSiteConfigStore();
const allSpyIds = inject<Ref<string[]>>("allSpyIds", ref([]));
const updateHeadingTocItems = inject<(items: TocItem[]) => void>(
  "updateHeadingTocItems",
  () => {}
);

const tocRef = ref<HTMLElement | null>(null);
const indicatorRef = ref<HTMLElement | null>(null);

const articleContentHtml = inject<Ref<string | undefined>>(
  "articleContentHtml",
  ref(undefined)
);
const tocItems = ref<TocItem[]>([]);
const activeTocId = ref<string | null>(null);

const isClickScrolling = ref(false);
let scrollTimer: number | null = null;
let hashUpdateTimer: number | null = null;
let headingElements: HTMLElement[] = [];
let rafId: number | null = null;

// 获取目录折叠模式配置
const tocCollapseMode = computed(() => {
  const config = siteConfigStore.siteConfig?.sidebar?.toc?.collapseMode;
  return config === "true" || config === true;
});

// 获取目录Hash更新模式配置
// "replace" - 使用 replaceState 更新Hash（默认）
// "none" - 不更新Hash
const tocHashUpdateMode = computed(() => {
  const config = siteConfigStore.siteConfig?.post?.toc?.hashUpdateMode;
  return config || "replace";
});

// 计算可见的目录项（折叠模式下）
const visibleTocItems = computed(() => {
  if (!tocCollapseMode.value || tocItems.value.length === 0) {
    return tocItems.value;
  }

  const items = tocItems.value;
  const activeUniqueId = activeTocId.value;
  const visibleItems: TocItem[] = [];

  // 找到当前激活项的索引（使用 uniqueId 进行匹配）
  let activeIndex = -1;
  if (activeUniqueId) {
    activeIndex = items.findIndex(item => item.uniqueId === activeUniqueId);
  }

  // 获取最小级别（通常是H2）
  const minLevel = Math.min(...items.map(item => item.level));

  // 构建可见项列表
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // 1. 顶级标题（最小级别）总是显示
    if (item.level === minLevel) {
      visibleItems.push(item);
      continue;
    }

    // 如果没有激活项，只显示顶级标题
    if (activeIndex < 0) {
      continue;
    }

    // 2. 检查是否是当前激活项的祖先
    const isAncestor = isAncestorOf(items, i, activeIndex);
    if (isAncestor) {
      visibleItems.push(item);
      continue;
    }

    // 3. 检查是否是当前激活项的直接子标题
    const isDirectChild = isDirectChildOf(items, activeIndex, i);
    if (isDirectChild) {
      visibleItems.push(item);
      continue;
    }

    // 4. 如果当前项是激活项本身
    if (i === activeIndex) {
      visibleItems.push(item);
      continue;
    }

    // 5. 检查是否是当前激活项的兄弟节点（同一父级下的同级标题）
    const isSibling = isSiblingOf(items, activeIndex, i);
    if (isSibling) {
      visibleItems.push(item);
      continue;
    }
  }

  return visibleItems;
});

// 判断 ancestorIndex 是否是 targetIndex 的祖先
function isAncestorOf(
  items: TocItem[],
  ancestorIndex: number,
  targetIndex: number
): boolean {
  if (ancestorIndex >= targetIndex) return false;

  const ancestor = items[ancestorIndex];
  const target = items[targetIndex];

  // 祖先的级别必须小于目标的级别
  if (ancestor.level >= target.level) return false;

  // 检查在 ancestorIndex 和 targetIndex 之间是否有更高或同级的标题
  for (let i = ancestorIndex + 1; i < targetIndex; i++) {
    if (items[i].level <= ancestor.level) {
      return false;
    }
  }

  return true;
}

// 判断 childIndex 是否是 parentIndex 的直接子标题
function isDirectChildOf(
  items: TocItem[],
  parentIndex: number,
  childIndex: number
): boolean {
  if (parentIndex >= childIndex) return false;

  const parent = items[parentIndex];
  const child = items[childIndex];

  // 子标题的级别必须比父标题大1级
  if (child.level !== parent.level + 1) return false;

  // 检查在 parentIndex 和 childIndex 之间是否有同级或更高级的标题
  for (let i = parentIndex + 1; i < childIndex; i++) {
    if (items[i].level <= parent.level) {
      return false;
    }
    // 如果有同级的子标题，则 childIndex 不是直接子标题
    if (items[i].level === child.level) {
      return false;
    }
  }

  return true;
}

// 判断两个项是否是兄弟节点
function isSiblingOf(
  items: TocItem[],
  index1: number,
  index2: number
): boolean {
  const item1 = items[index1];
  const item2 = items[index2];

  // 必须是同一级别
  if (item1.level !== item2.level) return false;

  // 找到它们的共同父级
  const minIndex = Math.min(index1, index2);
  const maxIndex = Math.max(index1, index2);

  // 检查在两者之间是否有更高级的标题（这意味着它们不是同一父级下的）
  for (let i = minIndex + 1; i < maxIndex; i++) {
    if (items[i].level < item1.level) {
      return false;
    }
  }

  return true;
}

const scrollToHeading = (event: MouseEvent, item: TocItem) => {
  event.preventDefault();
  activeTocId.value = item.uniqueId;

  // 根据配置决定是否更新URL Hash
  if (tocHashUpdateMode.value !== "none") {
    history.replaceState(history.state, "", `#${item.id}`);
  }

  isClickScrolling.value = true;

  // 使用 index 找到正确的 DOM 元素（处理重复 ID 的情况）
  const headingElement = getHeadingElementByIndex(item.index);
  if (headingElement) {
    const rect = headingElement.getBoundingClientRect();
    const absoluteTop = rect.top + window.scrollY;
    const top = absoluteTop - 80;
    window.scrollTo({
      top: top,
      behavior: "smooth"
    });
  }
};

// 根据索引获取标题元素
const getHeadingElementByIndex = (index: number): HTMLElement | null => {
  if (headingElements.length > 0) {
    return headingElements[index] || null;
  }
  const headingSelector = "h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]";
  const contentEl = document.querySelector(".post-content");
  if (!contentEl) {
    const allHeadings = document.querySelectorAll(headingSelector);
    return allHeadings[index] as HTMLElement | null;
  }
  const headings = contentEl.querySelectorAll(headingSelector);
  return headings[index] as HTMLElement | null;
};

// 初始化标题元素引用
const initHeadingElements = () => {
  // 获取标题元素 - 选择所有 h1-h6，不要求有 id
  const headingSelector = "h1, h2, h3, h4, h5, h6";
  const contentEl = document.querySelector(".post-content");
  const allHeadings = Array.from(
    (contentEl || document).querySelectorAll(headingSelector)
  );

  // 过滤掉空标题，只保留有文本内容的
  headingElements = allHeadings.filter(el =>
    el.textContent?.trim()
  ) as HTMLElement[];

  if (headingElements.length === 0) return;

  // 为没有 id 的标题动态添加 id
  headingElements.forEach((el, index) => {
    if (!el.id) {
      const text = el.textContent?.trim().replace(/\s+/g, "-").toLowerCase();
      el.id = text || `heading-${index}`;
    }
  });

  // 初始化时计算一次激活状态
  updateActiveHeading();
};

// 使用 requestAnimationFrame 节流的滚动处理
const onScroll = () => {
  if (rafId !== null) return;

  rafId = requestAnimationFrame(() => {
    rafId = null;

    if (isClickScrolling.value) return;

    updateActiveHeading();
  });
};

// 更新激活的标题
const updateActiveHeading = () => {
  if (headingElements.length === 0) return;

  let activeIndex = -1;
  const headerOffset = 100; // header 高度 + 一些余量

  // 找到当前滚动位置下最近的标题
  for (let i = 0; i < headingElements.length; i++) {
    const rect = headingElements[i].getBoundingClientRect();
    if (rect.top <= headerOffset) {
      activeIndex = i;
    } else {
      break;
    }
  }

  // 如果没有找到（页面顶部），激活第一个
  if (activeIndex === -1 && headingElements.length > 0) {
    activeIndex = 0;
  }

  if (activeIndex >= 0 && tocItems.value[activeIndex]) {
    setActiveHeading(activeIndex);
  }
};

// 设置激活的标题
const setActiveHeading = (index: number) => {
  const item = tocItems.value[index];
  if (!item) return;

  const newActiveUniqueId = item.uniqueId;

  if (activeTocId.value !== newActiveUniqueId) {
    activeTocId.value = newActiveUniqueId;

    // 延迟更新 URL hash（防抖 500ms）
    if (tocHashUpdateMode.value !== "none") {
      const newOriginalId = item.id;
      if (hashUpdateTimer) clearTimeout(hashUpdateTimer);
      hashUpdateTimer = window.setTimeout(() => {
        history.replaceState(history.state, "", `#${newOriginalId}`);
      }, 500);
    }
  }
};

const parseHeadings = () => {
  if (!articleContentHtml?.value || typeof document === "undefined") {
    tocItems.value = [];
    return;
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(articleContentHtml.value, "text/html");
  const headings = doc.querySelectorAll("h1, h2, h3, h4, h5, h6");
  const newTocItems: TocItem[] = [];

  // 用于跟踪重复 ID 的计数器
  const idCountMap = new Map<string, number>();

  let index = 0;
  headings.forEach(heading => {
    if (heading.id) {
      const originalId = heading.id;

      // 计算这个 ID 出现的次数
      const count = idCountMap.get(originalId) || 0;
      idCountMap.set(originalId, count + 1);

      // 生成唯一标识符：如果是第一次出现用原始ID，否则添加数字后缀
      const uniqueId = count === 0 ? originalId : `${originalId}-${count}`;

      newTocItems.push({
        id: originalId,
        uniqueId: uniqueId,
        text: heading.textContent || "",
        level: parseInt(heading.tagName.substring(1), 10),
        index: index
      });
      index++;
    }
  });
  tocItems.value = newTocItems;
  if (updateHeadingTocItems) {
    updateHeadingTocItems(newTocItems);
  }
};

// 滚动结束检测
const onScrollEnd = () => {
  if (scrollTimer) clearTimeout(scrollTimer);
  scrollTimer = window.setTimeout(() => {
    isClickScrolling.value = false;
  }, 150);
};

const updateIndicator = () => {
  if (!tocRef.value || !indicatorRef.value) return;
  const activeLink = tocRef.value.querySelector("a.active") as HTMLElement;
  if (activeLink) {
    const indicatorHeight = activeLink.offsetHeight / 2;
    // 计算垂直居中的偏移量
    const topOffset =
      activeLink.offsetTop + (activeLink.offsetHeight - indicatorHeight) / 2;
    indicatorRef.value.style.top = `${topOffset}px`;
    indicatorRef.value.style.height = `${indicatorHeight}px`;
    indicatorRef.value.style.opacity = "1";
  } else {
    indicatorRef.value.style.opacity = "0";
  }
};

const scrollActiveIntoView = () => {
  const tocElement = tocRef.value;
  if (!tocElement) return;

  const container = tocElement.parentElement; // .toc-content
  const activeLink = tocElement.querySelector("a.active") as HTMLElement | null;

  if (!container || !activeLink) return;

  const linkTop = activeLink.offsetTop;
  const linkBottom = linkTop + activeLink.offsetHeight;
  const visibleTop = container.scrollTop;
  const visibleBottom = visibleTop + container.clientHeight;
  const padding = 12; // 少量内边距，避免贴边

  if (linkTop < visibleTop + padding) {
    container.scrollTo({
      top: Math.max(linkTop - container.clientHeight * 0.3, 0),
      behavior: "smooth"
    });
  } else if (linkBottom > visibleBottom - padding) {
    container.scrollTo({
      top: linkBottom - container.clientHeight * 0.7,
      behavior: "smooth"
    });
  }
};

watch(
  articleContentHtml,
  () => {
    nextTick(() => {
      parseHeadings();
      // 延迟初始化标题元素，确保 DOM 已渲染
      setTimeout(initHeadingElements, 300);
    });
  },
  { immediate: true, deep: true }
);

watch(activeTocId, () => {
  nextTick(() => {
    updateIndicator();
    scrollActiveIntoView();
  });
});

// 当可见项变化时也更新指示器
watch(visibleTocItems, () => {
  nextTick(() => {
    updateIndicator();
    scrollActiveIntoView();
  });
});

onMounted(() => {
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("scroll", onScrollEnd, { passive: true });

  nextTick(() => {
    updateIndicator();
    scrollActiveIntoView();
  });
});

onUnmounted(() => {
  window.removeEventListener("scroll", onScroll);
  window.removeEventListener("scroll", onScrollEnd);
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
  }
  if (scrollTimer) clearTimeout(scrollTimer);
  if (hashUpdateTimer) clearTimeout(hashUpdateTimer);
});

defineExpose({
  scrollToHeading
});
</script>

<template>
  <div v-if="tocItems.length > 0" id="card-toc" class="card-widget">
    <div class="item-headline">
      <i class="anzhiyufont anzhiyu-icon-bars" />
      <span>目录</span>
    </div>
    <div class="toc-content">
      <ol ref="tocRef" class="toc">
        <TransitionGroup name="toc-item">
          <li
            v-for="item in visibleTocItems"
            :key="item.uniqueId"
            class="toc-item"
            :class="`toc-level-${item.level}`"
          >
            <a
              :href="`#${item.id}`"
              class="toc-link"
              :class="{ active: activeTocId === item.uniqueId }"
              @click="scrollToHeading($event, item)"
            >
              <span class="toc-text">{{ item.text }}</span>
            </a>
          </li>
        </TransitionGroup>
        <div ref="indicatorRef" class="toc-indicator" />
      </ol>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.card-widget {
  padding: 1rem;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 12px;
}

.item-headline {
  display: flex;
  align-items: center;
  padding-left: 0.25rem;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--anzhiyu-fontcolor);

  i {
    margin-right: 0.5rem;
    font-size: 1.2rem;
  }
}

.toc-content {
  max-height: calc(100vh - 200px);
  overflow: auto;

  &::-webkit-scrollbar {
    width: 10px;
    height: 6px;
    border-radius: 8px;
  }

  &:hover {
    .toc-link {
      filter: blur(0);
      opacity: 1;
    }
  }
}

.toc {
  position: relative;
  z-index: 1;
  padding: 0;
  margin: 0;
  list-style: none;
}

.toc-link {
  position: relative;
  display: flex;
  align-items: center;
  padding: 8px 8px 8px 12px;
  overflow: hidden;
  line-height: 1.5;
  color: var(--anzhiyu-secondtext);
  border-radius: 8px;
  transition:
    color 0.2s ease-out,
    background-color 0.2s ease-out,
    font-size 0.2s ease-out,
    filter 0.2s ease-out,
    opacity 0.2s ease-out;

  &:not(.active) {
    width: 100%;
    cursor: pointer;
    filter: blur(1px);
    opacity: 0.6;
  }

  .toc-text {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: transform 0.2s ease-out;
  }

  &:hover {
    color: var(--anzhiyu-lighttext);
    background-color: var(--anzhiyu-main-op-light);
  }

  &.active {
    font-weight: 600;
    color: var(--anzhiyu-lighttext);
    background-color: var(--anzhiyu-main-op-light);
  }
}

.toc-indicator {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  width: 4px;
  background-color: var(--anzhiyu-main);
  border-radius: 4px;
  opacity: 0;
  transition:
    top 0.2s cubic-bezier(0, 1, 0.5, 1),
    height 0.2s cubic-bezier(0, 1, 0.5, 1),
    opacity 0.2s ease-in-out;
}

// 目录项过渡动画
.toc-item-enter-active,
.toc-item-leave-active {
  transition: all 0.3s ease;
}

.toc-item-enter-from,
.toc-item-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

.toc-item-move {
  transition: transform 0.3s ease;
}

@for $i from 1 through 6 {
  .toc-level-#{$i} {
    .toc-link {
      padding-left: ($i) * 0.8rem;
      font-size: #{0.95 - ($i - 1) * 0.05}rem;

      &.active {
        font-size: #{1.1 - ($i - 1) * 0.05}rem;
      }
    }
  }
}
</style>
