<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-05 18:31:42
 * @LastEditTime: 2025-10-10 11:16:47
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { computed, inject, ref, onMounted, watch, nextTick } from "vue";
import type { Ref } from "vue";
import { useRoute } from "vue-router";
import type { PostCategory } from "@/api/post/type";
import { useSiteConfigStore } from "@/store/modules/siteConfig";

import TagsCard from "./TagsCard.vue";
import CardWebInfo from "./CardWebInfo.vue";
import CardToc from "./CardToc.vue";
import CardRecentPost from "./CardRecentPost.vue";
import Archives from "./Archives.vue";
import CardSeriesPost from "./CardSeriesPost.vue";

const props = defineProps({
  config: {
    type: Object,
    default: () => ({})
  }
});

const route = useRoute();
const isPostDetailPage = computed(() => route.name === "PostDetail");

const seriesCategory = inject<Ref<PostCategory | null>>(
  "seriesCategory",
  ref(null)
);

const tagsConfig = computed(() => {
  if (!props.config?.sidebar?.tags?.enable) return null;
  return {
    highlight: props.config.sidebar.tags.highlight || []
  };
});

const webInfoConfig = computed(() => {
  const { totalPostCount, runtimeEnable, totalWordCount } =
    props.config?.sidebar?.siteinfo || {};

  const launch_time = props.config?.footer?.runtime?.launch_time || null;

  return { totalPostCount, runtimeEnable, totalWordCount, launch_time };
});

// 自定义侧边栏块类型
interface CustomSidebarBlock {
  title: string;
  content: string;
  showInPost?: boolean; // 是否在文章页显示（可选，默认为 true 兼容旧数据）
}

// 获取自定义侧边栏块
const siteConfigStore = useSiteConfigStore();
const allCustomSidebarBlocks = computed<CustomSidebarBlock[]>(() => {
  const rawValue = siteConfigStore.siteConfig?.CUSTOM_SIDEBAR;
  if (!rawValue) return [];

  // 兼容旧的字符串格式
  if (typeof rawValue === "string") {
    try {
      const parsed = JSON.parse(rawValue);
      if (Array.isArray(parsed)) {
        // 为旧数据添加默认的 showInPost: true
        return parsed.map((block: CustomSidebarBlock) => ({
          ...block,
          showInPost: block.showInPost !== undefined ? block.showInPost : true
        }));
      }
      // 如果是旧的纯字符串内容，转换为单个块
      if (rawValue.trim()) {
        return [{ title: "", content: rawValue, showInPost: true }];
      }
    } catch {
      // 解析失败，说明是旧的纯 HTML 字符串
      if (rawValue.trim()) {
        return [{ title: "", content: rawValue, showInPost: true }];
      }
    }
    return [];
  }

  // 如果已经是数组格式
  if (Array.isArray(rawValue)) {
    return rawValue.map((block: CustomSidebarBlock) => ({
      ...block,
      showInPost: block.showInPost !== undefined ? block.showInPost : true
    }));
  }

  return [];
});

// 根据页面类型过滤要显示的块
const customSidebarBlocks = computed<CustomSidebarBlock[]>(() => {
  const blocks = allCustomSidebarBlocks.value;
  if (!blocks.length) return [];

  // 如果是文章详情页，只显示 showInPost 为 true 的块
  if (isPostDetailPage.value) {
    return blocks.filter(block => block.showInPost !== false);
  }

  // 非文章详情页，显示所有块
  return blocks;
});

// 判断是否有要显示的自定义侧边栏块
const shouldShowCustomSidebar = computed(() => {
  return customSidebarBlocks.value.length > 0;
});

// 自定义侧边栏容器引用
const customSidebarRefs = ref<(HTMLDivElement | null)[]>([]);

