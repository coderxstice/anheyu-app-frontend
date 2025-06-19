/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-15 11:31:00
 * @LastEditTime: 2025-06-19 11:05:31
 * @LastEditors: 安知鱼
 */
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/system",
  redirect: "/settings-management/index",
  component: Layout,
  meta: {
    icon: "ep:setting",
    title: "系统设置",
    rank: 0
  },
  children: [
    {
      path: "/settings-management/index",
      name: "SettingsManagement",
      component: () => import("@/views/system/settings-management/index.vue"),
      meta: {
        title: "系统设置",
        icon: "ep:setting",
        roles: ["管理员"]
      }
    }
  ]
} satisfies RouteConfigsTable;
