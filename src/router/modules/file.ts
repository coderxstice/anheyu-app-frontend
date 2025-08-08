/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-24 14:03:31
 * @LastEditTime: 2025-08-08 18:35:13
 * @LastEditors: 安知鱼
 */
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/file-management",
  component: Layout,
  redirect: "/admin/file-management",
  meta: {
    icon: "tabler:file-filled",
    title: "系统管理",
    rank: 3
  },
  children: [
    {
      path: "/admin/file-management",
      name: "FileManagement",
      component: () => import("@/views/system/file-management/index.vue"),
      meta: {
        title: "文件管理",
        roles: ["1"]
      }
    }
  ]
} satisfies RouteConfigsTable;
