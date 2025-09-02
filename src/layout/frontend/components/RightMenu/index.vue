<template>
  <div v-show="isVisible" id="rightMenu" ref="rightMenuRef" :style="menuStyle">
    <div class="rightMenu-group rightMenu-small">
      <div class="rightMenu-item" @click.stop="goBack">
        <i class="anzhiyufont anzhiyu-icon-arrow-left" />
      </div>
      <div class="rightMenu-item" @click.stop="goForward">
        <i class="anzhiyufont anzhiyu-icon-arrow-right" />
      </div>
      <div class="rightMenu-item" @click.stop="refreshPage">
        <i
          class="anzhiyufont anzhiyu-icon-arrow-rotate-right"
          style="font-size: 0.9rem"
        />
      </div>
      <div class="rightMenu-item" @click.stop="scrollToTop">
        <i class="anzhiyufont anzhiyu-icon-arrow-up" />
      </div>
    </div>

    <div v-if="isTextSelected" class="rightMenu-group rightMenu-line">
      <div class="rightMenu-item" @click.stop="copySelectedText">
        <i class="anzhiyufont anzhiyu-icon-copy" />
        <span>复制选中文本</span>
      </div>
      <div class="rightMenu-item" @click.stop="searchBaidu">
        <i class="anzhiyufont anzhiyu-icon-magnifying-glass" />
        <span>百度搜索</span>
      </div>
    </div>

    <div v-else class="rightMenu-group rightMenu-line">
      <a class="rightMenu-item menu-link" @click.stop="randomNavigate">
        <i class="anzhiyufont anzhiyu-icon-shuffle" />
        <span>随便逛逛</span>
      </a>
      <a class="rightMenu-item menu-link" @click.stop="gotoCategory">
        <i class="anzhiyufont anzhiyu-icon-cube" />
        <span>博客分类</span>
      </a>
      <a class="rightMenu-item menu-link" @click.stop="gotoTag">
        <i class="anzhiyufont anzhiyu-icon-tags" />
        <span>文章标签</span>
      </a>
    </div>

    <div class="rightMenu-group rightMenu-line">
      <div class="rightMenu-item" @click.stop="copyUrl">
        <i class="anzhiyufont anzhiyu-icon-copy" />
        <span> 复制地址 </span>
      </div>

      <div class="rightMenu-item" @click.stop="toggleTheme">
        <i class="anzhiyufont anzhiyu-icon-circle-half-stroke" />
        <span class="menu-darkmode-text">{{
          dataTheme ? "浅色模式" : "深色模式"
        }}</span>
      </div>

      <div class="rightMenu-item" @click.stop="handleToggleCommentBarrage">
        <i class="anzhiyufont anzhiyu-icon-message" />
        <span class="menu-commentBarrage-text">{{
          isCommentBarrageVisible ? "隐藏热评" : "显示热评"
        }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive, computed, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useArticleStore } from "@/store/modules/articleStore";
import { useCopyToClipboard } from "@pureadmin/utils";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
import { useSnackbar } from "@/composables/useSnackbar";
import { useUiStore } from "@/store/modules/uiStore";
import { storeToRefs } from "pinia";
import gsap from "gsap";

const rightMenuRef = ref<HTMLElement | null>(null);
const isVisible = ref(false);
const isTextSelected = ref(false);
const position = reactive({ x: 0, y: 0 });
const capturedText = ref("");

const router = useRouter();
const articleStore = useArticleStore();
const { copied, update } = useCopyToClipboard();
const { dataTheme, dataThemeChange } = useDataThemeChange();
const { showSnackbar } = useSnackbar();
const uiStore = useUiStore();

const { isCommentBarrageVisible } = storeToRefs(uiStore);
const { toggleCommentBarrage } = uiStore;

const menuStyle = computed(() => ({
  top: `${position.y}px`,
  left: `${position.x}px`
}));

const handleToggleCommentBarrage = () => {
  toggleCommentBarrage();
  hideMenu();
};

