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

  // 恢复meta标签的原始主题色
  if (originalColors.main) {
    updateMetaThemeColor(originalColors.main);
  } else {
    restoreMetaThemeColor();
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

    // 更新页面meta标签的主题色
    updateMetaThemeColor(primaryColor);
  } else {
    restoreOriginalThemeColors();
    restoreMetaThemeColor();
  }
};

/**
 * @description 更新meta标签的主题色
 * @param color - 主题色值
 */
const updateMetaThemeColor = (color: string) => {
  // 更新 theme-color meta标签
  let themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (!themeColorMeta) {
    themeColorMeta = document.createElement("meta");
    themeColorMeta.setAttribute("name", "theme-color");
    document.head.appendChild(themeColorMeta);
  }
  themeColorMeta.setAttribute("content", color);

  // 更新 msapplication-TileColor meta标签
  let tileColorMeta = document.querySelector(
    'meta[name="msapplication-TileColor"]'
  );
  if (!tileColorMeta) {
    tileColorMeta = document.createElement("meta");
    tileColorMeta.setAttribute("name", "msapplication-TileColor");
    document.head.appendChild(tileColorMeta);
  }
  tileColorMeta.setAttribute("content", color);

  // 更新 Open Graph 主题色标签
  let ogThemeColorMeta = document.querySelector(
    'meta[property="og:theme-color"]'
  );
  if (!ogThemeColorMeta) {
    ogThemeColorMeta = document.createElement("meta");
    ogThemeColorMeta.setAttribute("property", "og:theme-color");
    document.head.appendChild(ogThemeColorMeta);
  }
  ogThemeColorMeta.setAttribute("content", color);
};

/**
 * @description 恢复meta标签的默认主题色
 */
const restoreMetaThemeColor = () => {
  // 恢复默认主题色到meta标签
  const defaultThemeColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--anzhiyu-background")
      .trim() || "#f7f9fe";

  updateMetaThemeColor(defaultThemeColor);
};
