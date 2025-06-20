import Cookies from "js-cookie";
import { useUserStoreHook } from "@/store/modules/user";
import { storageLocal } from "@pureadmin/utils";
import type { LoginResultData, UserInfo } from "@/api/user";

export const userKey = "yuyu-user-info";
export const TokenKey = "authorized-token";
export const multipleTabsKey = "multiple-tabs";

/**
 * @description 获取本地存储的认证信息。
 * 它会从 Cookie 和 LocalStorage 中分别读取数据，然后组合成一个完整的 LoginResultData 对象。
 * @returns {LoginResultData | null} 如果存在有效的认证信息则返回对象，否则返回 null。
 */
export function getToken(): LoginResultData | null {
  // 1. 从 Cookie 中获取会话相关的 Token 信息
  const cookieData = Cookies.get(TokenKey);
  const sessionToken: { accessToken?: string; expires?: number } = cookieData
    ? JSON.parse(cookieData)
    : {};

  // 2. 从 LocalStorage 中获取持久化的用户信息和 refreshToken
  const localData: {
    refreshToken?: string;
    userInfo?: UserInfo;
    roles?: string[];
  } | null = storageLocal().getItem(userKey);

  // 3. 如果两处都没有有效信息，则视为未登录
  if (!sessionToken.accessToken && !localData?.refreshToken) {
    return null;
  }

  console.log("getToken");

  // 4. 组合成完整的 LoginResultData 对象
  //    userInfo 只可能在 localData 中找到
  return {
    accessToken: sessionToken.accessToken || "",
    expires: sessionToken.expires || 0,
    refreshToken: localData?.refreshToken || "",
    roles: localData?.roles || [],
    userInfo: localData?.userInfo || null
  };
}

/**
 * @description 设置认证信息，智能处理登录和刷新Token两种场景。
 * @param {Partial<LoginResultData>} data - 登录时传入完整的 LoginResultData，刷新时可只传入部分数据。
 */
export function setToken(data: Partial<LoginResultData>) {
  const { isRemembered, loginDay } = useUserStoreHook();

  // --- 准备要存储的数据，智能合并新旧数据 ---

  // 1. 获取当前已存储的旧数据作为备用
  const oldTokenData = getToken();

  // 2. 确定最终要存储的值，优先使用新传入的 data，否则使用旧数据
  const newAccessToken = data.accessToken || oldTokenData?.accessToken || "";
  const newExpires = data.expires || oldTokenData?.expires || 0;
  // refreshToken 和 userInfo 应该从新数据或旧数据中继承，防止刷新时丢失
  const newRefreshToken = data.refreshToken || oldTokenData?.refreshToken || "";
  // userInfo 只在登录时（传入了data.userInfo）才更新
  const newUserInfo = data.userInfo || oldTokenData?.userInfo || null;
  const newRoles = data.roles || oldTokenData?.roles || null;

  // --- 执行存储操作 ---

  // 3. 将 accessToken 和 expires 存入 Cookie
  // a. 计算 Cookie 的过期天数，使其与 accessToken 的有效期同步
  let cookieExpires: number | Date = 0;
  if (newExpires > 0) {
    const remainingMilliseconds = newExpires - Date.now();
    // 只有在有效期大于0时才设置expires，否则Cookie为会话级别
    if (remainingMilliseconds > 0) {
      cookieExpires = new Date(Date.now() + remainingMilliseconds);
    }
  }
  // b. 存入 Cookie
  Cookies.set(
    TokenKey,
    JSON.stringify({ accessToken: newAccessToken, expires: newExpires }),
    { expires: cookieExpires || undefined } // 如果 cookieExpires 为0，则不设置该选项
  );

  // 4. 将 refreshToken 和 userInfo 存入 LocalStorage (长期存储)
  storageLocal().setItem(userKey, {
    refreshToken: newRefreshToken,
    roles: newRoles,
    userInfo: newUserInfo
  });

  // 5. 设置用于多标签页登录状态的 Cookie
  Cookies.set(
    multipleTabsKey,
    "true",
    isRemembered ? { expires: loginDay } : {}
  );

  // 只有在登录（即传入了完整的 userInfo）时，才需要更新 Store 中的用户信息
  if (data.userInfo && newUserInfo) {
    // 建议在 store 中创建一个 Action 来统一更新用户信息
    useUserStoreHook().SET_USER_INFO(newUserInfo);
  }
}

/** * @description 删除`token`以及本地所有相关的认证信息
 */
export function removeToken() {
  Cookies.remove(TokenKey);
  Cookies.remove(multipleTabsKey);
  storageLocal().removeItem(userKey);
}

/** * @description 格式化token（添加`Bearer `前缀）
 */
export const formatToken = (token: string): string => {
  return "Bearer " + token;
};
