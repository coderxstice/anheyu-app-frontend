/*
 * @Description: CDN 配置 - 将大型第三方库通过 CDN 加载，减少打包体积
 * @Author: 安知鱼
 * @Date: 2025-06-15 11:31:00
 * @LastEditTime: 2026-01-17 17:00:00
 * @LastEditors: 安知鱼
 */
import { Plugin as importToCDN } from "vite-plugin-cdn-import";

/**
 * @description 打包时采用`cdn`模式，仅限外网使用（默认不采用，如果需要采用cdn模式，请在 .env.production 文件，将 VITE_CDN 设置成true）
 * 平台采用国内cdn：https://www.bootcdn.cn，当然你也可以选择 https://unpkg.com 或者 https://www.jsdelivr.com
 * 注意：上面提到的仅限外网使用也不是完全肯定的，如果你们公司内网部署的有相关js、css文件，也可以将下面配置对应改一下，整一套内网版cdn
 *
 * CDN 体积优化说明：
 * - Vue 生态核心：vue + vue-router + pinia ≈ 150KB (gzip: ~50KB)
 * - 工具库：axios + dayjs ≈ 50KB (gzip: ~15KB)
 * - echarts：≈ 1MB (gzip: ~300KB) - 建议 CDN
 * - element-plus：≈ 2MB (gzip: ~500KB) - 可选 CDN
 *
 * 启用 CDN 后预计可减少打包体积 1-3MB
 */
export const cdn = importToCDN({
  // 全局 prodUrl：如果你希望为大多数模块使用一个统一的 CDN 模板，可以在这里设置。
  // 如果某个 module 内部有 path/css 但没有定义 prodUrl，会使用这个全局模板来拼接。
  // 如果所有模块的链接都是完全自定义的完整链接，这个字段可以省略或设置为默认值。
  // 推荐保持默认值或者你最常用的 CDN 模板，作为未明确指定 prodUrl 的模块的兜底。
  prodUrl: "https://cdn.cbd.int/{name}@{version}/{path}",
  modules: [
    // ========== Vue 生态核心 ==========
    {
      name: "vue",
      var: "Vue",
      path: "dist/vue.global.prod.js",
      prodUrl: "https://cdn.cbd.int/{name}@{version}/{path}"
    },
    {
      name: "vue-router",
      var: "VueRouter",
      path: "dist/vue-router.global.prod.js",
      prodUrl: "https://cdn.cbd.int/{name}@{version}/{path}"
    },
    {
      name: "vue-demi",
      var: "VueDemi",
      path: "lib/index.iife.js",
      prodUrl: "https://cdn.cbd.int/{name}@{version}/{path}"
    },
    {
      name: "pinia",
      var: "Pinia",
      path: "dist/pinia.iife.prod.js",
      prodUrl: "https://cdn.cbd.int/{name}@{version}/{path}"
    },

    // ========== 工具库 ==========
    {
      name: "axios",
      var: "axios",
      path: "dist/axios.min.js",
      prodUrl: "https://cdn.cbd.int/{name}@{version}/{path}"
    },
    {
      name: "dayjs",
      var: "dayjs",
      path: "dayjs.min.js",
      prodUrl: "https://cdn.cbd.int/{name}@{version}/{path}"
    }

    // ========== 可选：大型库 CDN（取消注释启用）==========
    // 注意：启用这些 CDN 需要确保网络环境稳定，否则可能影响用户体验
    // {
    //   name: "echarts",
    //   var: "echarts",
    //   path: "dist/echarts.min.js",
    //   prodUrl: "https://cdn.cbd.int/{name}@{version}/{path}"
    // },
    // {
    //   name: "element-plus",
    //   var: "ElementPlus",
    //   path: "dist/index.full.min.js",
    //   css: "dist/index.css",
    //   prodUrl: "https://cdn.cbd.int/{name}@{version}/{path}"
    // }
  ]
});
