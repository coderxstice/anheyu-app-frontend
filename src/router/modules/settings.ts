/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-15 11:31:00
 * @LastEditTime: 2025-08-08 18:34:11
 * @LastEditors: 安知鱼
 */

export default {
  path: "/settings-management",
  redirect: "/admin/settings-management",
  meta: {
    icon: "ep:setting",
    title: "系统设置",
    rank: 0
  },
  children: [
    {
      path: "/admin/settings-management",
      name: "SettingsManagement",
      component: () => import("@/views/system/settings-management/index.vue"),
      meta: {
        title: "系统设置",
        icon: "ep:setting",
        roles: ["1"]
      }
    }
  ]
} satisfies RouteConfigsTable;
