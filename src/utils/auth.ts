import Cookies from "js-cookie";
import { useUserStoreHook } from "@/store/modules/user";
import { storageLocal } from "@pureadmin/utils";

export interface DataInfo<T> {
  /** token */
  accessToken: string;
  /** `accessToken`的过期时间（时间戳） */
  expires: T;
  /** 用于调用刷新accessToken的接口时所需的token */
  refreshToken: string;
  /** 头像 */
  avatar?: string;
  /** 用户名 */
  username?: string;
  /** 昵称 */
  nickname?: string;
  /** 当前登录用户的角色 */
  roles?: Array<string>;
}

export const userKey = "yuyu-user-info";
export const TokenKey = "authorized-token";
/**
 * 通过`multiple-tabs`是否在`cookie`中，判断用户是否已经登录系统，
 * 从而支持多标签页打开已经登录的系统后无需再登录。
 * 浏览器完全关闭后`multiple-tabs`将自动从`cookie`中销毁，
 * 再次打开浏览器需要重新登录系统
 * */
export const multipleTabsKey = "multiple-tabs";

/**
 * 获取`token`。
 * 综合 Cookie 和 localStorage 的信息，确保健壮性。
 * Cookie 主要存放有时效性的 accessToken，localStorage 存放长期的 refreshToken 和用户信息。
 */
export function getToken(): DataInfo<number> | null {
  const cookieDataString = Cookies.get(TokenKey);
  const localData = storageLocal().getItem<DataInfo<number>>(userKey);

  let tokenInfo: Partial<DataInfo<number>> = {};

  // 1. 优先从 Cookie 中解析数据
  if (cookieDataString) {
    try {
      tokenInfo = JSON.parse(cookieDataString);
    } catch (e) {
      console.error("解析 Cookie Token 出错, 已自动清除", e);
      Cookies.remove(TokenKey);
    }
  }

  // 2. 使用 localStorage 的信息来补充或覆盖，localStorage 的 refreshToken 更可靠
  if (localData) {
    tokenInfo.refreshToken = localData.refreshToken || tokenInfo.refreshToken;
    // 如果 Cookie 不存在或解析失败，从 localStorage 回退 expires
    if (!tokenInfo.expires) {
      tokenInfo.expires = localData.expires;
    }
    // 用户信息以 localStorage 为准
    tokenInfo.avatar = localData.avatar;
    tokenInfo.username = localData.username;
    tokenInfo.nickname = localData.nickname;
    tokenInfo.roles = localData.roles;
  }

  // 3. 如果连 accessToken 和 refreshToken 都没有，则视为无有效 token
  if (!tokenInfo.accessToken && !tokenInfo.refreshToken) {
    return null;
  }

  // 4. 确保返回的对象结构完整，符合 DataInfo 类型，为缺失的字段提供默认值
  return {
    accessToken: tokenInfo.accessToken || "",
    refreshToken: tokenInfo.refreshToken || "",
    expires: tokenInfo.expires || 0,
    avatar: tokenInfo.avatar || "",
    username: tokenInfo.username || "",
    nickname: tokenInfo.nickname || "",
    roles: tokenInfo.roles || []
  };
}

/**
 * @description 设置`token`以及一些必要信息并采用无感刷新`token`方案
 * @param data 传入的数据。登录时是完整的，刷新时可能只有 accessToken 和 expires。
 */
export function setToken(data: Partial<DataInfo<number>>) {
  const { isRemembered, loginDay } = useUserStoreHook();

  // --- START OF FIX ---
  // 1. 保留现有的 refreshToken
  // 如果传入的 data 中没有 refreshToken（比如刷新 accessToken 的场景），
  // 则从现有的存储中读取旧的 refreshToken，防止其被覆盖丢失。
  const preservedRefreshToken =
    data.refreshToken || getToken()?.refreshToken || "";

  // 2. 准备要存入 Cookie 的数据
  const accessToken = data.accessToken ?? "";
  const expires = data.expires ?? 0;
  const cookieString = JSON.stringify({
    accessToken,
    expires,
    refreshToken: preservedRefreshToken
  });
  // --- END OF FIX ---

  // 设置 Cookie 的过期时间与 accessToken 的过期时间同步
  if (expires > 0) {
    const expireDays = (expires - Date.now()) / (1000 * 60 * 60 * 24);
    Cookies.set(TokenKey, cookieString, {
      // 设置一个最小过期天数，防止计算出负数或0导致cookie立即失效
      expires: expireDays > 0 ? expireDays : 0
    });
  } else {
    Cookies.set(TokenKey, cookieString);
  }

  // 设置用于判断多标签页登录状态的 Cookie
  Cookies.set(
    multipleTabsKey,
    "true",
    isRemembered ? { expires: loginDay } : {}
  );

  // --- START OF FIX 2 ---
  // 将更持久的信息（如 refreshToken 和用户信息）存入 localStorage
  // 登录时，data 中包含用户信息，需要存入；
  // 刷新时，data 中不包含用户信息，需要从旧存储中获取以防丢失。
  const oldLocalData = storageLocal().getItem<DataInfo<number>>(userKey);
  const userInfo = {
    refreshToken: preservedRefreshToken,
    expires, // 也存一份，用于 Cookie 失效后回退
    avatar: data.avatar ?? oldLocalData?.avatar ?? "",
    username: data.username ?? oldLocalData?.username ?? "",
    nickname: data.nickname ?? oldLocalData?.nickname ?? "",
    roles: data.roles ?? oldLocalData?.roles ?? []
  };
  storageLocal().setItem(userKey, userInfo);
  // --- END OF FIX 2 ---

  // 更新 Pinia Store
  // 只有在登录（提供了完整的data）时才需要全面更新用户信息
  if (data.username && data.roles) {
    useUserStoreHook().SET_AVATAR(userInfo.avatar);
    useUserStoreHook().SET_USERNAME(userInfo.username);
    useUserStoreHook().SET_NICKNAME(userInfo.nickname);
    useUserStoreHook().SET_ROLES(userInfo.roles);
  }
}

/** 删除`token`以及key值为`user-info`的localStorage信息 */
export function removeToken() {
  Cookies.remove(TokenKey);
  Cookies.remove(multipleTabsKey);
  storageLocal().removeItem(userKey);
}

/** 格式化token（jwt格式） */
export const formatToken = (token: string): string => {
  return "Bearer " + token;
};
