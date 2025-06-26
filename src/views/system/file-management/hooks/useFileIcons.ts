/*
 * @Description: 文件图标相关的 Hook
 * @Author: 安知鱼
 * @Date: 2025-06-24 22:30:17
 * @LastEditTime: 2025-06-26 16:29:11
 * @LastEditors: 安知鱼
 */
import type { Component } from "vue";
// 引入 FileItem 和 FileType 枚举
import { type FileItem, FileType } from "@/api/sys-file/type";

// 图标资源路径通常使用 @ 别名，指向 src，这个一般不用改
import FileDir from "@/assets/icons/file-dir.svg?component";
import FileMusic from "@/assets/icons/file-music.svg?component";
import FileVideo from "@/assets/icons/file-video.svg?component";
import FileZip from "@/assets/icons/file-zip.svg?component";
import FileRar from "@/assets/icons/file-rar.svg?component";
import FileExcel from "@/assets/icons/file-excel.svg?component";
import FilePpt from "@/assets/icons/file-ppt.svg?component";
import FileTxt from "@/assets/icons/file-txt.svg?component";
import FileHtml from "@/assets/icons/file-html.svg?component";
import FileCss from "@/assets/icons/file-css.svg?component";
import FileJs from "@/assets/icons/file-js.svg?component";
import FileImage from "@/assets/icons/file-image.svg?component";
import FilePdf from "@/assets/icons/file-pdf.svg?component";
import FileExe from "@/assets/icons/file-exe.svg?component";
import FileOther from "@/assets/icons/file-other.svg?component";

// 图标映射表
const iconMap: Record<string, Component> = {
  // 音频
  mp3: FileMusic,
  wav: FileMusic,
  flac: FileMusic,
  aac: FileMusic,
  ogg: FileMusic,
  m4a: FileMusic,

  // 视频
  mp4: FileVideo,
  mov: FileVideo,
  avi: FileVideo,
  mkv: FileVideo,
  wmv: FileVideo,
  flv: FileVideo,
  webm: FileVideo,

  // 压缩包
  zip: FileZip,
  rar: FileRar,
  "7z": FileZip, // 7z 也可以映射到 zip 图标
  tar: FileZip,
  gz: FileZip,

  // 文档
  xls: FileExcel,
  xlsx: FileExcel,
  csv: FileExcel,
  ppt: FilePpt,
  pptx: FilePpt,
  txt: FileTxt,
  md: FileTxt, // Markdown 文件
  log: FileTxt, // 日志文件
  html: FileHtml,
  htm: FileHtml,
  css: FileCss,
  js: FileJs,
  ts: FileJs, // TypeScript
  json: FileJs, // JSON
  xml: FileHtml, // XML 可以用 HTML 图标或自定义

  // 图片
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
  gif: FileImage,
  svg: FileImage,
  webp: FileImage,
  bmp: FileImage,
  ico: FileImage,

  // PDF
  pdf: FilePdf,

  // 可执行文件
  exe: FileExe,
  msi: FileExe,
  bat: FileExe,
  sh: FileExe,

  // 其他常见文件类型（如果需要可以添加更多）
  doc: FileTxt, // Word 文档默认用 txt 或自定义
  docx: FileTxt // Word 文档
};

export function useFileIcons() {
  const getFileIcon = (item: FileItem): Component => {
    // 1. 判断是否是文件夹 (type: 1)
    console.log("useFileIcons", item);
    if (item.type === FileType.Dir) {
      return FileDir;
    }

    // 2. 判断是否是文件 (type: 0)
    if (item.type === FileType.File) {
      // 尝试从 item.ext 获取扩展名，如果不存在，则从 item.name 中解析
      const ext = (item.ext || item.name.split(".").pop() || "").toLowerCase();

      // 根据扩展名从 iconMap 中查找对应图标，如果找不到则返回 FileOther
      return iconMap[ext] || FileOther;
    }

    // 如果 type 既不是 FileType.Dir 也不是 FileType.File，返回一个默认图标
    // 这代表一个未知或错误的状态，可以根据需求返回 FileOther 或一个特定的错误图标
    return FileOther;
  };

  return { getFileIcon };
}
