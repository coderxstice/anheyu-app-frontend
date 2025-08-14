import { config } from "md-editor-v3";
import TabsPlugin from "./plugins/markdown-it-tabs-plugin"; // 确保路径是您正确的路径

export function installMarkdownEditorExtensions() {
  config({
    markdownItConfig(mdit) {
      mdit.use(TabsPlugin);
    }
  });
}
