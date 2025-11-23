/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-22 00:40:29
 * @LastEditTime: 2025-08-25 19:05:34
 * @LastEditors: 安知鱼
 */
// src/components/AnNouncement/index.ts
import { addDialog } from "@/components/AnDialog/index";
import { h } from "vue";
import { ElButton } from "element-plus";

// 用于存储公告内容在 localStorage 的键名，与 Pinia store 中的 SiteAnnouncement 对应
const ANNOUNCEMENT_READ_KEY = "app_announcement_read_content";

// 用于标记本次会话是否已显示公告的 localStorage 键名
const ANNOUNCEMENT_SHOWN_SESSION_KEY = "app_announcement_shown_in_session";

/**
 * 检查并显示系统公告
 * @param announcementContent 从配置中获取的公告内容
 */
export const checkAndShowAnnouncementByConfig = (
  announcementContent: string
) => {
  // 如果本次会话已经显示过公告，则不再显示
  if (localStorage.getItem(ANNOUNCEMENT_SHOWN_SESSION_KEY) === "true") {
    return;
  }

  if (!announcementContent || announcementContent.trim() === "") {
    // 如果公告内容为空，则清空本地存储，确保下次有内容时能再次显示
    localStorage.removeItem(ANNOUNCEMENT_READ_KEY);
    localStorage.removeItem(ANNOUNCEMENT_SHOWN_SESSION_KEY);
    return;
  }

  const storedReadContent = localStorage.getItem(ANNOUNCEMENT_READ_KEY);

  // 如果最新的公告内容与已读内容不一致，或者没有已读内容，则显示公告
  if (announcementContent !== storedReadContent) {
    // 使用 localStorage 标记本次会话已显示公告
    localStorage.setItem(ANNOUNCEMENT_SHOWN_SESSION_KEY, "true");

    // 判断是否为移动端
    const isMobile = window.innerWidth < 768;

    addDialog({
      title: "系统公告",
      // 在移动端设备上应用不同的宽度
      width: isMobile ? "80%" : "40%",
      fullscreenIcon: true,
      closeOnClickModal: false,
      closeOnPressEscape: false,
      showFooter: true,
      hideFooter: false,
      contentRenderer: () => h("div", { innerHTML: announcementContent }),
      // 使用 footerRenderer 自定义底部按钮
      footerRenderer: ({ options }) => {
        return h(
          "div",
          {
            style: {
              display: "flex",
              justifyContent: "flex-end",
              padding: "10px 0"
            }
          },
          [
            h(
              ElButton,
              {
                type: "primary",
                onClick: () => {
                  // 将当前公告内容存入 localStorage
                  localStorage.setItem(
                    ANNOUNCEMENT_READ_KEY,
                    announcementContent
                  );
                  // 关闭弹窗
                  options.visible = false;
                }
              },
              () => "我已知晓"
            )
          ]
        );
      }
    });
  }
};
