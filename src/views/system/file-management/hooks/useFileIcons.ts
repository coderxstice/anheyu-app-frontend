/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-24 22:30:17
 * @LastEditTime: 2025-06-24 22:46:09
 * @LastEditors: 安知鱼
 */
import type { Component } from "vue";
import type { FileItem } from "@/api/sys-file/type";

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

const iconMap: Record<string, Component> = {
  mp3: FileMusic,
  wav: FileMusic,
  mp4: FileVideo,
  mov: FileVideo,
  zip: FileZip,
  rar: FileRar,
  "7z": FileRar,
  xls: FileExcel,
  xlsx: FileExcel,
  ppt: FilePpt,
  pptx: FilePpt,
  txt: FileTxt,
  html: FileHtml,
  css: FileCss,
  js: FileJs,
  ts: FileJs,
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
  gif: FileImage,
  svg: FileImage,
  pdf: FilePdf,
  exe: FileExe
};

export function useFileIcons() {
  const getFileIcon = (item: FileItem): Component => {
    if (item.type === "dir") {
      return FileDir;
    }
    const ext = item.ext?.toLowerCase() || "";
    return iconMap[ext] || FileOther;
  };

  return { getFileIcon };
}
