/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-04-08 17:29:06
 * @LastEditTime: 2025-08-04 16:28:15
 * @LastEditors: 安知鱼
 */
const Layout = () => import("@/layout/index.vue");
const FrontendLayout = () => import("@/layout/frontend/index.vue");
import { LOCAL_STORAGE_KEY } from "@/store/modules/siteConfig";

const configLocal = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
const appName = configLocal?.config?.APP_NAME || "安和鱼";
const subTitle = configLocal?.config?.SUB_TITLE || "安和鱼的个人博客";

export default [
  {
    path: "/",
    component: FrontendLayout,
    meta: {
      title: `${appName} - ${subTitle}`,
      rank: 100
    },
    children: [
      {
        path: "/",
        name: "PostHome",
        component: () => import("@/views/post/post-home/index.vue"),
        meta: {
          title: `${appName} - ${subTitle}`,
          showLink: false
        }
      },
      {
        path: "p/:id",
        name: "PostDetail",
        component: () => import("@/views/post/post-detail/index.vue"),
        meta: {
          title: `${appName} - 文章详情`,
          showLink: false
        }
      },
      {
        path: "page/:id",
        name: "PostPage",
        component: () => import("@/views/post/post-home/index.vue"),
        meta: {
          title: `${appName} - ${subTitle}`,
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
      title: `${appName} - 登录`,
      showLink: false,
      rank: 101
    }
  },
  {
    path: "/redirect",
    component: Layout,
    meta: {
      title: `${appName} - 加载中`,
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
      title: `${appName} - 相册`,
      showLink: false,
      rank: 103
    }
  }
] satisfies Array<RouteConfigsTable>;
