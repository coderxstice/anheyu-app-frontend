// src/views/system/file-management/hooks/useFileDirectLinks.ts

import { ref, h } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { createDirectLinksApi } from "@/api/sys-file/sys-file";
import type { FileItem } from "@/api/sys-file/type";

interface UseFileDirectLinksOptions {
  /**
   * 一个函数，用于获取当前选中的文件项数组
   */
  getSelectedItems: () => FileItem[];
}

/**
 * 处理文件直链相关操作的 Hook
 * @param options - 配置项，包含获取选中文件的方法
 */
export function useFileDirectLinks({
  getSelectedItems
}: UseFileDirectLinksOptions) {
  const isCreatingLinks = ref(false);

  /**
   * 主函数：获取选中文件的直链
   */
  const onActionGetLinks = async () => {
    const selectedItems = getSelectedItems();
    if (selectedItems.length === 0) {
      ElMessage.warning("请至少选择一个文件。");
      return;
    }

    const selectedFiles = selectedItems.filter(item => item.type === 1);
    if (selectedFiles.length === 0) {
      ElMessage.warning("只能为文件创建直链，请检查您的选择。");
      return;
    }

    isCreatingLinks.value = true;
    const loadingMessage = ElMessage({
      message: "正在生成直链...",
      type: "info",
      duration: 0
    });

    try {
      const fileIds = selectedFiles.map(file => file.id);

      // linkItems 的类型是 DirectLinkItem[] | null
      const res = await createDirectLinksApi(fileIds);

      // --- 核心逻辑修改 ---
      // 检查返回的是否是一个非空数组
      if (res && res.code === 200 && res.data && res.data.length > 0) {
        // 3. 从 res.data 中获取真正的链接数组
        const linkItems = res.data;

        const linksMap = new Map<string, string>();
        linkItems.forEach(item => {
          linksMap.set(item.file_url, item.link);
        });

        if (selectedFiles.length === 1) {
          const file = selectedFiles[0];
          const link = linksMap.get(file.path);
          if (link) {
            await navigator.clipboard.writeText(link);
            ElMessage.success(`“${file.name}” 的直链已复制到剪贴板！`);
          } else {
            ElMessage.error("获取直链失败，未在返回数据中找到该文件的链接。");
          }
        } else {
          displayLinksInModal(selectedFiles, linksMap);
        }
      } else {
        throw new Error("获取直链失败，未返回有效的链接数据。");
      }
    } catch (error: any) {
      console.error("获取直链时出错:", error);
      ElMessage.error(error.message || "操作失败，请重试。");
    } finally {
      isCreatingLinks.value = false;
      loadingMessage.close();
    }
  };

  /**
   * 在弹窗中显示多个文件的直链
   * @param files - 文件项数组
   * @param linksMap - 文件内部URI到直链URL的映射 (Map)
   */
  const displayLinksInModal = (
    files: FileItem[],
    linksMap: Map<string, string> // 参数类型改为 Map
  ) => {
    const linkNodes = files
      .map(file => {
        // 同样使用文件的 `path` 属性进行查找
        const link = linksMap.get(file.path);
        if (!link) return null;

        return h("div", { class: "link-item mb-2" }, [
          h("p", { class: "font-bold text-sm" }, file.name),
          h("input", {
            class: "el-input__inner",
            readonly: true,
            value: link,
            onClick: (e: MouseEvent) => {
              const input = e.target as HTMLInputElement;
              navigator.clipboard.writeText(input.value).then(() => {
                ElMessage.success(`“${file.name}” 的链接已复制！`);
              });
            }
          })
        ]);
      })
      .filter(Boolean);

    if (linkNodes.length === 0) {
      ElMessage.warning("未能为任何选中文件生成链接。");
      return;
    }

    ElMessageBox({
      title: "文件直链",
      message: h("div", null, linkNodes),
      showConfirmButton: true,
      confirmButtonText: "关闭",
      customClass: "direct-links-dialog"
    });
  };

  return {
    isCreatingLinks,
    onActionGetLinks
  };
}
