/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-07-31 11:10:45
 * @LastEditTime: 2025-07-31 11:10:51
 * @LastEditors: 安知鱼
 */
export const getIconClass = (iconName: string) => {
  if (iconName?.startsWith("anzhiyu")) return ["anzhiyufont", iconName];
  if (iconName?.startsWith("fa")) return iconName.split(" ");
  return [iconName];
};
