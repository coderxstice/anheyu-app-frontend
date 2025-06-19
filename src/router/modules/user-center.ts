/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-15 11:31:00
 * @LastEditTime: 2025-06-19 17:32:29
 * @LastEditors: 安知鱼
 */
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/user-center",
  redirect: "/user-center/index",
  component: Layout,
  meta: {
    icon: "ep:home-filled",
    title: "用户中心",
    rank: 0
  },
  children: [
    {
      path: "/user-center/index",
      name: "UserCenter",
      component: () => import("@/views/system/user-center/index.vue"),
      meta: {
        title: "用户中心",
        icon: "ep:picture-filled",
        roles: ["1"],
        showLink: false
      }
    }
  ]
} satisfies RouteConfigsTable;
