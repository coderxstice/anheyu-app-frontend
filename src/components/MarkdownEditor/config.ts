/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-14 13:56:16
 * @LastEditTime: 2025-08-14 14:01:39
 * @LastEditors: 安知鱼
 */
import { config } from "md-editor-v3";

// 引入组件依赖的插件
import tabsPlugin from "./plugins/markdown-it-tabs-plugin";
// 如果未来还有其他插件，也可以在这里引入

/**
 * 安装并配置 MarkdownEditor 的所有自定义插件和全局设置。
 * 任何使用此可移植组件的项目，只需在入口处调用此函数即可。
 */
export function installMarkdownEditorExtensions() {
  config({
    // 配置 markdown-it
    markdownItConfig(mdit) {
      // 使用 tabs 插件
      mdit.use(tabsPlugin);

      // 如果有其他插件，也可以在这里继续 .use()
      // mdit.use(anotherPlugin);
    }
    // 如果有其他全局配置，也可以在这里添加
    // editorConfig: { ... }
  });
}
