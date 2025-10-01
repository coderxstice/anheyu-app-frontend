<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useSnackbar } from "@/composables/useSnackbar";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { useLazyLoading } from "@/composables/useLazyLoading";
import "katex/dist/katex.min.css";

// Fancybox 懒加载，避免影响首屏性能
let Fancybox: any = null;

const props = defineProps({
  content: {
    type: String,
    default: "PostContent"
  }
});

const { showSnackbar } = useSnackbar();
const siteConfigStore = useSiteConfigStore();

// 初始化懒加载
const { initLazyLoading, reinitialize, cleanup } = useLazyLoading({
  rootMargin: "100px",
  threshold: 0.1,
  showLoading: true
});

const codeMaxLines = computed(
  () => siteConfigStore.getSiteConfig?.code_block?.code_max_lines || 10
);

const postContentRef = ref<HTMLElement | null>(null);

const collapsedHeight = computed(() => {
  const lines = codeMaxLines.value > 0 ? codeMaxLines.value : 10;
  const height = lines * 25 + 50;
  return `${height}px`;
});

const handleContentClick = (event: Event) => {
  const target = event.target as HTMLElement;

  const tabButton = target.closest(".tabs .nav-tabs .tab");
  if (tabButton && tabButton instanceof HTMLButtonElement) {
    event.preventDefault();
    if (tabButton.classList.contains("active")) {
      return;
    }
    const tabsContainer = tabButton.closest(".tabs");
    if (!tabsContainer) return;
    const targetId = tabButton.dataset.href;
    if (!targetId) return;

    tabsContainer.querySelectorAll(".nav-tabs .tab").forEach(btn => {
      btn.classList.remove("active");
    });
    tabsContainer.querySelectorAll(".tab-item-content").forEach(content => {
      content.classList.remove("active");
    });

    tabButton.classList.add("active");
    const targetContent = tabsContainer.querySelector(`#${targetId}`);
    if (targetContent) {
      targetContent.classList.add("active");
    }
    return;
  }

  const scrollToTopButton = target.closest(".tab-to-top button");
  if (scrollToTopButton) {
    event.preventDefault();
    const tabsContainer = scrollToTopButton.closest(".tabs");
    if (tabsContainer) {
      tabsContainer.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
    return;
  }

  const copyButton = target.closest(".copy-button");
  if (copyButton) {
    event.preventDefault();
    event.stopPropagation();
    const codeContainer = copyButton.closest(".md-editor-code");
    const codeElement = codeContainer?.querySelector("pre code");
    if (codeElement) {
      navigator.clipboard
        .writeText(codeElement.textContent || "")
        .then(() => {
          showSnackbar("复制成功，复制和转载请标注本文地址");
        })
        .catch(() => {
          showSnackbar("复制失败，请手动复制");
        });
    }
    return;
  }

  const expandButton = target.closest(".expand");
  if (expandButton) {
    const detailsElement = expandButton.closest(".md-editor-code");
    event.preventDefault();
    if (detailsElement) {
      detailsElement.hasAttribute("open")
        ? detailsElement.removeAttribute("open")
        : detailsElement.setAttribute("open", "");
    }
    return;
  }

  const expandCodeButton = target.closest(".code-expand-btn");
  if (expandCodeButton) {
    const container = expandCodeButton.closest<HTMLDetailsElement>(
      "details.md-editor-code"
    );
    if (container) {
      const preElement = container.querySelector("pre");

      if (container.classList.contains("is-collapsed")) {
        // 展开：移除内联样式限制
        container.open = true;
        if (preElement) {
          preElement.style.height = "";
          preElement.style.overflow = "";
        }
      } else {
        // 折叠：重新设置内联样式限制
        if (preElement) {
          preElement.style.height = collapsedHeight.value;
          preElement.style.overflow = "hidden";
        }
      }

      container.classList.toggle("is-collapsed");
      expandCodeButton.classList.toggle(
        "is-expanded",
        !container.classList.contains("is-collapsed")
      );
    }
    return;
  }
};

onMounted(async () => {
  if (postContentRef.value) {
    postContentRef.value.addEventListener("click", handleContentClick);

    // 初始化懒加载
    initLazyLoading(postContentRef.value);

    // 懒加载 Fancybox
    if (!Fancybox) {
      const fancyboxModule = await import("@fancyapps/ui");
      await import("@fancyapps/ui/dist/fancybox/fancybox.css");
      Fancybox = fancyboxModule.Fancybox;
    }

    Fancybox.bind(postContentRef.value, "img:not(a img)", {
      groupAll: true
    });
  }
});

onUnmounted(() => {
  if (postContentRef.value) {
    postContentRef.value.removeEventListener("click", handleContentClick);
    if (Fancybox) {
      Fancybox.unbind(postContentRef.value);
      Fancybox.close(true);
    }
  }
  // 清理懒加载资源
  cleanup();
});

// 监听内容变化，重新初始化懒加载
watch(
  () => props.content,
  () => {
    if (postContentRef.value) {
      // 等待 DOM 更新完成后重新初始化懒加载
      setTimeout(() => {
        if (postContentRef.value) {
          reinitialize(postContentRef.value);
          // 重新绑定 Fancybox
          if (Fancybox) {
            Fancybox.unbind(postContentRef.value);
            Fancybox.bind(postContentRef.value, "img:not(a img)", {
              groupAll: true
            });
          }
        }
      }, 100);
    }
  }
);
</script>

<template>
  <article
    id="article-container"
    ref="postContentRef"
    class="post-content"
    v-html="content"
  />
</template>

<style lang="scss">
// 使用公共的文章内容样式（包含懒加载等前台特有样式）
@use "@/style/post-content.scss";
@use "./editor-code.scss";

// PostContent 组件特有的样式覆盖
// 大部分样式已经通过 @use 导入
// 这里只保留组件级别的特殊处理（如果需要的话）
</style>
