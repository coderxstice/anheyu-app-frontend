/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-14 13:56:16
 * @LastEditTime: 2025-09-14 23:04:49
 * @LastEditors: 安知鱼
 */
import { config } from "md-editor-v3";
import TabsPlugin from "./plugins/markdown-it-tabs-plugin";

export function installMarkdownEditorExtensions() {
  config({
    markdownItConfig(mdit) {
      mdit.use(TabsPlugin);
    }
  });
}
