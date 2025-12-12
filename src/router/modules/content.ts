/*
 * @Description: 内容管理路由组（二级菜单）- 文章管理、评论管理
 * @Author: 安知鱼
 * @Date: 2025-12-12
 */
const Layout = () => import("@/layout/index.vue");

// 内容管理 - 包含文章、评论
export default [
  {
    path: "/content",
    component: Layout,
    redirect: "/admin/post-management",
    meta: {
      icon: "ep:document",
      title: "内容管理",
      rank: 2
    },
    children: [
      {
        path: "/admin/post-management",
        name: "PostManagement",
        component: () => import("@/views/system/post-management/index.vue"),
        meta: {
          icon: "material-symbols:post-add",
          title: "文章管理",
          roles: ["1"]
        }
      },
      {
        path: "/admin/comment-management",
        name: "CommentManagement",
        component: () => import("@/views/system/comment-management/index.vue"),
        meta: {
          icon: "ep:comment",
          title: "评论管理",
          roles: ["1"]
        }
      },
      {
        path: "/admin/album-management",
        name: "AlbumManagement",
        component: () => import("@/views/system/album-management/index.vue"),
        meta: {
          icon: "ep:picture-filled",
          title: "相册管理",
          roles: ["1"]
        }
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
