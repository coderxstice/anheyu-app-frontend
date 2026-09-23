import { describe, expect, it } from "vitest";
import { getChangedValues, getKeysByCategory, parseBackendValues } from "./setting-descriptors";
import {
  KEY_DEFAULT_THEME_MODE,
  KEY_DISABLE_RIGHT_MENU,
  KEY_THEME_DARK_START_TIME,
  KEY_THEME_LIGHT_START_TIME,
} from "./setting-keys";

describe("setting-descriptors appearance-page", () => {
  it("包含全站关闭右键菜单开关", () => {
    expect(getKeysByCategory("appearance-page")).toContainEqual({
      backendKey: KEY_DISABLE_RIGHT_MENU,
      type: "boolean",
      defaultValue: "false",
    });
  });
});

describe("setting-descriptors site-basic", () => {
  it("为自动主题时间提供统一默认值", () => {
    expect(getKeysByCategory("site-basic")).toEqual(
      expect.arrayContaining([
        { backendKey: KEY_THEME_LIGHT_START_TIME, type: "string", defaultValue: "08:00" },
        { backendKey: KEY_THEME_DARK_START_TIME, type: "string", defaultValue: "20:00" },
      ])
    );
  });

  it("保留严格主题字段的原始空白，并允许提交规范值修复", () => {
    const descriptors = getKeysByCategory("site-basic");
    const parsed = parseBackendValues(
      {
        [KEY_DEFAULT_THEME_MODE]: "auto ",
        [KEY_THEME_LIGHT_START_TIME]: "08:00 ",
        [KEY_THEME_DARK_START_TIME]: "21:00",
      },
      descriptors
    );

    expect(parsed[KEY_DEFAULT_THEME_MODE]).toBe("auto ");
    expect(parsed[KEY_THEME_LIGHT_START_TIME]).toBe("08:00 ");
    expect(
      getChangedValues(
        parsed,
        {
          ...parsed,
          [KEY_DEFAULT_THEME_MODE]: "auto",
          [KEY_THEME_LIGHT_START_TIME]: "08:00",
        },
        descriptors
      )
    ).toEqual({
      [KEY_DEFAULT_THEME_MODE]: "auto",
      [KEY_THEME_LIGHT_START_TIME]: "08:00",
    });
  });
});


describe("optional festive settings", () => {
  it("defaults to disabled and keeps both labels as text", () => {
    expect(getKeysByCategory("appearance-skin")).toEqual(expect.arrayContaining([
      { backendKey: "fireworks.enable", type: "boolean", defaultValue: "false" },
      { backendKey: "fireworks.button_text", type: "string", defaultValue: "节日快乐" },
      { backendKey: "fireworks.message", type: "string", defaultValue: "愿你的每一天都有新的惊喜" },
    ]));
  });
});