const handleContextMenu = (event: MouseEvent) => {
  // 仅在桌面端设备生效
  if (window.innerWidth < 768) return;

  event.preventDefault();

  const selection = window.getSelection();
  isTextSelected.value = selection ? !selection.isCollapsed : false;

  // 修改：在菜单显示时就捕获选中的文本
  if (isTextSelected.value && selection) {
    capturedText.value = selection.toString();
  } else {
    capturedText.value = "";
  }

  position.x = event.clientX;
  position.y = event.clientY;
  isVisible.value = true;

  nextTick(() => {
    // GSAP 动画
    gsap.fromTo(
      rightMenuRef.value,
      { scale: 0.9, opacity: 0, y: -10 },
      {
        scale: 1,
        opacity: 1,
        y: 0,
        duration: 0.2,
        ease: "power2.out"
      }
    );
  });
};

const hideMenu = () => {
  if (isVisible.value) {
    gsap.to(rightMenuRef.value, {
      scale: 0.9,
      opacity: 0,
      duration: 0.1,
      ease: "power1.in",
      onComplete: () => {
        isVisible.value = false;
      }
    });
  }
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    hideMenu();
  }
};

const gotoCategory = () => {
  router.push("/categories");
  hideMenu();
};

const gotoTag = () => {
  router.push("/tags");
  hideMenu();
};

const goBack = () => {
  window.history.back();
  hideMenu();
};

const goForward = () => {
  window.history.forward();
  hideMenu();
};

const refreshPage = () => {
  window.location.reload();
  hideMenu();
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
  hideMenu();
};

const copySelectedText = () => {
  // 修改：直接使用暂存的文本
  const text = capturedText.value;
  if (text) {
    update(text);
    if (copied.value) {
      showSnackbar("复制成功，复制和转载请标注本文地址");
    }
  }
  hideMenu();
};

const searchBaidu = () => {
  // 修改：直接使用暂存的文本
  const text = capturedText.value;
  if (text) {
    window.open(
      `https://www.baidu.com/s?wd=${encodeURIComponent(text)}`,
      "_blank"
    );
  }
  hideMenu();
};

const randomNavigate = () => {
  articleStore.navigateToRandomArticle();
  hideMenu();
};

const toggleTheme = () => {
  dataThemeChange(dataTheme.value ? "light" : "dark");
  hideMenu();
};

const copyUrl = () => {
  const url = window.location.href;
  update(url);
  if (copied.value) {
    showSnackbar("复制本页链接地址成功");
  }
  hideMenu();
};

onMounted(() => {
  window.addEventListener("contextmenu", handleContextMenu);
  window.addEventListener("click", hideMenu);
  window.addEventListener("keydown", handleKeydown);
  window.addEventListener("scroll", hideMenu);
});

onUnmounted(() => {
  window.removeEventListener("contextmenu", handleContextMenu);
  window.removeEventListener("click", hideMenu);
  window.removeEventListener("keydown", handleKeydown);
  window.removeEventListener("scroll", hideMenu);
});
</script>

<style scoped lang="scss">
#rightMenu {
  position: fixed;
  z-index: 9999;
  padding: 8px;
  background-color: var(--anzhiyu-maskbg);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: var(--style-border);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-contextmenu);
  font-size: 14px;
  color: var(--anzhiyu-fontcolor);
  opacity: 0;
  transform-origin: top left;
}

.rightMenu-group {
  display: flex;
  align-items: center;
  gap: 4px;

  &:not(:last-child) {
    margin-bottom: 4px;
  }

  &.rightMenu-line {
    border-top: 2px dashed var(--anzhiyu-theme-op);
    padding-top: 4px;
    flex-direction: column;
  }
}

.rightMenu-item {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
  white-space: nowrap;
  width: 100%;

  i {
    margin-right: 8px;
    font-size: 1rem;
    width: 1em;
    height: 1em;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  &:hover {
    background-color: var(--anzhiyu-main);
    color: var(--anzhiyu-white);
  }
}

.rightMenu-small .rightMenu-item {
  width: 32px;
  height: 32px;
  padding: 0;
  justify-content: center;
  i {
    margin-right: 0;
  }
}
</style>
