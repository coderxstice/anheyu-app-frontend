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

  /**
   * 从完整的 URI (如 "anzhiyu://my/folder/file.txt") 中提取逻辑路径 (如 "/folder/file.txt")
   * @param uri - 完整的 URI 字符串
   * @returns 逻辑路径字符串
   */
  const extractLogicalPathFromUri = (uri: string): string => {
    if (!uri) return "/";
    // 正则表达式匹配 "协议://my" 或 "协议://" 后面的所有内容
    const match = uri.match(/^.+?:\/\/(?:my)?(.*)$/);
    // 如果匹配成功，返回捕获组1；否则返回根路径'/'。如果捕获组为空（例如 "anzhiyu://my"），也返回根路径。
    return match ? match[1] || "/" : uri;
  };

  /**
   * (最终调试版) 递归获取文件夹内所有文件ID。
   * 内置并发、频率控制及详细日志。
   * @param initialUri - 初始要扫描的文件夹的完整URI
   * @returns Promise<string[]> - 包含所有文件ID的数组
   */
  const recursivelyFetchAllFileIds = async (
    initialUri: string
  ): Promise<string[]> => {
    // --- 配置 ---
    const MAX_CONCURRENT_REQUESTS = 5;
    const RATE_LIMIT_COUNT = 5;
    const RATE_LIMIT_WINDOW_MS = 50;

    // --- 状态变量 ---
    const allFileIds: string[] = [];
    // 使用逻辑路径启动任务队列
    const initialLogicalPath = extractLogicalPathFromUri(initialUri);
    const taskQueue: string[] = [initialLogicalPath];
    let activeRequests = 0;

    // --- 频率控制状态 ---
    let requestsInCurrentWindow = 0;
    let windowStartTime = Date.now();

    console.log(
      `[SCANNER] === Scan Started for URI: "${initialUri}" -> Logical Path: "${initialLogicalPath}" ===`
    );

    return new Promise(resolve => {
      const processQueue = async () => {
        // --- 日志 ---
        console.log(
          `[SCANNER] processQueue | Queue size: ${taskQueue.length}, Active requests: ${activeRequests}`
        );

        // 任务完成条件
        if (taskQueue.length === 0 && activeRequests === 0) {
          console.log(
            `[SCANNER] === Scan Finished. Total files found: ${allFileIds.length} ===`
          );
          resolve(allFileIds);
          return;
        }

        // 循环启动新任务
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
            console.log(
              `[SCANNER] Rate limit reached. Waiting for ${waitTime > 0 ? waitTime : 0}ms.`
            );
            await new Promise(r => setTimeout(r, waitTime > 0 ? waitTime : 0));
            continue;
          }

          requestsInCurrentWindow++;
          activeRequests++;

          const currentPath = taskQueue.shift()!;

          const worker = async (path: string) => {
            let nextToken: string | null | undefined = null;
            console.log(`[SCANNER] --> Worker started for path: "${path}"`);
            try {
              do {
                // --- 日志 ---
                console.log(
                  `[SCANNER]      Fetching: "${path}", next_token: ${nextToken}`
                );
                // ** 使用逻辑路径调用API **
                const res = await fetchFilesByPathApi(path, nextToken);

                if (res.code === 200 && res.data) {
                  const { files, pagination } = res.data;
                  console.log(
                    `[SCANNER]      Received ${files.length} items for "${path}"`
                  );

                  for (const item of files) {
                    if (item.type === 1) {
                      allFileIds.push(item.id);
                    } else if (item.type === 2) {
                      // ** 将子文件夹的完整 URI 转换为逻辑路径再加入队列 **
                      const childLogicalPath = extractLogicalPathFromUri(
                        item.path
                      );
                      taskQueue.push(childLogicalPath);
                      console.log(
                        `[SCANNER]      Queued subfolder: "${item.path}" -> "${childLogicalPath}"`
                      );
                    }
                  }
                  nextToken = pagination?.next_token;
                } else {
                  console.error(
                    `[SCANNER] API Error for path "${path}":`,
                    res.message
                  );
                  nextToken = null;
                }
              } while (nextToken);
            } catch (error) {
              console.error(
                `[SCANNER] Network Error for path "${path}":`,
                error
              );
            } finally {
              activeRequests--;
              console.log(
                `[SCANNER] <-- Worker finished for path: "${path}". Active requests now: ${activeRequests}`
              );
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
   * 在弹窗中为每个链接显示一个独立的输入框。
   * @param linkItems - 从API返回的链接对象数组
   */
  const displayLinksInModal = (linkItems: DirectLinkItem[]) => {
    const extractFileName = (url: string) =>
      url.substring(url.lastIndexOf("/") + 1);

    const inputNodes = linkItems.map((item, index) => {
      const fileName = extractFileName(item.file_url);

      return h(
        "div",
        {
          class: "link-item",
          style: index < linkItems.length - 1 ? "margin-bottom: 12px;" : ""
        },
        [
          h(ElInput, {
            modelValue: item.link,
            label: fileName || "文件直链",
            readonly: true,
            size: "large",
            onClick: () => {
              navigator.clipboard.writeText(item.link).then(() => {
                ElMessage.success(`“${fileName}”的链接已复制！`);
              });
            }
          })
        ]
      );
    });

    ElMessageBox({
      title: "获取文件直链",
      message: h("div", { class: "link-list-container" }, inputNodes),
      showConfirmButton: false,
      customClass: "direct-links-dialog"
    });
  };

  return {
    isCreatingLinks,
    onActionGetLinks
  };
}
