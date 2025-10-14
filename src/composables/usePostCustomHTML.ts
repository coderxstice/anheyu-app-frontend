/**
 * @description: 文章页面自定义HTML处理
 * 专门用于处理文章页面的自定义HTML代码，支持script标签执行
 */

import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { computed, watch, onUnmounted } from "vue";

/**
 * 插入自定义HTML并执行其中的script标签
 */
function insertHTMLWithScripts(html: string, containerId: string) {
  if (!html.trim()) return;

  const container = document.getElementById(containerId);
  if (!container) return;

  // 清空容器
  container.innerHTML = "";

  // 创建临时div解析HTML
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  // 处理所有节点
  Array.from(tempDiv.childNodes).forEach(node => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;

      // 特殊处理script标签
      if (element.tagName.toLowerCase() === "script") {
        const newScript = document.createElement("script");

        // 复制所有属性
        Array.from(element.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value);
        });

        // 添加标识，便于后续清理
        newScript.setAttribute("data-post-custom", "true");

        // 复制脚本内容
        if (element.textContent) {
          newScript.textContent = element.textContent;
        }

        container.appendChild(newScript);
      } else {
        // 其他元素直接克隆
        const clonedNode = node.cloneNode(true) as Element;
        container.appendChild(clonedNode);

        // 处理嵌套的script标签
        const scripts = clonedNode.querySelectorAll("script");
        scripts.forEach(oldScript => {
          const newScript = document.createElement("script");
          Array.from(oldScript.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
          });
          newScript.setAttribute("data-post-custom", "true");

          if (oldScript.textContent) {
            newScript.textContent = oldScript.textContent;
          }
          oldScript.parentNode?.replaceChild(newScript, oldScript);
        });
      }
    } else {
      // 文本节点或其他类型节点直接插入
      container.appendChild(node.cloneNode(true));
    }
  });
}

/**
 * 清理插入的自定义代码
 */
function cleanupCustomHTML(containerId: string) {
  const container = document.getElementById(containerId);
  if (container) {
    // 移除所有自定义script标签
    container
      .querySelectorAll('script[data-post-custom="true"]')
      .forEach(el => el.remove());
    // 清空容器
    container.innerHTML = "";
  }
}

/**
 * 文章页面自定义HTML处理
 */
export function usePostCustomHTML() {
  const siteConfigStore = useSiteConfigStore();

  const postTopHTML = computed(() => {
    const config = siteConfigStore.siteConfig;
    return config?.CUSTOM_POST_TOP_HTML || "";
  });

  const postBottomHTML = computed(() => {
    const config = siteConfigStore.siteConfig;
    return config?.CUSTOM_POST_BOTTOM_HTML || "";
  });

  // 监听顶部HTML变化
  watch(
    postTopHTML,
    newHTML => {
      if (newHTML) {
        insertHTMLWithScripts(newHTML, "post-custom-top");
      } else {
        cleanupCustomHTML("post-custom-top");
      }
    },
    { immediate: true }
  );

  // 监听底部HTML变化
  watch(
    postBottomHTML,
    newHTML => {
      if (newHTML) {
        insertHTMLWithScripts(newHTML, "post-custom-bottom");
      } else {
        cleanupCustomHTML("post-custom-bottom");
      }
    },
    { immediate: true }
  );

  // 组件卸载时清理
  onUnmounted(() => {
    cleanupCustomHTML("post-custom-top");
    cleanupCustomHTML("post-custom-bottom");
  });

  return {
    postTopHTML,
    postBottomHTML
  };
}
