/*
 * @Description: 媒体管理路由组（二级菜单）- 文件管理
 * @Author: 安知鱼
 * @Date: 2025-12-12
 */
const Layout = () => import("@/layout/index.vue");

// 媒体管理 - 包含文件管理
export default [
  {
    path: "/media",
    component: Layout,
    redirect: "/admin/file-management",
    meta: {
      icon: "ep:folder-opened",
      title: "媒体管理",
      rank: 1
    },
    children: [
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
