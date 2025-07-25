// import "@/utils/sso";
import Cookies from "js-cookie";
import { getConfig } from "@/config/base";
// import NProgress from "@/utils/progress"; // NProgress 通常在 afterEach 中使用
import { buildHierarchyTree } from "@/utils/tree";
import remainingRouter from "./modules/remaining";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import { usePermissionStoreHook } from "@/store/modules/permission";
import { isUrl, openLink, storageLocal, isAllEmpty } from "@pureadmin/utils";
import {
  ascending,
  getTopMenu,
  initRouter,
  isOneOfArray,
  getHistoryMode,
  findRouteByPath,
  handleAliveRoute,
  formatTwoStageRoutes,
  formatFlatteningRoutes
} from "./utils";
import {
  type Router,
  createRouter,
  type RouteRecordRaw,
  type RouteComponent
} from "vue-router";
import type { LoginResultData } from "@/api/user";
import { userKey, removeToken, multipleTabsKey } from "@/utils/auth";

/** 自动导入全部静态路由，无需再手动引入！匹配 src/router/modules 目录（任何嵌套级别）中具有 .ts 扩展名的所有文件，除了 remaining.ts 文件
 * 如何匹配所有文件请看：https://github.com/mrmlnc/fast-glob#basic-syntax
 * 如何排除文件请看：https://cn.vitejs.dev/guide/features.html#negative-patterns
 */
const modules: Record<string, any> = import.meta.glob(
  ["./modules/**/*.ts", "!./modules/**/remaining.ts"],
  {
    eager: true
  }
);

/** 原始静态路由（未做任何处理） */
const routes = [];

Object.keys(modules).forEach(key => {
  routes.push(modules[key].default);
});

/** 导出处理后的静态路由（三级及以上的路由全部拍成二级） */
export const constantRoutes: Array<RouteRecordRaw> = formatTwoStageRoutes(
  formatFlatteningRoutes(buildHierarchyTree(ascending(routes.flat(Infinity))))
);

/** 用于渲染菜单，保持原始层级 */
export const constantMenus: Array<RouteComponent> = ascending(
  routes.flat(Infinity)
).concat(...remainingRouter);

/** 不参与菜单的路由 */
export const remainingPaths = Object.keys(remainingRouter).map(v => {
  return remainingRouter[v].path;
});

/** 创建路由实例 */
export const router: Router = createRouter({
  history: getHistoryMode(import.meta.env.VITE_ROUTER_HISTORY),
  routes: constantRoutes.concat(...(remainingRouter as any)),
  strict: true,
  scrollBehavior(to, from, savedPosition) {
    return new Promise(resolve => {
      if (savedPosition) {
        return savedPosition;
      } else {
        if (from.meta.saveSrollTop) {
          const top: number =
            document.documentElement.scrollTop || document.body.scrollTop;
          resolve({ left: 0, top });
        }
      }
    });
  }
});

/** 重置路由 */
export function resetRouter() {
  router.getRoutes().forEach(route => {
    const { name, meta } = route;
    if (name && router.hasRoute(name) && meta?.backstage) {
      router.removeRoute(name);
      router.options.routes = formatTwoStageRoutes(
        formatFlatteningRoutes(
          buildHierarchyTree(ascending(routes.flat(Infinity)))
        )
      );
    }
  });
  usePermissionStoreHook().clearAllCachePage();
}

/** 路由白名单 */
const whiteList = ["/", "/login", "/album", "/login/reset"];

const { VITE_HIDE_HOME } = import.meta.env;

