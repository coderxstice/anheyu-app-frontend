/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-25 00:41:04
 * @LastEditTime: 2025-07-25 15:29:56
 * @LastEditors: 安知鱼
 */
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/post-management",
  component: Layout,
  redirect: "/post-management/index",
  meta: {
    icon: "material-symbols:post-add",
    title: "文章管理",
    rank: 1
  },
  children: [
    {
      path: "/post-management/index",
      name: "PostManagement",
      component: () => import("@/views/system/post-management/index.vue"),
      meta: {
        title: "文章管理",
        roles: ["1"]
      }
    },
    {
      path: "/post-management/edit/:id",
      name: "PostEdit",
      component: () => import("@/views/system/post-management/edit.vue"),
      meta: {
        title: "编辑文章",
        roles: ["1"],
        showLink: false,
        activePath: "/post-management/index"
      }
    }
  ]
} satisfies RouteConfigsTable;
