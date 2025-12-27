/**
 * @Description: HTML内容处理逻辑（代码块、表格等）
 * @Author: 安知鱼
 * @Date: 2025-12-27
 */
import { computed } from "vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { useSnackbar } from "@/composables/useSnackbar";

export function useContentProcessor() {
  const siteConfigStore = useSiteConfigStore();
  const { showSnackbar } = useSnackbar();

  const codeMaxLines = computed(
    () => siteConfigStore.getSiteConfig?.code_block?.code_max_lines || 10
  );

  const collapsedHeight = computed(() => {
    const lines = codeMaxLines.value > 0 ? codeMaxLines.value : 10;
    const height = lines * 25 + 15;
    return `${height}px`;
  });

  // 全局复制处理函数
  const handleCodeCopy = (codeElement: HTMLElement) => {
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
  };

  // 注册全局复制处理函数
  const registerGlobalCopyHandler = () => {
    (window as any).__markdownEditorCopyHandler = handleCodeCopy;
  };

  // 清理全局复制处理函数
  const unregisterGlobalCopyHandler = () => {
    delete (window as any).__markdownEditorCopyHandler;
  };

  // 清理HTML内容（添加复制按钮、代码折叠等）
  const sanitize = (html: string): string => {
    const doc = new DOMParser().parseFromString(html, "text/html");

    // 处理代码块
    doc.querySelectorAll("details.md-editor-code").forEach(detailsElement => {
      const summaryElement = detailsElement.querySelector(
        "summary.md-editor-code-head"
      );
      if (!summaryElement) return;

      if (!summaryElement.querySelector(".copy-button")) {
        const langSpan = detailsElement.querySelector(".md-editor-code-lang");
        const language = langSpan ? langSpan.textContent?.trim() : "";

        // 内置代码复制逻辑
        const copyHandler = `
          event.preventDefault();
          event.stopPropagation();
          const code = this.closest('.md-editor-code').querySelector('pre code');
          if(code && window.__markdownEditorCopyHandler) {
            window.__markdownEditorCopyHandler(code);
          }
        `
          .replace(/\s+/g, " ")
          .trim();

        // 内置代码块展开/收起逻辑
        const toggleHandler = `
          event.preventDefault();
          this.closest('details').open = !this.closest('details').open;
        `
          .replace(/\s+/g, " ")
          .trim();

        summaryElement.innerHTML = `
          <i class="anzhiyufont anzhiyu-icon-angle-down expand" onclick="${toggleHandler}"></i>
          <div class="code-lang">${language}</div>
          <i class="anzhiyufont anzhiyu-icon-paste copy-button" onclick="${copyHandler}"></i>`;
      }

      if (codeMaxLines.value !== -1) {
        const preElement = detailsElement.querySelector("pre");
        if (preElement) {
          let lineCount = 0;
          const rnWrapper = preElement.querySelector("span[rn-wrapper]");

          if (rnWrapper) {
            lineCount = rnWrapper.children.length;
          } else {
            lineCount = (preElement.textContent?.match(/\n/g) || []).length + 1;
          }

          if (lineCount > codeMaxLines.value) {
            detailsElement.classList.add("is-collapsible", "is-collapsed");
            preElement.style.height = collapsedHeight.value;
            preElement.style.overflow = "hidden";

            if (!detailsElement.querySelector(".code-expand-btn")) {
              const expandBtn = document.createElement("div");
              expandBtn.className = "code-expand-btn";

              const collapsedHeightValue = collapsedHeight.value;
              const expandHandler = `
                const container = this.closest('details.md-editor-code');
                const pre = container.querySelector('pre');
                const icon = this.querySelector('i');
                if(container.classList.contains('is-collapsed')) {
                  container.open = true;
                  container.classList.remove('is-collapsed');
                  if(pre) {
                    pre.style.height = '';
                    pre.style.overflow = '';
                  }
                  if(icon) {
                    icon.style.transform = 'rotate(180deg)';
                  }
                  this.classList.add('is-expanded');
                } else {
                  container.classList.add('is-collapsed');
                  if(pre) {
                    pre.style.height = '${collapsedHeightValue}';
                    pre.style.overflow = 'hidden';
                  }
                  if(icon) {
                    icon.style.transform = 'rotate(0deg)';
                  }
                  this.classList.remove('is-expanded');
                }
              `
                .replace(/\s+/g, " ")
                .trim();

              expandBtn.setAttribute("onclick", expandHandler);
              expandBtn.innerHTML = `<i class="anzhiyufont anzhiyu-icon-angle-double-down" style="transition: transform 0.3s ease;"></i>`;
              detailsElement.appendChild(expandBtn);
            }
          }
        }
      }
    });

    // 包装表格以支持响应式滚动
    doc.querySelectorAll("table").forEach(table => {
      if (table.parentElement?.classList.contains("table-container")) {
        return;
      }
      const container = document.createElement("div");
      container.className = "table-container";
      if (table.parentNode) {
        table.parentNode.insertBefore(container, table);
        container.appendChild(table);
      }
    });

    return doc.body.innerHTML;
  };

  return {
    codeMaxLines,
    collapsedHeight,
    handleCodeCopy,
    registerGlobalCopyHandler,
    unregisterGlobalCopyHandler,
    sanitize
  };
}
