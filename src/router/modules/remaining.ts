/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-04-08 17:29:06
 * @LastEditTime: 2025-07-25 18:39:22
 * @LastEditors: 安知鱼
 */
const Layout = () => import("@/layout/index.vue");
import { LOCAL_STORAGE_KEY } from "@/store/modules/siteConfig";

const configLocal = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));

const appName = configLocal?.config?.APP_NAME || "猫鱼";

export default [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/login/index.vue"),
    alias: "/login/reset",
    meta: {
      title: "登录",
      showLink: false,
      rank: 101
    }
  },
  {
    path: "/redirect",
    component: Layout,
    meta: {
      title: "加载中...",
      showLink: false,
      rank: 102
    },
    children: [
      {
        path: "/redirect/:path(.*)",
        name: "Redirect",
        component: () => import("@/layout/redirect.vue")
      }
    ]
  },
  {
    path: "/album",
    name: "AlbumHome",
    component: () => import("@/views/album-home/index.vue"),
    meta: {
      title: `${appName}`,
      showLink: false,
      rank: 103
    }
  },
  {
    path: "/p/:id",
    name: "PostDetail",
    component: () => import("@/views/post/post-detail/index.vue"),
    meta: {
      title: "文章详情",
      showLink: false,
      rank: 104
    }
  }
  // {
  //   path: "/PostHome",
  //   name: "PostHome",
  //   component: () => import("@/views/post/post-home/index.vue"),
  //   meta: {
  //     title: "首页",
  //     showLink: false,
  //     rank: 104
  //   }
  // }
] satisfies Array<RouteConfigsTable>;
