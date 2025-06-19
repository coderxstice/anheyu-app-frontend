/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-15 11:31:00
 * @LastEditTime: 2025-06-19 11:01:24
 * @LastEditors: 安知鱼
 */
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/album-management",
  redirect: "/album-management/index",
  component: Layout,
  meta: {
    icon: "ep:home-filled",
    title: "相册管理",
    rank: 0
  },
  children: [
    {
      path: "/album-management/index",
      name: "AlbumManagement",
      component: () => import("@/views/system/album-management/index.vue"),
      meta: {
        title: "相册管理",
        icon: "ep:picture-filled",
        roles: ["管理员"]
      }
    }
  ]
} satisfies RouteConfigsTable;
