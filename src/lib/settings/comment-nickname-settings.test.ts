import { describe, expect, it } from "vitest";
import { getChangedValues, getKeysByCategory, parseBackendValues } from "./setting-descriptors";

const nicknameWordsKey = "comment.nickname_forbidden_words";
const bodyWordsKey = "comment.forbidden_words";

describe("comment nickname forbidden words settings", () => {
  const descriptors = getKeysByCategory("user-comment");

  it("默认不限制昵称，加载旧配置不会产生未保存的修改", () => {
    const values = parseBackendValues({}, descriptors);

    expect(values[nicknameWordsKey]).toBe("");
    expect(getChangedValues({}, { [nicknameWordsKey]: values[nicknameWordsKey] }, descriptors)).toEqual({});
  });

  it("保存并重新加载多行昵称词表，正文词表保持独立", () => {
    const original = parseBackendValues({ [bodyWordsKey]: "正文限制" }, descriptors);
    const words = "广告\nSpam,推广，刷屏";
    const current = { ...original, [nicknameWordsKey]: words };
    const payload = getChangedValues(original, current, descriptors);
    const reloaded = parseBackendValues({ ...original, ...payload }, descriptors);

    expect(payload).toEqual({ [nicknameWordsKey]: words });
    expect(reloaded[nicknameWordsKey]).toBe(words);
    expect(reloaded[bodyWordsKey]).toBe("正文限制");
    expect(getChangedValues(reloaded, current, descriptors)).toEqual({});
  });

  it("清空后仍提交空字符串，重新加载不会恢复旧词表", () => {
    const original = parseBackendValues({ [nicknameWordsKey]: "广告\nSpam" }, descriptors);
    const payload = getChangedValues(original, { ...original, [nicknameWordsKey]: "" }, descriptors);

    expect(payload).toEqual({ [nicknameWordsKey]: "" });
    expect(parseBackendValues({ ...original, ...payload }, descriptors)[nicknameWordsKey]).toBe("");
  });
});
