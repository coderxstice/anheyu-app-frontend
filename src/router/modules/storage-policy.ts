const Layout = () => import("@/layout/index.vue");

export default {
  path: "/storage-policy",
  component: Layout,
  redirect: "/storage-policy/index",
  meta: {
    icon: "mingcute:storage-fill",
    title: "存储策略",
    rank: 3
  },
  children: [
    {
      path: "/storage-policy/index",
      name: "StoragePolicyManagement",
      component: () =>
        import("@/views/system/storage-policy-management/index.vue"),
      meta: {
        title: "存储策略",
        roles: ["1"]
      }
    },
    {
      path: "/storage-policy/edit/:id",
      name: "StoragePolicyEdit",
      component: () =>
        import("@/views/system/storage-policy-management/edit.vue"),
      meta: {
        title: "编辑策略",
        activePath: "/storage-policy/index",
        showLink: false,
        roles: ["1"]
      }
    }
  ]
} satisfies RouteConfigsTable;
