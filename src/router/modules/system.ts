/*
 * @Description: 系统管理路由组（二级菜单）- 系统设置、存储策略、主题商城
 * @Author: 安知鱼
 * @Date: 2025-12-12
 */
const Layout = () => import("@/layout/index.vue");

// 系统管理 - 包含设置、存储策略、主题商城
export default [
  {
    path: "/system",
    component: Layout,
    redirect: "/admin/settings-management",
    meta: {
      icon: "ep:setting",
      title: "系统管理",
      rank: 5
    },
    children: [
      {
        path: "/admin/settings-management",
        name: "SettingsManagement",
        component: () => import("@/views/system/settings-management/index.vue"),
        meta: {
          icon: "ep:setting",
          title: "系统设置",
          roles: ["1"]
        }
      },
      {
        path: "/admin/storage-policy",
        name: "StoragePolicyManagement",
        component: () =>
          import("@/views/system/storage-policy-management/index.vue"),
        meta: {
          icon: "mingcute:storage-fill",
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
          activePath: "/admin/storage-policy",
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
      },
      {
        path: "/admin/theme-mall",
        name: "ThemeMall",
        component: () => import("@/views/system/theme-mall/index.vue"),
        meta: {
          icon: "ep:chrome-filled",
          title: "主题商城",
          roles: ["1"]
        }
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
