/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-23 16:45:39
 * @LastEditTime: 2025-07-25 19:12:10
 * @LastEditors: 安知鱼
 */
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/storage-policy",
  component: Layout,
  redirect: "/admin/storage-policy",
  meta: {
    icon: "mingcute:storage-fill",
    title: "存储策略",
    rank: 5
  },
  children: [
    {
      path: "/admin/storage-policy",
      name: "StoragePolicyManagement",
      component: () =>
        import("@/views/system/storage-policy-management/index.vue"),
      meta: {
        title: "存储策略",
        roles: ["1"]
      }
    },
    {
      path: "/admin/storage-policy/edit/:id",
      name: "StoragePolicyEdit",
      component: () =>
        import("@/views/system/storage-policy-management/edit.vue"),
      meta: {
        title: "编辑策略",
        activePath: "/storage-policy/index",
        showLink: false,
        roles: ["1"]
      }
    },
    {
      path: "/admin/storage-policy/oauth",
      name: "StoragePolicyOAuth",
      component: () =>
        import("@/views/system/storage-policy-management/oauth.vue"),
      meta: {
        title: "授权回调",
        showLink: false,
        roles: ["1"]
      }
    }
  ]
} satisfies RouteConfigsTable;