router.beforeEach((to: ToRouteType, _from, next) => {
  // 1. 处理 keepAlive 逻辑
  if (to.meta?.keepAlive) {
    handleAliveRoute(to, "add");
    // 页面整体刷新和点击标签页刷新时，确保处理活跃路由
    if (_from.name === undefined || _from.name === "Redirect") {
      handleAliveRoute(to);
    }
  }

  const userInfo = storageLocal().getItem<LoginResultData>(userKey);
  // NProgress.start(); // 启动 NProgress 进度条，如果需要可以取消注释
  const externalLink = isUrl(to?.name as string);

  // 2. 设置页面标题
  if (!externalLink) {
    to.matched.some(item => {
      if (!item.meta.title) return ""; // 如果没有标题则返回空
      const Title = getConfig().Title;
      if (Title) document.title = `${item.meta.title} | ${Title}`;
      else document.title = item.meta.title as string;
    });
  }

  // 3. 主要导航逻辑
  if (Cookies.get(multipleTabsKey) && userInfo) {
    // 已登录用户逻辑

    // 3.1 权限检查
    if (to.meta?.roles && !isOneOfArray(to.meta?.roles, userInfo?.roles)) {
      next({ path: "/error/403" }); // 无权限跳转 403
      return; // 结束当前导航守卫
    }

    // 3.2 开启隐藏首页后，手动输入 /welcome 则跳转到 404
    if (VITE_HIDE_HOME === "true" && to.fullPath === "/dashboard/welcome") {
      next({ path: "/error/404" });
      return; // 结束当前导航守卫
    }

    // 已登录状态下访问登录页，直接重定向到第一个菜单页
    if (to.path === "/login") {
      // getTopMenu() 会自动计算出正确的路径 /dashboard/welcome，无需修改
      if (usePermissionStoreHook().wholeMenus.length === 0) {
        initRouter()
          .then(() => {
            next({ path: getTopMenu(true).path, replace: true });
          })
          .catch(() => {
            removeToken();
            next();
          });
      } else {
        next({ path: getTopMenu(true).path, replace: true });
      }
      return; // 结束当前导航守卫
    }

    // 3.3 已登录用户访问白名单页面（如 /album ）直接放行
    console.log(to.path, to);

    if (whiteList.includes(to.path)) {
      next();
      return; // 结束当前导航守卫
    }

    // 3.4 处理外部链接
    if (externalLink) {
      openLink(to?.name as string);
      // NProgress.done(); // 外部链接不需要进度条，如果需要可以取消注释
      return; // 结束当前导航守卫
    }

    // 3.5 刷新或首次直接访问时，初始化路由和处理多标签页
    // 只有在权限菜单未加载，且目标路径不是登录页时，才执行 initRouter
    if (
      usePermissionStoreHook().wholeMenus.length === 0 &&
      to.path !== "/login"
    ) {
      initRouter()
        .then((router: Router) => {
          // 多标签页缓存处理：如果未从缓存恢复多标签页，则处理当前路由
          if (!useMultiTagsStoreHook().getMultiTagsCache) {
            const { path } = to;
            const route = findRouteByPath(
              path,
              router.options.routes[0].children
            );
            getTopMenu(true); // 获取顶部菜单
            if (route && route.meta?.title) {
              // 根据路由类型（目录或页面）将路由添加到多标签页
              if (isAllEmpty(route.parentId) && route.meta?.backstage) {
                const { path, name, meta } = route.children[0];
                useMultiTagsStoreHook().handleTags("push", {
                  path,
                  name,
                  meta
                });
              } else {
                const { path, name, meta } = route;
                useMultiTagsStoreHook().handleTags("push", {
                  path,
                  name,
                  meta
                });
              }
            }
          }
          // 确保动态路由完全加入路由列表且不影响静态路由
          // 如果 to.name 为空，可能是刷新或直接访问，确保能导航到当前路径
          if (isAllEmpty(to.name)) {
            next({ path: to.fullPath, replace: true }); // 使用 replace 避免回退问题
          } else {
            next(); // 否则直接放行
          }
        })
        .catch(() => {
          // 处理 initRouter 失败的情况，例如 token 过期或权限问题
          removeToken(); // 移除 token
          next({ path: "/login" }); // 重定向到登录页
        });
    } else {
      // 如果权限菜单已加载，且不是上述特殊情况，直接放行
      next();
    }
  } else {
    // 未登录用户逻辑
    if (to.path !== "/login") {
      // 如果目标是白名单页面
      if (whiteList.indexOf(to.path) !== -1) {
        next();
      } else {
        // 未登录且非白名单页面，移除 token 并跳转到 "/"
        removeToken();
        next({ path: "/" });
      }
    } else {
      // 访问登录页，直接放行
      next();
    }
  }
});

// router.afterEach(() => {
//   NProgress.done(); // 路由跳转结束后，关闭 NProgress 进度条，如果需要可以取消注释
// });

export default router;
