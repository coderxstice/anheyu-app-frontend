/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-25 00:41:04
 * @LastEditTime: 2025-08-14 10:35:37
 * @LastEditors: 安知鱼
 */
const Layout = () => import("@/layout/index.vue");

// 将原来的单个对象导出，改为导出包含两个路由配置的数组
export default [
  {
    path: "/post-management",
    component: Layout,
    redirect: "/admin/post-management",
    meta: {
      icon: "material-symbols:post-add",
      title: "文章管理",
      rank: 2
    },
    children: [
      {
        // 文章列表页面仍然在主布局内，以显示侧边栏和导航栏
        path: "/admin/post-management",
        name: "PostManagement",
        component: () => import("@/views/system/post-management/index.vue"),
        meta: {
          title: "文章管理",
          roles: ["1"]
        }
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
