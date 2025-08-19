/*
 * @Description: 友链
 * @Author: 安知鱼
 * @Date: 2025-06-15 11:31:00
 * @LastEditTime: 2025-08-19 15:53:50
 * @LastEditors: 安知鱼
 */

export default {
  path: "/flink-management",
  redirect: "/admin/flink-management",
  meta: {
    icon: "ep:link",
    title: "友链管理",
    rank: 7
  },
  children: [
    {
      path: "/admin/flink-management",
      name: "FlinkManagement",
      component: () => import("@/views/system/flink-management/index.vue"),
      meta: {
        title: "友链管理",
        icon: "ep:link",
        roles: ["1"]
      }
    }
  ]
} satisfies RouteConfigsTable;
