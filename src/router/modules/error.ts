/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-04-08 17:29:06
 * @LastEditTime: 2025-04-11 15:23:47
 * @LastEditors: 安知鱼
 */
export default {
  path: "/error",
  redirect: "/error/403",
  meta: {
    icon: "ri:information-line",
    showLink: false,
    title: "异常页面",
    rank: 9
  },
  children: [
    {
      path: "/error/403",
      name: "403",
      component: () => import("@/views/error/403.vue"),
      meta: {
        title: "403"
      }
    },
    {
      path: "/error/404",
      name: "404",
      component: () => import("@/views/error/404.vue"),
      meta: {
        title: "404"
      }
    },
    {
      path: "/error/500",
      name: "500",
      component: () => import("@/views/error/500.vue"),
      meta: {
        title: "500"
      }
    }
  ]
} satisfies RouteConfigsTable;
