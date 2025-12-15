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
  id: string;
  text: string;
  level: number;
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

// 获取目录折叠模式配置
const tocCollapseMode = computed(() => {
  const config = siteConfigStore.siteConfig?.sidebar?.toc?.collapseMode;
  return config === "true" || config === true;
});

// 计算可见的目录项（折叠模式下）
const visibleTocItems = computed(() => {
  if (!tocCollapseMode.value || tocItems.value.length === 0) {
    return tocItems.value;
  }

  const items = tocItems.value;
  const activeId = activeTocId.value;
  const visibleItems: TocItem[] = [];

  // 找到当前激活项的索引
  let activeIndex = -1;
  if (activeId) {
    activeIndex = items.findIndex(item => item.id === activeId);
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

const scrollToHeading = (event: MouseEvent, id: string) => {
  event.preventDefault();
  activeTocId.value = id;

  history.replaceState(history.state, "", `#${id}`);

  isClickScrolling.value = true;

  const headingElement = document.getElementById(id);
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

const parseHeadings = () => {
  if (!articleContentHtml?.value || typeof document === "undefined") {
    tocItems.value = [];
    return;
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(articleContentHtml.value, "text/html");
  const headings = doc.querySelectorAll("h1, h2, h3, h4, h5, h6");
  const newTocItems: TocItem[] = [];
  const idMap = new Map<string, number>(); // 用于跟踪重复的ID

  headings.forEach(heading => {
    if (heading.id) {
      let uniqueId = heading.id;
      // 如果ID已经存在，添加数字后缀确保唯一性
      if (idMap.has(uniqueId)) {
        const count = idMap.get(uniqueId)! + 1;
        idMap.set(uniqueId, count);
        uniqueId = `${uniqueId}-${count}`;
      } else {
        idMap.set(uniqueId, 0);
      }

      newTocItems.push({
        id: uniqueId,
        text: heading.textContent || "",
        level: parseInt(heading.tagName.substring(1), 10)
      });
    }
  });
  tocItems.value = newTocItems;
  if (updateHeadingTocItems) {
    updateHeadingTocItems(newTocItems);
  }
};

const onScroll = () => {
  if (isClickScrolling.value) {
    return;
  }

  const fixedHeaderHeight = 80;
  let newActiveId: string | null = null;

  for (let i = allSpyIds.value.length - 1; i >= 0; i--) {
    const id = allSpyIds.value[i];
    const element = document.getElementById(id);
    if (element) {
      if (element.getBoundingClientRect().top <= fixedHeaderHeight) {
        newActiveId = id;
        break;
      }
    }
  }

  if (activeTocId.value !== newActiveId) {
    activeTocId.value = newActiveId;
    if (newActiveId) {
      history.replaceState(history.state, "", `#${newActiveId}`);
    } else {
      history.replaceState(
        history.state,
        "",
        window.location.pathname + window.location.search
      );
    }
  }
};

const updateIndicator = () => {
  if (!tocRef.value || !indicatorRef.value) return;
  const activeLink = tocRef.value.querySelector("a.active") as HTMLElement;
  if (activeLink) {
    indicatorRef.value.style.top = `${activeLink.offsetTop}px`;
    indicatorRef.value.style.height = `${activeLink.offsetHeight / 2}px`;
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

let scrollEndHandler: () => void;

onMounted(() => {
  scrollEndHandler = () => {
    if (scrollTimer) {
      clearTimeout(scrollTimer);
    }
    scrollTimer = window.setTimeout(() => {
      isClickScrolling.value = false;
    }, 150);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("scroll", scrollEndHandler);

  nextTick(() => {
    updateIndicator();
    scrollActiveIntoView();
  });
});

onUnmounted(() => {
  window.removeEventListener("scroll", onScroll);
  if (scrollEndHandler) {
    window.removeEventListener("scroll", scrollEndHandler);
  }
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
            :key="item.id"
            class="toc-item"
            :class="`toc-level-${item.level}`"
          >
            <a
              :href="`#${item.id}`"
              class="toc-link"
              :class="{ active: activeTocId === item.id }"
              @click="scrollToHeading($event, item.id)"
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
  top: 50%;
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
  transform: translateY(50%);
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
