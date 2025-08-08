/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-15 11:31:00
 * @LastEditTime: 2025-08-08 18:44:39
 * @LastEditors: 安知鱼
 */
const { VITE_HIDE_HOME } = import.meta.env;
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/dashboard",
  component: Layout,
  redirect: "/admin/dashboard",
  name: "Dashboard",
  meta: {
    icon: "ep:home-filled",
    title: "首页",
    rank: 1
  },
  children: [
    {
      path: "/admin/dashboard",
      name: "Welcome",
      component: () => import("@/views/system/welcome/index.vue"),
      meta: {
        title: "首页",
        showLink: VITE_HIDE_HOME === "true" ? false : true,
        roles: ["1", "2"]
      }
    }
  ]
} satisfies RouteConfigsTable;
