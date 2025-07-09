// src/views/system/file-management/hooks/useFileDirectLinks.ts

import { ref, h } from "vue";
// +++ 引入 ElInput 用于动态创建 VNode +++
import { ElMessage, ElMessageBox, ElInput } from "element-plus";
import {
  createDirectLinksApi,
  fetchFilesByPathApi
} from "@/api/sys-file/sys-file";
import type {
  DirectLinkItem,
  CreateDirectLinksResponse
} from "@/api/sys-file/type";

interface UseFileDirectLinksOptions {
  getSelectedItems: () => any[]; // 简化类型，因为我们只用到了 path 和 id
}

/**
 * 处理文件直链相关操作的 Hook
 * @param options - 配置项，包含获取选中文件的方法
 */
export function useFileDirectLinks({
  getSelectedItems
}: UseFileDirectLinksOptions) {
  const isCreatingLinks = ref(false);

  // recursivelyFetchAllFileIds 函数保持不变
  const recursivelyFetchAllFileIds = async (
    initialPath: string
  ): Promise<string[]> => {
    const MAX_CONCURRENT_REQUESTS = 5;
    const RATE_LIMIT_COUNT = 5;
    const RATE_LIMIT_WINDOW_MS = 50;

    const allFileIds: string[] = [];
    const taskQueue: string[] = [initialPath];
    let activeRequests = 0;

    let requestsInCurrentWindow = 0;
    let windowStartTime = Date.now();

    return new Promise(resolve => {
      const processQueue = async () => {
        if (taskQueue.length === 0 && activeRequests === 0) {
          resolve(allFileIds);
          return;
        }

        while (
          taskQueue.length > 0 &&
          activeRequests < MAX_CONCURRENT_REQUESTS
        ) {
          const now = Date.now();
          if (now - windowStartTime > RATE_LIMIT_WINDOW_MS) {
            windowStartTime = now;
            requestsInCurrentWindow = 0;
          }

          if (requestsInCurrentWindow >= RATE_LIMIT_COUNT) {
            const waitTime = RATE_LIMIT_WINDOW_MS - (now - windowStartTime);
            await new Promise(r => setTimeout(r, waitTime > 0 ? waitTime : 0));
            continue;
          }

          requestsInCurrentWindow++;
          activeRequests++;

          const currentPath = taskQueue.shift()!;

          const worker = async (path: string) => {
            let nextToken: string | null | undefined = null;
            try {
              do {
                const res = await fetchFilesByPathApi(path, nextToken);
                if (res.code === 200 && res.data) {
                  const { files, pagination } = res.data;
                  for (const item of files) {
                    if (item.type === 1) allFileIds.push(item.id);
                    else if (item.type === 2) taskQueue.push(item.path);
                  }
                  nextToken = pagination?.next_token;
                } else {
                  console.error(`获取路径 "${path}" 内容失败:`, res.message);
                  nextToken = null;
                }
              } while (nextToken);
            } catch (error) {
              console.error(`扫描文件夹 "${path}" 时出错:`, error);
            } finally {
              activeRequests--;
              processQueue();
            }
          };
          worker(currentPath);
        }
      };
      processQueue();
    });
  };

  // onActionGetLinks 函数保持不变
  const onActionGetLinks = async () => {
    const selectedItems = getSelectedItems();
    if (selectedItems.length === 0) {
      ElMessage.warning("请至少选择一个项目。");
      return;
    }

    isCreatingLinks.value = true;
    let loadingMessage: ReturnType<typeof ElMessage> | null = ElMessage({
      message: "正在准备文件列表...",
      type: "info",
      duration: 0
    });

    try {
      const initialFileIds = selectedItems
        .filter(item => item.type === 1)
        .map(item => item.id);
      const foldersToProcess = selectedItems.filter(item => item.type === 2);

      let folderFileIds: string[] = [];
      if (foldersToProcess.length > 0) {
        loadingMessage?.close();
        loadingMessage = ElMessage({
          message: "正在扫描文件夹，请稍候...",
          type: "info",
          duration: 0
        });
        for (const folder of foldersToProcess) {
          const ids = await recursivelyFetchAllFileIds(folder.path);
          folderFileIds.push(...ids);
        }
      }

      const allFileIds = [...new Set([...initialFileIds, ...folderFileIds])];

      if (allFileIds.length === 0) {
        ElMessage.warning("在您的选择中没有找到任何可生成直链的文件。");
        loadingMessage?.close();
        isCreatingLinks.value = false;
        return;
      }

      loadingMessage?.close();
      loadingMessage = ElMessage({
        message: `正在为 ${allFileIds.length} 个文件生成直链...`,
        type: "info",
        duration: 0
      });

      const res: CreateDirectLinksResponse =
        await createDirectLinksApi(allFileIds);

      loadingMessage?.close();
      loadingMessage = null;

      if (res && res.code === 200 && res.data && res.data.length > 0) {
        displayLinksInModal(res.data);
      } else {
        throw new Error(res?.message || "获取直链失败，未返回有效的链接数据。");
      }
    } catch (error: any) {
      console.error("获取直链时出错:", error);
      ElMessage.error(error.message || "操作失败，请重试。");
    } finally {
      if (loadingMessage) {
        loadingMessage.close();
      }
      isCreatingLinks.value = false;
    }
  };

  /**
   * (重构后) 在弹窗中显示链接，适配新的UI。
   * @param linkItems - 从API返回的链接对象数组
   */
  const displayLinksInModal = (linkItems: DirectLinkItem[]) => {
    const urls = linkItems.map(item => item.link);
    let messageNode;

    const handleCopy = (content: string, message: string) => {
      navigator.clipboard.writeText(content).then(() => {
        ElMessage.success(message);
      });
    };

    if (urls.length === 1) {
      // --- 单个链接：使用 el-input ---
      const url = urls[0];
      messageNode = h(ElInput, {
        modelValue: url,
        label: "文件直链",
        readonly: true,
        size: "large", // 使输入框看起来更大一些
        onClick: () => handleCopy(url, "直链已复制到剪贴板！")
      });
    } else {
      // --- 多个链接：使用 el-textarea ---
      const textContent = urls.join("\n");
      messageNode = h(ElInput, {
        type: "textarea",
        modelValue: textContent,
        label: "文件直链",
        readonly: true,
        // 根据链接数量自动调整行数，最多显示10行
        rows: Math.min(urls.length, 10),
        resize: "none", // 禁止调整大小
        onClick: () => handleCopy(textContent, "所有链接已复制到剪贴板！")
      });
    }

    ElMessageBox({
      title: "获取文件直链",
      message: messageNode,
      // 只显示右上角的关闭按钮，不显示底部的确认/取消按钮
      showConfirmButton: false,
      // 添加一个自定义类，方便后续进行样式微调
      customClass: "direct-links-dialog"
    });
  };

  return {
    isCreatingLinks,
    onActionGetLinks
  };
}
