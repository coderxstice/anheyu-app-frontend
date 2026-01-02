/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-15 11:31:00
 * @LastEditTime: 2025-09-22 12:08:58
 * @LastEditors: 安知鱼
 */
import { getPluginsList } from "./build/plugins";
import { include, exclude } from "./build/optimize";
import { type UserConfigExport, type ConfigEnv, loadEnv } from "vite";
import ElementPlus from "unplugin-element-plus/vite";
import {
  root,
  alias,
  wrapperEnv,
  pathResolve,
  __APP_INFO__
} from "./build/utils";

export default ({ mode }: ConfigEnv): UserConfigExport => {
  const { VITE_CDN, VITE_PORT, VITE_COMPRESSION, VITE_PUBLIC_PATH } =
    wrapperEnv(loadEnv(mode, root));
  return {
    base: VITE_PUBLIC_PATH,
    root,
    resolve: {
      alias
    },
    // 服务端渲染
    server: {
      // 端口号
      port: VITE_PORT,
      host: "0.0.0.0",
      // 本地跨域代理 https://cn.vitejs.dev/config/server-options.html#server-proxy
      proxy: {
        "/api": {
          target: "http://localhost:8091",
          changeOrigin: true
        },
        "/f/": {
          target: "http://localhost:8091",
          changeOrigin: true
        },
        "/needcache/": {
          target: "http://localhost:8091",
          changeOrigin: true
        },
        // SEO 相关文件代理到后端
        "/sitemap.xml": {
          target: "http://localhost:8091",
          changeOrigin: true
        },
        "/robots.txt": {
          target: "http://localhost:8091",
          changeOrigin: true
        },
        // RSS Feed 代理到后端
        "/rss.xml": {
          target: "http://localhost:8091",
          changeOrigin: true
        },
        "/feed.xml": {
          target: "http://localhost:8091",
          changeOrigin: true
        },
        "/atom.xml": {
          target: "http://localhost:8091",
          changeOrigin: true
        }
      },
      // 首屏优化：预热关键文件，优化初始页面加载
      warmup: {
        clientFiles: [
          "./index.html",
          "./src/main.ts",
          "./src/App.vue",
          "./src/router/index.ts",
          "./src/store/modules/user.ts",
          "./src/layout/index.vue",
          "./src/views/login/index.vue",
          // 预热首屏关键组件
          "./src/views/post/post-home/index.vue",
          "./src/layout/frontend/index.vue"
        ]
      }
    },
    plugins: [
      ...getPluginsList(VITE_CDN, VITE_COMPRESSION),
      // Element Plus 按需导入样式插件
      ElementPlus({})
    ],
    // https://cn.vitejs.dev/config/dep-optimization-options.html#dep-optimization-options
    optimizeDeps: {
      include,
      exclude
    },
    build: {
      // https://cn.vitejs.dev/guide/build.html#browser-compatibility
      target: "es2015",
      sourcemap: false,
      // 消除打包大小超过500kb警告
      chunkSizeWarningLimit: 4000,
      rollupOptions: {
        input: {
          index: pathResolve("./index.html", import.meta.url)
        },
        output: {
          // 智能分包策略 - 使用函数形式避免代码重复
          manualChunks(id) {
            if (id.includes("node_modules")) {
              // ECharts 相关
              if (id.includes("echarts")) {
                return "vendor-echarts";
              }
              // Monaco Editor 相关
              if (id.includes("monaco-editor")) {
                return "vendor-monaco";
              }
              // Markdown 编辑器
              if (id.includes("md-editor-v3")) {
                return "vendor-md-editor";
              }
              // 视频播放器
              if (id.includes("xgplayer")) {
                return "vendor-xgplayer";
              }
              // Element Plus 单独分包
              if (id.includes("element-plus")) {
                return "vendor-element";
              }
              // Vue 生态核心
              if (
                id.includes("/vue/") ||
                id.includes("/@vue/") ||
                id.includes("/pinia/") ||
                id.includes("/vue-router/")
              ) {
                return "vendor-vue";
              }
            }
          },
          // 优化文件命名，便于缓存
          chunkFileNames: "assets/js/[name]-[hash].js",
          entryFileNames: "assets/js/[name]-[hash].js",
          assetFileNames: "assets/[ext]/[name]-[hash].[ext]"
        }
      },
      // 启用 CSS 代码分割
      cssCodeSplit: true
    },
    define: {
      __INTLIFY_PROD_DEVTOOLS__: false,
      __APP_INFO__: JSON.stringify(__APP_INFO__)
    }
  };
};
