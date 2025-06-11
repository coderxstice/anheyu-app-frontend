/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-04-10 16:52:36
 * @LastEditTime: 2025-04-12 13:46:45
 * @LastEditors: 安知鱼
 */

/**
 * 从URL中提取文件扩展名
 * @param url 图片URL
 * @returns 文件扩展名（如：'gif'），不带点
 */
function getFileExtension(url: string): string {
  // 先清除查询参数和哈希
  const cleanUrl = url.split("?")[0].split("#")[0];

  // 匹配最后一个点后面的内容
  const extensionMatch = cleanUrl.match(/\.([a-z0-9]+)$/i);

  // 返回小写的扩展名（不带点），如果没有则返回空字符串
  return extensionMatch ? extensionMatch[1].toLowerCase() : "";
}

export { getFileExtension };
