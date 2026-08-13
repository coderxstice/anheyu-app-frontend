import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  KEY_DEFAULT_THEME_MODE,
  KEY_THEME_DARK_START_TIME,
  KEY_THEME_LIGHT_START_TIME,
} from "@/lib/settings/setting-keys";
import { SiteBasicForm } from "./SiteBasicForm";

vi.mock("@/components/ui/form-input", () => ({
  FormInput: ({ label, value, onValueChange, type, description, error }: Record<string, unknown>) => (
    <label>
      <span>{label as string}</span>
      <input
        aria-label={label as string}
        type={(type as string) ?? "text"}
        value={(value as string) ?? ""}
        onChange={event => (onValueChange as (value: string) => void)?.(event.target.value)}
      />
      {description ? <small>{description as string}</small> : null}
      {error ? <span role="alert">{error as string}</span> : null}
    </label>
  ),
}));

vi.mock("@/components/ui/form-textarea", () => ({
  FormTextarea: ({ label }: Record<string, unknown>) => <div>{label as string}</div>,
}));

vi.mock("@/components/ui/form-monaco-editor", () => ({
  FormMonacoEditor: ({ label }: Record<string, unknown>) => <div>{label as string}</div>,
}));

vi.mock("@/components/ui/form-switch", () => ({
  FormSwitch: ({ label }: Record<string, unknown>) => <div>{label as string}</div>,
}));

vi.mock("@/components/ui/form-select", () => ({
  FormSelect: ({ label, value, onValueChange, description, children }: Record<string, unknown>) => (
    <label>
      <span>{label as string}</span>
      <select
        aria-label={label as string}
        value={(value as string) ?? ""}
        onChange={event => (onValueChange as (value: string) => void)?.(event.target.value)}
      >
        {children as React.ReactNode}
      </select>
      {description ? <small>{description as string}</small> : null}
    </label>
  ),
  FormSelectItem: ({ children }: { children: React.ReactNode }) => {
    const label = String(children);
    const value = label === "浅色模式" ? "light" : label === "深色模式" ? "dark" : "auto";
    return <option value={value}>{children}</option>;
  },
}));

vi.mock("@/components/ui/spinner", () => ({ Spinner: () => <div>loading</div> }));

vi.mock("./SettingsSection", () => ({
  SettingsSection: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section><h2>{title}</h2>{children}</section>
  ),
  SettingsFieldGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

function values(overrides: Record<string, string> = {}) {
  return {
    [KEY_DEFAULT_THEME_MODE]: "light",
    [KEY_THEME_LIGHT_START_TIME]: "08:00",
    [KEY_THEME_DARK_START_TIME]: "20:00",
    ...overrides,
  };
}

describe("SiteBasicForm scheduled theme", () => {
  it("后台只展示 light/dark/auto，固定模式不展示时间字段", () => {
    render(<SiteBasicForm values={values()} onChange={() => {}} />);

    expect(screen.getByRole("option", { name: "浅色模式" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "深色模式" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "定时自动切换" })).toBeInTheDocument();
    expect(screen.queryByText("跟随系统")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("浅色开始时间")).not.toBeInTheDocument();
  });

  it("自动模式展示本地时间输入并上报字段变更", () => {
    const onChange = vi.fn();
    render(
      <SiteBasicForm
        values={values({ [KEY_DEFAULT_THEME_MODE]: "auto" })}
        onChange={onChange}
      />
    );

    expect(screen.getAllByText(/访客设备本地时间/)).toHaveLength(3);
    expect(screen.getByLabelText("浅色开始时间")).toHaveAttribute("type", "time");
    expect(screen.getByLabelText("浅色开始时间")).toHaveValue("08:00");
    expect(screen.getByLabelText("深色开始时间")).toHaveValue("20:00");

    fireEvent.change(screen.getByLabelText("浅色开始时间"), { target: { value: "09:30" } });
    expect(onChange).toHaveBeenCalledWith(KEY_THEME_LIGHT_START_TIME, "09:30");
  });

  it("旧后端缺失时间键时显示默认计划且不报错", () => {
    render(
      <SiteBasicForm
        values={{ [KEY_DEFAULT_THEME_MODE]: "auto" }}
        onChange={() => {}}
      />
    );

    expect(screen.getByLabelText("浅色开始时间")).toHaveValue("08:00");
    expect(screen.getByLabelText("深色开始时间")).toHaveValue("20:00");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it.each([
    { light: "", dark: "20:00", message: "请输入有效的 HH:mm 时间" },
    { light: "8:00", dark: "20:00", message: "请输入有效的 HH:mm 时间" },
    { light: "08:00 ", dark: "20:00", message: "请输入有效的 HH:mm 时间" },
    { light: "08:00", dark: "08:00", message: "浅色与深色开始时间不能相同" },
  ])("自动模式即时提示无效计划: %o", ({ light, dark, message }) => {
    render(
      <SiteBasicForm
        values={values({
          [KEY_DEFAULT_THEME_MODE]: "auto",
          [KEY_THEME_LIGHT_START_TIME]: light,
          [KEY_THEME_DARK_START_TIME]: dark,
        })}
        onChange={() => {}}
      />
    );

    expect(screen.getAllByRole("alert")).toHaveLength(2);
    expect(screen.getAllByText(message)).toHaveLength(2);
  });
});
