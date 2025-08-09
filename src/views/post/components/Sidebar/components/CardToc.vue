<script setup lang="ts">
import { ref, watch, inject, onMounted, onUnmounted, nextTick } from "vue";
import type { Ref } from "vue";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

defineOptions({
  name: "CardToc"
});

const tocRef = ref<HTMLElement | null>(null);
const indicatorRef = ref<HTMLElement | null>(null);

const articleContentHtml =
  inject<Ref<string | undefined>>("articleContentHtml");
const tocItems = ref<TocItem[]>([]);
const activeTocId = ref<string | null>(null);

const parseHeadings = () => {
  if (!articleContentHtml?.value || typeof document === "undefined") {
    tocItems.value = [];
    return;
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(articleContentHtml.value, "text/html");
  const headings = doc.querySelectorAll("h1, h2, h3, h4, h5, h6");
  const newTocItems: TocItem[] = [];
  headings.forEach(heading => {
    if (heading.id) {
      newTocItems.push({
        id: heading.id,
        text: heading.textContent || "",
        level: parseInt(heading.tagName.substring(1), 10)
      });
    }
  });
  tocItems.value = newTocItems;
};

const onScroll = () => {
  if (typeof window === "undefined") return;
  const scrollOffset = window.scrollY + 80;
  let currentActiveId: string | null = null;
  for (let i = tocItems.value.length - 1; i >= 0; i--) {
    const item = tocItems.value[i];
    const headingElement = document.getElementById(item.id);
    if (headingElement) {
      if ((headingElement as HTMLElement).offsetTop <= scrollOffset) {
        currentActiveId = item.id;
        break;
      }
    }
  }
  activeTocId.value = currentActiveId;
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

watch(
  articleContentHtml || ref(""),
  () => {
    nextTick(() => {
      parseHeadings();
    });
  },
  { immediate: true }
);

watch([activeTocId, tocItems], () => {
  nextTick(updateIndicator);
});

onMounted(() => {
  window.addEventListener("scroll", onScroll, { passive: true });
  nextTick(updateIndicator);
});

onUnmounted(() => {
  window.removeEventListener("scroll", onScroll);
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
        <li
          v-for="item in tocItems"
          :key="item.id"
          class="toc-item"
          :class="`toc-level-${item.level}`"
        >
          <a
            :href="`#${item.id}`"
            class="toc-link"
            :class="{ active: activeTocId === item.id }"
          >
            <span class="toc-text">{{ item.text }}</span>
          </a>
        </li>
        <div ref="indicatorRef" class="toc-indicator" />
      </ol>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.card-widget {
  padding: 1rem;
  background: var(--anzhiyu-card-bg);
  border-radius: 12px;
  border: var(--style-border);
}

.item-headline {
  display: flex;
  align-items: center;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  padding-left: 0.25rem;
  color: var(--anzhiyu-fontcolor);

  i {
    font-size: 1.2rem;
    margin-right: 0.5rem;
  }
}

.toc-content {
  overflow: auto;
  max-height: calc(100vh - 200px);
}

.toc {
  position: relative;
  list-style: none;
  padding: 0;
  margin: 0;
  z-index: 1;
}

.toc-link {
  position: relative;
  display: flex;
  align-items: center;
  padding: 8px 8px 8px 12px;
  border-radius: 8px;
  color: var(--anzhiyu-secondtext);
  line-height: 1.5;
  transition:
    color 0.2s ease-out,
    background-color 0.2s ease-out;
  text-overflow: ellipsis;
  white-space: nowrap;

  .toc-text {
    transition: transform 0.2s ease-out;
  }

  &:hover {
    background-color: var(--anzhiyu-main-op-light);
    color: var(--anzhiyu-lighttext);
  }

  &.active {
    color: var(--anzhiyu-lighttext);
    background-color: var(--anzhiyu-main-op-light);
    font-weight: 600;
  }
}

.toc-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(50%);
  width: 4px;
  background-color: var(--anzhiyu-main);
  border-radius: 4px;
  opacity: 0;
  z-index: 2;
  transition:
    top 0.2s cubic-bezier(0, 1, 0.5, 1),
    height 0.2s cubic-bezier(0, 1, 0.5, 1),
    opacity 0.2s ease-in-out;
}

// Loop for indentation and font size
@for $i from 2 through 6 {
  .toc-level-#{$i} {
    .toc-link {
      padding-left: ($i - 1) * 1.25rem;
      font-size: #{0.95 - ($i - 2) * 0.05}rem;
    }
  }
}
</style>
