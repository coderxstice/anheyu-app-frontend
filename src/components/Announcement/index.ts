/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-22 00:40:29
 * @LastEditTime: 2025-06-22 00:50:07
 * @LastEditors: 安知鱼
 */
// src/components/Announcement/index.ts
import { addDialog } from "@/components/ReDialog/index";
import { h } from "vue";
import { ElButton } from "element-plus";

// 用于存储公告内容在 localStorage 的键名，与 Pinia store 中的 SiteAnnouncement 对应
const ANNOUNCEMENT_READ_KEY = "app_announcement_read_content";

/**
 * 检查并显示系统公告
 * @param announcementContent 从配置中获取的公告内容
 */
export const checkAndShowAnnouncementByConfig = (
  announcementContent: string
) => {
  if (!announcementContent || announcementContent.trim() === "") {
    // 如果公告内容为空，则清空本地存储，确保下次有内容时能再次显示
    localStorage.removeItem(ANNOUNCEMENT_READ_KEY);
    return;
  }

  const storedReadContent = localStorage.getItem(ANNOUNCEMENT_READ_KEY);

  // 如果最新的公告内容与已读内容不一致，或者没有已读内容，则显示公告
  if (announcementContent !== storedReadContent) {
    addDialog({
      title: "系统公告",
      width: "40%",
      fullscreenIcon: true,
      closeOnClickModal: false,
      closeOnPressEscape: false,
      contentRenderer: () => h("div", { innerHTML: announcementContent }),
      footerRenderer: ({ options }) =>
        h("div", { style: "text-align: center;" }, [
          h(
            ElButton,
            {
              type: "primary",
              onClick: () => {
                localStorage.setItem(
                  ANNOUNCEMENT_READ_KEY,
                  announcementContent
                );
                options.visible = false;
              }
            },
            "我已知晓"
          )
        ])
    });
  }
};
