/*
 * @Description: 路由配置
 * @Author: 安知鱼
 * @Date: 2025-04-08 17:29:06
 * @LastEditTime: 2025-08-13 15:02:32
 * @LastEditors: 安知鱼
 */
const Layout = () => import("@/layout/index.vue");
const FrontendLayout = () => import("@/layout/frontend/index.vue");
import { LOCAL_STORAGE_KEY } from "@/constant/index";

const configLocal = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
const appName = configLocal?.config?.APP_NAME || "安和鱼";
const subTitle = configLocal?.config?.SUB_TITLE || "安和鱼的个人博客";

export default [
  {
    path: "/",
    component: FrontendLayout,
    meta: {
      title: `${appName} - ${subTitle}`,
      rank: 100
    },
    children: [
      {
        path: "",
        name: "PostHome",
        component: () => import("@/views/post/post-home/index.vue"),
        meta: {
          title: `${appName} - ${subTitle}`,
          showLink: false
        }
      },
      {
        path: "posts/:id",
        name: "PostDetail",
        component: () => import("@/views/post/post-detail/index.vue"),
        meta: {
          title: `${appName} - 文章详情`,
          showLink: false
        }
      },
      {
        path: "page/:id",
        name: "PostPage",
        component: () => import("@/views/post/post-home/index.vue"),
        meta: {
          title: `${appName} - ${subTitle}`,
          showLink: false
        }
      },
      {
        path: "archives",
        name: "PostArchives",
        component: () => import("@/views/post/post-home/index.vue"),
        meta: {
          title: `${appName} - 归档`,
          showLink: false
        }
      },
      {
        path: "archives/:year(\\d{4})/",
        name: "PostArchivesByYear",
        component: () => import("@/views/post/post-home/index.vue"),
        meta: {
          title: `${appName} - 归档`,
          showLink: false
        }
      },
      {
        path: "archives/:year(\\d{4})/:month(\\d{1,2})/",
        name: "PostArchivesByMonth",
        component: () => import("@/views/post/post-home/index.vue"),
        meta: {
          title: `${appName} - 归档`,
          showLink: false
        }
      },
      {
        path: "archives/page/:id",
        name: "PostArchivesDetailPaginated",
        component: () => import("@/views/post/post-home/index.vue"),
        meta: {
          title: `${appName} - 归档`,
          showLink: false
        }
      },
      {
        path: "archives/:year(\\d{4})/page/:id",
        name: "PostArchivesByYearPaginated",
        component: () => import("@/views/post/post-home/index.vue"),
        meta: {
          title: `${appName} - 归档`,
          showLink: false
        }
      },
      {
        path: "archives/:year(\\d{4})/:month(\\d{1,2})/page/:id",
        name: "PostArchivesByMonthPaginated",
        component: () => import("@/views/post/post-home/index.vue"),
        meta: {
          title: `${appName} - 归档`,
          showLink: false
        }
      },
      {
        path: "tags",
        name: "PostTagsAll",
        component: () => import("@/views/post/tags/index.vue"),
        meta: {
          title: `${appName} - 标签`,
          showLink: false
        }
      },
      {
        path: "tags/:name/",
        name: "PostTagsDetail",
        component: () => import("@/views/post/post-home/index.vue"),
        meta: {
          title: `${appName} - 标签`,
          showLink: false
        }
      },
      {
        path: "tags/:name/page/:id",
        name: "PostTagsDetailPaginated",
        component: () => import("@/views/post/post-home/index.vue"),
        meta: {
          title: `${appName} - 标签`,
          showLink: false
        }
      },
      {
        path: "categories",
        name: "PostCategoriesAll",
        component: () => import("@/views/post/categories/index.vue"),
        meta: {
          title: `${appName} - 分类`,
          showLink: false
        }
      },
      {
        path: "categories/:name/",
        name: "PostHomeByCategory",
        component: () => import("@/views/post/post-home/index.vue"),
        meta: {
          title: `${appName} - 分类`,
          showLink: false
        }
      },
      {
        path: "categories/:name/page/:id",
        name: "PostHomeByCategoryPaginated",
        component: () => import("@/views/post/post-home/index.vue"),
        meta: {
          title: `${appName} - 分类`,
          showLink: false
        }
      }
    ]
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/login/index.vue"),
    alias: "/login/reset",
    meta: {
      title: `${appName} - 登录`,
      showLink: false,
      rank: 101
    }
  },
  {
    path: "/redirect",
    component: Layout,
    meta: {
      title: `${appName} - 加载中`,
      showLink: false,
      rank: 102
    },
    children: [
      {
        path: "/redirect/:path(.*)",
        name: "Redirect",
        component: () => import("@/layout/redirect.vue")
      }
    ]
  },
  {
    path: "/album",
    name: "AlbumHome",
    component: () => import("@/views/album-home/index.vue"),
    meta: {
      title: `${appName} - 相册`,
      showLink: false,
      rank: 103
    }
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("@/views/error/no-page.vue"),
    meta: {
      title: `404 - 页面不存在`,
      showLink: false
    }
  }
] satisfies Array<RouteConfigsTable>;
