/*
 * @Description: 友链
 * @Author: 安知鱼
 * @Date: 2025-06-15 11:31:00
 * @LastEditTime: 2025-08-19 15:53:50
 * @LastEditors: 安知鱼
 */

export default {
  path: "/comment-management",
  redirect: "/admin/comment-management",
  meta: {
    icon: "ep:comment",
    title: "评论管理",
    rank: 6
  },
  children: [
    {
      path: "/admin/comment-management",
      name: "CommentManagement",
      component: () => import("@/views/system/comment-management/index.vue"),
      meta: {
        title: "评论管理",
        icon: "ep:comment",
        roles: ["1"]
      }
    }
  ]
} satisfies RouteConfigsTable;
