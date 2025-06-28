// src/views/system/file-management/hooks/useFileDownload.ts

import { ref, h } from "vue";
import { ElMessage, ElNotification } from "element-plus";
import JSZip from "jszip";
import {
  downloadFileApi,
  getFolderTreeApi,
  fetchBlobFromUrl,
  getFileDetailsApi
} from "@/api/sys-file/sys-file";
import type { FolderTreeFile } from "@/api/sys-file/sys-file";
import { type FileItem, FileType } from "@/api/sys-file/type";

export function useFileDownload() {
  const isDownloading = ref(false); // 可以用来在UI上禁用其他操作

  const handlePackageDownload = async (
    itemsToDownload: FileItem[],
    zipName: string
  ) => {
    isDownloading.value = true;
    const notificationTitle = ref("正在准备打包下载");
    const notificationMessage = ref("正在获取文件列表，请稍候...");

    const notification = ElNotification({
      title: "打包下载",
      message: h("div", null, [
        h(
          "p",
          { style: "font-weight: bold; margin: 0; padding-bottom: 6px;" },
          notificationTitle.value // 必须使用.value获取
        ),
        h(
          "p",
          { style: "margin: 0; font-size: 12px;" },
          notificationMessage.value // 必须使用.value获取
        )
      ]),
      duration: 0,
      showClose: false,
      type: "info",
      position: "bottom-right"
    });

    const zip = new JSZip();
    const filesToFetch: FolderTreeFile[] = [];

    try {
      for (const item of itemsToDownload) {
        if (item.type === FileType.Dir) {
          notificationMessage.value = `正在分析文件夹 [${item.name}]...`;
          const treeResponse = await getFolderTreeApi(item.id);
          if (treeResponse.code === 200 && treeResponse.data.files) {
            const filesInFolder = treeResponse.data.files.map(file => ({
              ...file,
              relative_path: `${item.name}/${file.relative_path}`
            }));
            filesToFetch.push(...filesInFolder);
          }
        } else {
          const detailResponse = await getFileDetailsApi(item.id);
          if (detailResponse.code === 200 && detailResponse.data.url) {
            filesToFetch.push({
              url: detailResponse.data.url,
              relative_path: item.name,
              size: item.size
            });
          }
        }
      }

      if (filesToFetch.length === 0) {
        ElMessage.info("所选项目中没有可下载的文件。");
        return;
      }

      notificationTitle.value = `开始打包下载 (${filesToFetch.length}个文件)`;
      for (let i = 0; i < filesToFetch.length; i++) {
        notificationMessage.value = `(${i + 1}/${filesToFetch.length}) 正在处理: ${filesToFetch[i].relative_path}`;
        try {
          const blob = await fetchBlobFromUrl(filesToFetch[i].url);
          zip.file(filesToFetch[i].relative_path, blob);
        } catch (e: any) {
          zip.file(
            `${filesToFetch[i].relative_path}.error.txt`,
            `下载此文件失败: ${e.message}`
          );
        }
      }

      notificationTitle.value = "正在生成 ZIP 文件";
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${zipName}.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      ElNotification.success({
        title: "下载完成",
        message: `文件 [${zipName}.zip] 已成功打包。`,
        position: "bottom-right"
      });
    } catch (error: any) {
      ElMessage.error(error.message || "打包下载失败");
    } finally {
      notification.close();
      isDownloading.value = false;
    }
  };

  const onActionDownload = async (getSelectedFileItems: () => FileItem[]) => {
    const selectedItems = getSelectedFileItems();
    if (selectedItems.length === 0) {
      ElMessage.warning("请选择要下载的项目");
      return;
    }
    if (selectedItems.length === 1 && selectedItems[0].type === FileType.File) {
      ElMessage.info(`开始下载文件: ${selectedItems[0].name}`);
      await downloadFileApi(selectedItems[0].id, selectedItems[0].name);
      return;
    }
    const zipName =
      selectedItems.length === 1 && selectedItems[0].type === FileType.Dir
        ? selectedItems[0].name
        : "打包下载";
    handlePackageDownload(selectedItems, zipName);
  };

  const handleDownloadFolder = async (folderId: string) => {
    try {
      const res = await getFileDetailsApi(folderId);
      if (res.code === 200 && res.data) {
        handlePackageDownload([res.data], res.data.name);
      } else {
        ElMessage.error(res.message || "无法获取文件夹信息以下载");
      }
    } catch (error: any) {
      ElMessage.error(error.message || "请求文件夹信息失败");
    }
  };

  return {
    isDownloading,
    onActionDownload,
    handleDownloadFolder
  };
}
