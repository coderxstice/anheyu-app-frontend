import type { FileItem } from "./type";

// --- 1. 模拟数据生成辅助工具 ---

/**
 * 在指定时间范围内生成一个随机日期字符串
 * @param start 起始日期
 * @param end 结束日期
 * @returns ISO 格式的日期字符串
 */
const randomDate = (start: Date, end: Date): string => {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  ).toISOString();
};

// 用于生成唯一 ID 的计数器
let fileIdCounter = 0;

/**
 * 文件工厂函数，用于创建文件或文件夹对象
 * @param options 文件属性，如 name, type, ext, path
 * @returns 一个完整的 FileItem 对象
 */
const createFile = (options: Partial<FileItem>): FileItem => {
  const isDir = options.type === "dir";
  const modifiedDate = new Date(
    new Date(2024, 0, 1).getTime() +
      Math.random() * (new Date().getTime() - new Date(2024, 0, 1).getTime())
  );
  const defaults: Partial<FileItem> = {
    id: `${options.type}-${++fileIdCounter}`,
    path: "/",
    // 为文件生成随机大小，文件夹大小为 0
    size: isDir ? 0 : Math.floor(Math.random() * 50000) + 100,
    // 如果是文件夹，扩展名为空
    ext: isDir ? "" : options.name?.split(".").pop()?.toLowerCase() || "",
    // 生成2024年至今的随机修改日期
    modified: randomDate(new Date(2024, 0, 1), new Date()),
    uploaded: new Date(
      modifiedDate.getTime() - Math.random() * 1000 * 60 * 60 * 24
    ).toISOString()
  };
  // 合并默认属性和传入的特定属性
  return { ...defaults, ...options } as FileItem;
};

// --- 2. 构建模拟数据库 ---

const allFiles: Record<string, FileItem[]> = {};

// 定义目录路径常量，方便引用
const ROOT = "/";
const DOCS = "/我的文档";
const PHOTOS = "/照片";
const PROJECTS = "/项目";
const TRIP_JAPAN = "/照片/日本之旅";

// 使用工厂函数填充文件数据
allFiles[ROOT] = [
  createFile({ name: "照片", type: "dir", path: ROOT }),
  createFile({ name: "我的文档", type: "dir", path: ROOT }),
  createFile({ name: "项目", type: "dir", path: ROOT }),
  createFile({ name: "项目介绍.pptx", type: "file", path: ROOT, size: 4678 }),
  createFile({ name: "预算.xls", type: "file", path: ROOT, size: 250 }),
  createFile({ name: "README.md", type: "file", path: ROOT, size: 2 })
];

allFiles[DOCS] = [
  createFile({ name: "说明文档.pdf", type: "file", path: DOCS, size: 128 }),
  createFile({ name: "会议记录.txt", type: "file", path: DOCS, size: 15 })
];

allFiles[PHOTOS] = [
  createFile({ name: "日本之旅", type: "dir", path: PHOTOS }),
  createFile({ name: "家庭聚会.jpg", type: "file", path: PHOTOS, size: 3450 }),
  createFile({ name: "风景-001.png", type: "file", path: PHOTOS, size: 5120 }),
  createFile({ name: "壁纸.gif", type: "file", path: PHOTOS, size: 12345 })
];

allFiles[TRIP_JAPAN] = [
  createFile({
    name: "东京塔.jpg",
    type: "file",
    path: TRIP_JAPAN,
    size: 4200
  }),
  createFile({
    name: "富士山.jpg",
    type: "file",
    path: TRIP_JAPAN,
    size: 3800
  }),
  createFile({
    name: "京都清水寺.jpg",
    type: "file",
    path: TRIP_JAPAN,
    size: 4500
  })
];

allFiles[PROJECTS] = [
  createFile({
    name: "项目源码.zip",
    type: "file",
    path: PROJECTS,
    size: 23789
  }),
  createFile({ name: "依赖文件.json", type: "file", path: PROJECTS, size: 5 }),
  createFile({ name: "启动脚本.js", type: "file", path: PROJECTS, size: 1 })
];

// --- 3. 模拟 API 函数 (外部接口保持不变) ---

/**
 * 模拟根据路径获取文件列表的 API
 * @param path 目录路径
 * @returns Promise<FileItem[]>
 */
export const fetchFilesByPath = (path: string): Promise<FileItem[]> => {
  console.log(`模拟 API 请求: 获取路径 '${path}' 下的文件列表...`);

  return new Promise(resolve => {
    setTimeout(() => {
      resolve(allFiles[path] || []); // 如果路径不存在，返回空数组
    }, 300); // 缩短延迟，提升体验
  });
};

/**
 * 模拟上传文件的 API
 * @param file 要上传的文件
 * @param path 上传到的目标路径
 * @returns Promise<FileItem> - 返回上传成功后，在服务器上的文件信息
 */
export const uploadFile = (file: File, path: string): Promise<FileItem> => {
  console.log(`模拟 API 请求: 上传文件 '${file.name}' 到路径 '${path}'...`);
  const uploadDuration = 1000 + Math.random() * 1000;

  return new Promise(resolve => {
    setTimeout(() => {
      // 使用工厂函数创建新文件对象
      const newFile = createFile({
        name: file.name,
        path: path,
        size: Math.round(file.size / 1024),
        type: "file"
      });
      console.log("模拟 API: 文件上传成功", newFile);
      // 将新文件添加到模拟数据库中
      if (!allFiles[path]) {
        allFiles[path] = [];
      }
      allFiles[path].push(newFile);
      resolve(newFile);
    }, uploadDuration);
  });
};

export const createFileApi = (
  path: string,
  name: string
): Promise<FileItem> => {
  console.log(`模拟 API 请求: 创建文件 '${name}' 在路径 '${path}'...`);
  return new Promise(resolve => {
    setTimeout(() => {
      const newFile = createFile({
        name,
        path,
        type: "file"
      });
      if (!allFiles[path]) {
        allFiles[path] = [];
      }
      allFiles[path].push(newFile);
      resolve(newFile);
    }, 300); // 模拟创建文件的延迟
  });
};

export const createFolderApi = (
  path: string,
  name: string
): Promise<FileItem> => {
  console.log(`模拟 API 请求: 创建文件夹 '${name}' 在路径 '${path}'...`);
  return new Promise(resolve => {
    setTimeout(() => {
      const newDir = createFile({
        name,
        path,
        type: "dir"
      });
      if (!allFiles[path]) {
        allFiles[path] = [];
      }
      allFiles[path].push(newDir);
      resolve(newDir);
    }, 300); // 模拟创建目录的延迟
  });
};