// 执行自定义侧边栏中的脚本
const executeScripts = () => {
  customSidebarRefs.value.forEach(containerRef => {
    if (!containerRef) return;

    // 获取所有 script 标签
    const scripts = containerRef.querySelectorAll("script");
    // 将 NodeList 转换为数组，分离内联脚本和外部脚本
    const scriptArray = Array.from(scripts);
    const inlineScripts: HTMLScriptElement[] = [];
    const externalScripts: HTMLScriptElement[] = [];

    scriptArray.forEach(script => {
      if (script.src) {
        externalScripts.push(script);
      } else {
        inlineScripts.push(script);
      }
    });

    // 先执行内联脚本
    inlineScripts.forEach(oldScript => {
      const newScript = document.createElement("script");

      // 复制除 src 外的所有属性
      Array.from(oldScript.attributes).forEach(attr => {
        if (attr.name !== "src") {
          newScript.setAttribute(attr.name, attr.value);
        }
      });

      let scriptContent = oldScript.textContent || "";

      // 处理 DOMContentLoaded 事件监听器，改为立即执行
      scriptContent = scriptContent.replace(
        /document\.addEventListener\s*\(\s*['"]DOMContentLoaded['"]\s*,\s*function\s*\(\s*\)\s*\{([\s\S]*?)\}\s*\)\s*;?/g,
        "(function(){$1})();"
      );

      // 也处理箭头函数形式的 DOMContentLoaded
      scriptContent = scriptContent.replace(
        /document\.addEventListener\s*\(\s*['"]DOMContentLoaded['"]\s*,\s*\(\s*\)\s*=>\s*\{([\s\S]*?)\}\s*\)\s*;?/g,
        "(function(){$1})();"
      );

      // 将脚本内容包装在 IIFE 中，避免重复声明冲突
      const isAlreadyIIFE =
        scriptContent.trim().startsWith("(function") ||
        scriptContent.trim().startsWith("(()") ||
        scriptContent.trim().startsWith("!function") ||
        scriptContent.trim().startsWith("+function");

      if (!isAlreadyIIFE && scriptContent.trim().length > 0) {
        // 自动将普通函数声明转换为 window 属性，使其可以被全局访问
        scriptContent = scriptContent.replace(
          /(?<!window\.)function\s+(\w+)\s*\(/g,
          "window.$1 = function("
        );

        scriptContent = `(function(){\n${scriptContent}\n})();`;
      }

      newScript.textContent = scriptContent;
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });

    // 处理外部脚本：需要按顺序加载
    const loadExternalScript = (script: HTMLScriptElement): Promise<void> => {
      return new Promise((resolve, reject) => {
        const newScript = document.createElement("script");

        // 复制属性，但移除 defer（动态脚本不支持 defer）
        Array.from(script.attributes).forEach(attr => {
          // 跳过 defer 属性，因为动态添加的脚本不支持 defer
          if (attr.name === "defer") return;
          newScript.setAttribute(attr.name, attr.value);
        });

        newScript.src = script.src;

        // 监听加载完成事件
        newScript.onload = () => {
          resolve();
        };

        newScript.onerror = () => {
          console.error(`Failed to load script: ${script.src}`);
          reject(new Error(`Failed to load script: ${script.src}`));
        };

        // 移除原脚本标签
        script.parentNode?.removeChild(script);

        // 将新脚本追加到 body 末尾以确保执行
        document.body.appendChild(newScript);
      });
    };

    // 按顺序加载外部脚本（保持脚本的执行顺序）
    const loadExternalScriptsSequentially = async () => {
      for (const script of externalScripts) {
        try {
          await loadExternalScript(script);
        } catch (error) {
          // 继续加载下一个脚本
          console.error(error);
        }
      }
    };

    // 执行外部脚本加载
    if (externalScripts.length > 0) {
      loadExternalScriptsSequentially();
    }
  });
};

// 监听自定义侧边栏内容变化和显示状态变化
watch(shouldShowCustomSidebar, async newValue => {
  if (newValue) {
    await nextTick();
    executeScripts();
  }
});

// 组件挂载时执行一次
onMounted(async () => {
  if (shouldShowCustomSidebar.value) {
    await nextTick();
    executeScripts();
  }
});

defineOptions({
  name: "Sticky"
});
</script>

<template>
  <div class="sticky-container">
    <!-- 自定义侧边栏块 -->
    <template v-if="shouldShowCustomSidebar">
      <div
        v-for="(block, index) in customSidebarBlocks"
        :key="index"
        class="card-widget custom-sidebar-block"
      >
        <div v-if="block.title" class="custom-sidebar-title">
          {{ block.title }}
        </div>
        <div
          :ref="
            el => {
              customSidebarRefs[index] = el as HTMLDivElement;
            }
          "
          class="custom-sidebar-content"
          v-html="block.content"
        />
      </div>
    </template>

    <template v-if="isPostDetailPage">
      <CardSeriesPost v-if="seriesCategory" />
      <CardToc />
      <CardRecentPost />
    </template>

    <template v-else>
      <div class="card-widget">
        <TagsCard v-if="tagsConfig" :config="tagsConfig" />
        <hr v-if="tagsConfig && webInfoConfig" />
        <Archives />
        <hr v-if="tagsConfig && webInfoConfig" />
        <CardWebInfo v-if="webInfoConfig" :config="webInfoConfig" />
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.sticky-container {
  position: sticky;
  top: calc(60px + 0.625rem);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.custom-sidebar-block {
  .custom-sidebar-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--anzhiyu-fontcolor);
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--anzhiyu-card-border);
  }

  .custom-sidebar-content {
    :deep(img) {
      max-width: 100%;
      height: auto;
    }
  }
}
</style>
