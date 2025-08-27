import { useUserStoreHook } from "@/store/modules/user";
import { storageLocal } from "@pureadmin/utils";
import type { LoginResultData } from "@/api/user";

export const userKey = "anheyu-user-info";
export const multipleTabsKey = "multiple-tabs";

/**
 * @description 从 localStorage 获取完整的认证信息。
 * @returns {LoginResultData | null} 如果存在有效的认证信息则返回对象，否则返回 null。
 */
export function getToken(): LoginResultData | null {
  const data: LoginResultData | null = storageLocal().getItem(userKey);
  if (data && data.accessToken) {
    return data;
  }
  return null;
}

/**
 * @description 设置认证信息，智能处理登录和刷新Token两种场景，所有信息存入 localStorage。
 * @param {Partial<LoginResultData>} data - 登录时传入完整的 LoginResultData，刷新时可只传入部分数据。
 */
export function setToken(data: Partial<LoginResultData>) {
  // 1. 获取当前已存储的旧数据作为备用
  const oldTokenData = getToken();

  // 2. 准备要存储的数据，智能合并新旧数据
  const newAccessToken = data.accessToken || oldTokenData?.accessToken || "";
  const newExpires = data.expires || oldTokenData?.expires || 0;
  const newRefreshToken = data.refreshToken || oldTokenData?.refreshToken || "";
  const newUserInfo = data.userInfo || oldTokenData?.userInfo || null;
  const newRoles = data.roles || oldTokenData?.roles || null;

  // 3. 将所有认证信息作为一个对象，完整地存入 LocalStorage
  storageLocal().setItem(userKey, {
    accessToken: newAccessToken,
    expires: newExpires,
    refreshToken: newRefreshToken,
    roles: newRoles,
    userInfo: newUserInfo
  });

  // 4. 设置用于多标签页登录状态的标记
  storageLocal().setItem(multipleTabsKey, "true");

  // 5. 只有在登录（即传入了完整的 userInfo）时，才需要更新 Store 中的用户信息
  if (data.userInfo && newUserInfo) {
    useUserStoreHook().SET_USER_INFO(newUserInfo);
  }
}

/**
 * @description 删除 localStorage 中所有相关的认证信息
 */
export function removeToken() {
  storageLocal().removeItem(userKey);
  storageLocal().removeItem(multipleTabsKey);
}

/**
 * @description 格式化token（添加`Bearer `前缀）
 */
export const formatToken = (token: string): string => {
  return "Bearer " + token;
};
