/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-24 14:15:05
 * @LastEditTime: 2025-07-21 13:08:00
 * @LastEditors: 安知鱼
 */
import { h } from "vue";
import { ElIcon } from "element-plus";

// 从 @element-plus/icons-vue 导入结构性图标
import {
  Folder,
  Document,
  Picture as PictureIcon,
  VideoPlay,
  Headset,
  Tickets,
  Postcard
} from "@element-plus/icons-vue";
import { FileType } from "@/api/sys-file/type";

// 为某些特定文件类型使用 Iconify 图标，这是一个兼容的例子
// import PythonIcon from '@iconify-icons/logos/python'; // 示例

// 文件大小格式化
export function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// 时间格式化
export function formatTime(timestamp: number): string {
  const now = new Date().getTime();
  const diff = now - timestamp;

  const diffMinutes = Math.floor(diff / (1000 * 60));
  const diffHours = Math.floor(diff / (1000 * 60 * 60));
  const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return "刚刚";
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`;
  } else if (diffHours < 24) {
    return `${diffHours}小时前`;
  } else if (diffDays < 30) {
    return `${diffDays}天前`;
  } else {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
  }
}

// 根据文件类型获取图标
export function getFileIcon(item: { type: number; extension?: string }) {
  let iconComponent: object;

  if (item.type === FileType.Dir) {
    iconComponent = Folder;
    // 对于文件夹，可以给一个特定的颜色
    return h(ElIcon, { size: 20, color: "#FFCA28" }, () => h(iconComponent));
  }

  const ext = item.extension?.toLowerCase() || "";
  const iconMap: Record<string, any> = {
    // Images
    jpg: PictureIcon,
    jpeg: PictureIcon,
    png: PictureIcon,
    gif: PictureIcon,
    bmp: PictureIcon,
    svg: PictureIcon,
    webp: PictureIcon,
    ico: PictureIcon,
    avif: PictureIcon,
    // Videos
    mp4: VideoPlay,
    avi: VideoPlay,
    mkv: VideoPlay,
    mov: VideoPlay,
    // Audios
    mp3: Headset,
    wav: Headset,
    ogg: Headset,
    // Documents
    doc: Tickets,
    docx: Tickets,
    pdf: Postcard,
    txt: Document,
    // Code
    py: Document,
    js: Document,
    html: Document,
    css: Document
  };

  // 查找对应的图标，如果找不到，则使用默认的 Document 图标
  iconComponent = iconMap[ext] || Document;

  // 使用 h() 函数创建并返回一个 VNode
  // 这是关键的修正点
  return h(ElIcon, { size: 20 }, () => h(iconComponent));
}
