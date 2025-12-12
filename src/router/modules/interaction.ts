/*
 * @Description: 互动管理路由组（二级菜单）- 友链管理、用户管理
 * @Author: 安知鱼
 * @Date: 2025-12-12
 */
const Layout = () => import("@/layout/index.vue");

// 互动管理 - 包含友链、用户
export default [
  {
    path: "/interaction",
    component: Layout,
    redirect: "/admin/flink-management",
    meta: {
      icon: "ep:connection",
      title: "互动管理",
      rank: 4
    },
    children: [
      {
        path: "/admin/flink-management",
        name: "FlinkManagement",
        component: () => import("@/views/system/flink-management/index.vue"),
        meta: {
          icon: "ep:link",
          title: "友链管理",
          roles: ["1"]
        }
      },
      {
        path: "/admin/user-management",
        name: "UserManagement",
        component: () => import("@/views/system/user-management/index.vue"),
        meta: {
          icon: "ep:user",
          title: "用户管理",
          roles: ["1"]
        }
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
