/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-11 11:59:32
 * @LastEditTime: 2025-07-21 13:07:34
 * @LastEditors: 安知鱼
 */
import { cdn } from "./cdn";
import vue from "@vitejs/plugin-vue";
import { viteBuildInfo } from "./info";
import svgLoader from "vite-svg-loader";
import type { PluginOption } from "vite";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { configCompressPlugin } from "./compress";
import removeNoMatch from "vite-plugin-router-warn";
import { visualizer } from "rollup-plugin-visualizer";
import removeConsole from "vite-plugin-remove-console";
import { codeInspectorPlugin } from "code-inspector-plugin";
// import { vitePluginFakeServer } from "vite-plugin-fake-server";
import { VitePWA } from "vite-plugin-pwa";

import { promises as fs } from "node:fs";
import { resolve } from "node:path";

export function getPluginsList(
  VITE_CDN: boolean,
  VITE_COMPRESSION: ViteCompression
): PluginOption[] {
  const lifecycle = process.env.npm_lifecycle_event;
  return [
    vue(),
    vueJsx(),
    codeInspectorPlugin({
      bundler: "vite",
      hideConsole: true
    }),
    viteBuildInfo(),
    removeNoMatch(),
    // vitePluginFakeServer({ ... }),
    svgLoader(),
    VITE_CDN ? cdn : null,
    configCompressPlugin(VITE_COMPRESSION),
    removeConsole({ external: ["src/assets/iconfont/iconfont.js"] }),
    // 关于 `(null as any)`: 这是一个类型断言，用于告诉 TypeScript 在条件为假时，一个 null 值可以被接受为 PluginOption 类型。这在条件化插件的场景下是常见且合理的用法。
    lifecycle === "report"
      ? visualizer({ open: true, brotliSize: true, filename: "report.html" })
      : (null as any),
    VitePWA({
      registerType: "prompt",
      injectRegister: "auto",
      manifest: false,
      workbox: {
        maximumFileSizeToCacheInBytes: 10000000,
        navigateFallbackDenylist: [/^\/api\/(.+)/, /^\/f\/(.+)/],

        runtimeCaching: [
          {
            // 匹配 /static/img/ 目录下的所有图片文件
            urlPattern:
              /\/static\/img\/.*\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/i,
            // 使用 CacheFirst 策略
            // 1. 请求来了，先去缓存里找。
            // 2. 如果缓存里有，直接从缓存返回（速度极快）。
            // 3. 如果缓存里没有，就去请求网络，拿到响应后，存入缓存并返回给浏览器。
            // 这个策略非常适合不经常变化的静态资源，如图标、背景图等。
            handler: "CacheFirst",
            options: {
              // 为这个缓存策略创建一个专门的缓存空间
              cacheName: "yuyu-image-cache",
              // 配置插件，用于管理缓存的有效期和数量
              expiration: {
                // 最多缓存 100 张图片
                maxEntries: 100,
                // 缓存 30 天
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    }),

    // 自定义插件 - 异步加载 CSS
    {
      name: "load-stylesheet-async",
      transformIndexHtml(html) {
        return html.replace(
          /<link rel="stylesheet" crossorigin href="(.+?)">/g,
          `<link rel="stylesheet" crossorigin href="$1" media="print" onload="this.media='all'">`
        );
      }
    },

    // 自定义插件 - 生成版本信息文件
    {
      name: "generate-version",
      async writeBundle(outputOptions) {
        const version = {
          name: process.env.npm_package_name,
          version: process.env.npm_package_version
        };
        // Rollup 的 `outputOptions.dir` 钩子会提供输出目录的绝对路径
        const path = resolve(outputOptions.dir, "version.json");
        // 4. 使用导入的 'fs' (fs.promises) 来异步写入文件
        await fs.writeFile(path, JSON.stringify(version, null, 2));
      }
    }
  ];
}
