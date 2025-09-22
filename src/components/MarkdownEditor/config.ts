/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-14 13:56:16
 * @LastEditTime: 2025-09-14 23:04:49
 * @LastEditors: 安知鱼
 */
export async function installMarkdownEditorExtensions() {
  try {
    const [{ config }, TabsPlugin] = await Promise.all([
      import("md-editor-v3"),
      import("./plugins/markdown-it-tabs-plugin").then(m => m.default)
    ]);

    config({
      markdownItConfig(mdit) {
        mdit.use(TabsPlugin);
      }
    });
  } catch (error) {
    console.error("Failed to install markdown editor extensions:", error);
  }
}
