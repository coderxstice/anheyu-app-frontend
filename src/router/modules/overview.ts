/*
 * @Description: 概览路由组（二级菜单）- 首页、文件管理
 * @Author: 安知鱼
 * @Date: 2025-12-20
 */
const { VITE_HIDE_HOME } = import.meta.env;
const Layout = () => import("@/layout/index.vue");

// 概览 - 包含首页和文件管理
export default [
  {
    path: "/dashboard",
    component: Layout,
    redirect: "/admin/dashboard",
    name: "Home",
    meta: {
      icon: "ep:data-board",
      title: "概览",
      rank: 0
    },
    children: [
      {
        path: "/admin/dashboard",
        name: "Welcome",
        component: () => import("@/views/system/welcome/index.vue"),
        meta: {
          icon: "ep:home-filled",
          title: "首页",
          showLink: VITE_HIDE_HOME === "true" ? false : true,
          roles: ["1", "2"]
        }
      },
      {
        path: "/admin/file-management",
        name: "FileManagement",
        component: () => import("@/views/system/file-management/index.vue"),
        meta: {
          icon: "tabler:file-filled",
          title: "文件管理",
          roles: ["1"]
        }
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
