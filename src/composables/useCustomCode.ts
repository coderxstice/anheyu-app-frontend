/**
 * @description: 自定义代码动态加载 Hook
 * 在站点配置加载完成后，动态插入自定义 HTML、CSS、JS 代码
 */

import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { watch } from "vue";

/**
 * 插入自定义头部 HTML
 */
function insertCustomHeaderHTML(html: string) {
  if (!html.trim()) return;

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  // 遍历所有子节点并插入到 head
  Array.from(tempDiv.childNodes).forEach(node => {
    document.head.appendChild(node.cloneNode(true));
  });
}

/**
 * 插入自定义 CSS
 */
function insertCustomCSS(css: string) {
  if (!css.trim()) return;

  const style = document.createElement("style");
  style.setAttribute("type", "text/css");
  style.setAttribute("data-custom", "true");
  style.textContent = css;
  document.head.appendChild(style);
}

/**
 * 插入自定义底部 HTML
 */
function insertCustomFooterHTML(html: string) {
  if (!html.trim()) return;

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  // 遍历所有子节点并插入到 body
  Array.from(tempDiv.childNodes).forEach(node => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;

      // 特殊处理 script 标签
      if (element.tagName.toLowerCase() === "script") {
        const newScript = document.createElement("script");

        // 复制所有属性
        Array.from(element.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value);
        });

        // 添加标识，便于后续清理
        newScript.setAttribute("data-custom-footer", "true");

        // 自动处理跨域：如果是外部脚本且没有设置crossorigin，则自动添加
        const src = newScript.getAttribute("src");
        if (src && !newScript.hasAttribute("crossorigin")) {
          try {
            const url = new URL(src, window.location.href);
            // 如果是外部域名，自动添加crossorigin
            if (url.origin !== window.location.origin) {
              newScript.setAttribute("crossorigin", "anonymous");
            }
          } catch {
            // URL解析失败，保持原样
            console.warn("Failed to parse script src URL:", src);
          }
        }

        // 复制脚本内容
        if (element.textContent) {
          newScript.textContent = element.textContent;
        }

        document.body.appendChild(newScript);
      } else {
        // 对于非 script 标签，递归处理其中的 script 子标签
        const clonedNode = node.cloneNode(true) as Element;
        document.body.appendChild(clonedNode);

        // 处理克隆节点中的 script 标签
        const scripts = clonedNode.querySelectorAll("script");
        scripts.forEach(oldScript => {
          const newScript = document.createElement("script");
          Array.from(oldScript.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
          });
          // 添加标识，便于后续清理
          newScript.setAttribute("data-custom-footer", "true");

          // 自动处理跨域：如果是外部脚本且没有设置crossorigin，则自动添加
          const src = newScript.getAttribute("src");
          if (src && !newScript.hasAttribute("crossorigin")) {
            try {
              const url = new URL(src, window.location.href);
              // 如果是外部域名，自动添加crossorigin
              if (url.origin !== window.location.origin) {
                newScript.setAttribute("crossorigin", "anonymous");
              }
            } catch {
              // URL解析失败，保持原样
              console.warn("Failed to parse script src URL:", src);
            }
          }

          if (oldScript.textContent) {
            newScript.textContent = oldScript.textContent;
          }
          oldScript.parentNode?.replaceChild(newScript, oldScript);
        });
      }
    } else {
      // 文本节点或其他类型节点直接插入
      document.body.appendChild(node.cloneNode(true));
    }
  });
}

/**
 * 插入自定义 JS
 */
function insertCustomJS(js: string) {
  if (!js.trim()) return;

  const script = document.createElement("script");
  script.setAttribute("type", "text/javascript");
  script.setAttribute("data-custom", "true");
  script.textContent = js;
  document.body.appendChild(script);
}

/**
 * 移除已插入的自定义代码（用于热更新）
 */
function removeCustomCode() {
  // 移除自定义 CSS
  document
    .querySelectorAll('style[data-custom="true"]')
    .forEach(el => el.remove());
  // 移除自定义 JS
  document
    .querySelectorAll('script[data-custom="true"]')
    .forEach(el => el.remove());
  // 移除通过自定义底部HTML插入的script标签
  document
    .querySelectorAll('script[data-custom-footer="true"]')
    .forEach(el => el.remove());
}

/**
 * 自定义代码加载标记
 */
let isCustomCodeLoaded = false;

/**
 * 动态加载自定义代码的 Composable
 */
export function useCustomCode() {
  const siteConfigStore = useSiteConfigStore();

  /**
   * 加载所有自定义代码
   */
  const loadCustomCode = () => {
    const config = siteConfigStore.siteConfig;

    if (!config || Object.keys(config).length === 0) {
      return;
    }

    // 如果已经加载过，先移除旧的（支持热更新）
    if (isCustomCodeLoaded) {
      removeCustomCode();
    }

    // 1. 插入自定义头部 HTML
    const customHeaderHTML = config.CUSTOM_HEADER_HTML;
    if (customHeaderHTML) {
      insertCustomHeaderHTML(customHeaderHTML);
    }

    // 2. 插入自定义 CSS
    const customCSS = config.CUSTOM_CSS;
    if (customCSS) {
      insertCustomCSS(customCSS);
    }

    // 3. 插入自定义底部 HTML
    const customFooterHTML = config.CUSTOM_FOOTER_HTML;
    if (customFooterHTML) {
      insertCustomFooterHTML(customFooterHTML);
    }

    // 4. 插入自定义 JS
    const customJS = config.CUSTOM_JS;
    if (customJS) {
      insertCustomJS(customJS);
    }

    isCustomCodeLoaded = true;
    console.log("✅ 自定义代码已加载");
  };

  // 监听站点配置变化，自动加载
  watch(
    () => siteConfigStore.siteConfig,
    newConfig => {
      if (newConfig && Object.keys(newConfig).length > 0) {
        loadCustomCode();
      }
    },
    { immediate: true, deep: true }
  );

  return {
    loadCustomCode
  };
}
