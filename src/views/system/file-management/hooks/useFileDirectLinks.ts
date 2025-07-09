// src/views/system/file-management/hooks/useFileDirectLinks.ts

import { ref, h } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  createDirectLinksApi,
  fetchFilesByPathApi
} from "@/api/sys-file/sys-file";
import type {
  FileItem,
  DirectLinkItem,
  CreateDirectLinksResponse
} from "@/api/sys-file/type";
import { extractFileNameFromUrl } from "@/utils/fileUtils";

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
   * 递归获取文件夹内所有文件ID。
   * 内置并发控制器和频率控制器。
   * @param initialPath - 初始要扫描的文件夹路径
   * @returns Promise<string[]> - 包含所有文件ID的数组
   */
  const recursivelyFetchAllFileIds = async (
    initialPath: string
  ): Promise<string[]> => {
    // --- 配置 ---
    const MAX_CONCURRENT_REQUESTS = 5; // 并发数：同一时间最多5个请求
    const RATE_LIMIT_COUNT = 5; // 频率数：每个时间窗口内最多5个请求
    const RATE_LIMIT_WINDOW_MS = 50; // 时间窗口：50毫秒

    // --- 状态变量 ---
    const allFileIds: string[] = [];
    const taskQueue: string[] = [initialPath];
    let activeRequests = 0;

    // --- 频率控制状态 ---
    let requestsInCurrentWindow = 0;
    let windowStartTime = Date.now();

    return new Promise(resolve => {
      const processQueue = async () => {
        // 任务完成条件
        if (taskQueue.length === 0 && activeRequests === 0) {
          resolve(allFileIds);
          return;
        }

        // 循环启动新任务，直到达到并发或频率限制
        while (
          taskQueue.length > 0 &&
          activeRequests < MAX_CONCURRENT_REQUESTS
        ) {
          // --- 频率控制检查 ---
          const now = Date.now();
          // 如果当前时间窗口已过，重置计数器和起始时间
          if (now - windowStartTime > RATE_LIMIT_WINDOW_MS) {
            windowStartTime = now;
            requestsInCurrentWindow = 0;
          }

          // 如果当前窗口的请求数已达上限，则等待下一个时间窗口
          if (requestsInCurrentWindow >= RATE_LIMIT_COUNT) {
            // 计算需要等待的时间
            const waitTime = RATE_LIMIT_WINDOW_MS - (now - windowStartTime);
            await new Promise(r => setTimeout(r, waitTime > 0 ? waitTime : 0));
            // 等待后，再次进入循环以重新检查
            continue;
          }

          // --- 满足所有条件，启动新任务 ---
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
              processQueue(); // 递归调用，尝试处理队列中的下一个任务
            }
          };

          worker(currentPath);
        }
      };

      processQueue();
    });
  };

  /**
   * 主函数：获取选中文件的直链
   */
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
      // 1. 分离初始选择的文件和文件夹
      const initialFileIds = selectedItems
        .filter(item => item.type === 1)
        .map(item => item.id);
      const foldersToProcess = selectedItems.filter(item => item.type === 2);

      // 2. 处理文件夹，递归获取所有文件ID
      let folderFileIds: string[] = [];
      if (foldersToProcess.length > 0) {
        loadingMessage.message = "正在扫描文件夹，请稍候...";
        for (const folder of foldersToProcess) {
          const ids = await recursivelyFetchAllFileIds(folder.path);
          folderFileIds.push(...ids);
        }
      }

      // 3. 合并并去重所有文件ID
      const allFileIds = [...new Set([...initialFileIds, ...folderFileIds])];

      if (allFileIds.length === 0) {
        ElMessage.warning("在您的选择中没有找到任何可生成直链的文件。");
        return;
      }

      loadingMessage.message = `正在为 ${allFileIds.length} 个文件生成直链...`;

      // 4. 一次性发起API请求
      const res: CreateDirectLinksResponse =
        await createDirectLinksApi(allFileIds);

      // 5. 统一处理结果并弹窗显示
      if (res && res.code === 200 && res.data && res.data.length > 0) {
        displayLinksInModal(res.data);
      } else {
        throw new Error(res?.message || "获取直链失败，未返回有效的链接数据。");
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
   * @param linkItems - 从API返回的链接对象数组
   */
  const displayLinksInModal = (linkItems: DirectLinkItem[]) => {
    const linkNodes = linkItems.map(item => {
      // 从 file_url 中提取文件名用于显示
      const fileName = extractFileNameFromUrl(item.file_url);

      return h("div", { class: "link-item mb-2" }, [
        h("p", { class: "font-bold text-sm", title: item.file_url }, fileName),
        h("input", {
          class: "el-input__inner",
          readonly: true,
          value: item.link,
          onClick: (e: MouseEvent) => {
            const input = e.target as HTMLInputElement;
            navigator.clipboard.writeText(input.value).then(() => {
              ElMessage.success(`“${fileName}” 的链接已复制！`);
            });
          }
        })
      ]);
    });

    ElMessageBox({
      title: `成功生成 ${linkItems.length} 个直链`,
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
