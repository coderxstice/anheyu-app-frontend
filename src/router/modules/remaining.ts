/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-04-08 17:29:06
 * @LastEditTime: 2025-08-02 11:23:13
 * @LastEditors: 安知鱼
 */
const Layout = () => import("@/layout/index.vue"); // 后台布局
const FrontendLayout = () => import("@/layout/frontend/index.vue");
import { LOCAL_STORAGE_KEY } from "@/store/modules/siteConfig";

const configLocal = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
const appName = configLocal?.config?.APP_NAME || "安和鱼";

export default [
  {
    path: "/",
    component: FrontendLayout,
    meta: {
      title: "前台",
      rank: 100
    },
    children: [
      {
        path: "/",
        name: "PostHome",
        component: () => import("@/views/post/post-home/index.vue"),
        meta: {
          title: "首页",
          showLink: false
        }
      },
      {
        path: "p/:id",
        name: "PostDetail",
        component: () => import("@/views/post/post-detail/index.vue"),
        meta: {
          title: "文章详情",
          showLink: false
        }
      }
    ]
  },
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
  }
] satisfies Array<RouteConfigsTable>;
