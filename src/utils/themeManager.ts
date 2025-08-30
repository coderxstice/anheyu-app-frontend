/**
 * @description 主题色管理工具
 * @Author: 安知鱼
 * @Date: 2025-01-27
 */

/**
 * @description 保存原始主题色
 */
let originalColors = {
  main: "",
  mainOpDeep: "",
  mainOpLight: ""
};

/**
 * @description 保存当前页面的原始主题色
 */
export const saveOriginalThemeColors = () => {
  const rootStyle = getComputedStyle(document.documentElement);
  originalColors.main = rootStyle.getPropertyValue("--anzhiyu-main").trim();
  originalColors.mainOpDeep = rootStyle
    .getPropertyValue("--anzhiyu-main-op-deep")
    .trim();
  originalColors.mainOpLight = rootStyle
    .getPropertyValue("--anzhiyu-main-op-light")
    .trim();
};

/**
 * @description 恢复原始主题色
 */
export const restoreOriginalThemeColors = () => {
  const rootStyle = document.documentElement.style;
  if (originalColors.main) {
    rootStyle.setProperty("--anzhiyu-main", originalColors.main);
  }
  if (originalColors.mainOpDeep) {
    rootStyle.setProperty("--anzhiyu-main-op-deep", originalColors.mainOpDeep);
  }
  if (originalColors.mainOpLight) {
    rootStyle.setProperty(
      "--anzhiyu-main-op-light",
      originalColors.mainOpLight
    );
  }
};

/**
 * @description 重置主题色到默认值
 */
export const resetThemeToDefault = () => {
  const rootStyle = document.documentElement.style;
  rootStyle.setProperty("--anzhiyu-main", "var(--anzhiyu-theme)");
  rootStyle.setProperty(
    "--anzhiyu-main-op-deep",
    "var(--anzhiyu-theme-op-deep)"
  );
  rootStyle.setProperty(
    "--anzhiyu-main-op-light",
    "var(--anzhiyu-theme-op-light)"
  );
};

/**
 * @description 设置文章主题色
 * @param primaryColor - 文章的主色调
 */
export const setArticleTheme = (primaryColor: string) => {
  const rootStyle = document.documentElement.style;
  if (primaryColor) {
    rootStyle.setProperty("--anzhiyu-main", primaryColor);
    // 简单判断是否为 HEX 颜色以添加透明度
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(primaryColor)) {
      rootStyle.setProperty("--anzhiyu-main-op-deep", `${primaryColor}dd`);
      rootStyle.setProperty("--anzhiyu-main-op-light", `${primaryColor}0d`);
    } else {
      // 如果不是标准 HEX，则直接使用原色
      rootStyle.setProperty("--anzhiyu-main-op-deep", primaryColor);
      rootStyle.setProperty("--anzhiyu-main-op-light", primaryColor);
    }
  } else {
    restoreOriginalThemeColors();
  }
};
