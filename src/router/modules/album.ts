/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-15 11:31:00
 * @LastEditTime: 2025-08-08 18:36:13
 * @LastEditors: 安知鱼
 */
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/album-management",
  redirect: "/admin/album-management",
  component: Layout,
  meta: {
    icon: "ep:home-filled",
    title: "相册管理",
    rank: 4
  },
  children: [
    {
      path: "/admin/album-management",
      name: "AlbumManagement",
      component: () => import("@/views/system/album-management/index.vue"),
      meta: {
        title: "相册管理",
        icon: "ep:picture-filled",
        roles: ["1"]
      }
    }
  ]
} satisfies RouteConfigsTable;
