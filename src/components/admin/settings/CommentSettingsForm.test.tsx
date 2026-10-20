import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getKeysByCategory, parseBackendValues } from "@/lib/settings/setting-descriptors";
import { KEY_COMMENT_FORBIDDEN_WORDS, KEY_COMMENT_NICKNAME_FORBIDDEN_WORDS } from "@/lib/settings/setting-keys";
import { CommentSettingsForm } from "./CommentSettingsForm";

vi.mock("@/components/ui/form-code-editor", () => ({
  FormCodeEditor: () => null,
}));

vi.mock("@/components/ui/form-monaco-editor", () => ({
  FormMonacoEditor: () => null,
}));

describe("CommentSettingsForm nickname forbidden words", () => {
  it("旧配置缺失昵称词表时显示空输入框和匹配规则", () => {
    render(<CommentSettingsForm values={{}} onChange={() => {}} />);

    expect(screen.getByLabelText("昵称违禁词列表")).toHaveValue("");
    expect(screen.getByText(/每行一个词，也支持中英文逗号分隔/)).toHaveTextContent(
      "英文不区分大小写。昵称包含任一词将无法提交评论，留空不限制。"
    );
  });

  it("读取昵称词表并独立上报编辑和清空，不修改正文词表", () => {
    const onChange = vi.fn();
    const values = parseBackendValues(
      {
        [KEY_COMMENT_NICKNAME_FORBIDDEN_WORDS]: "广告\nSpam",
        [KEY_COMMENT_FORBIDDEN_WORDS]: "正文限制",
      },
      getKeysByCategory("user-comment")
    );
    const { rerender } = render(<CommentSettingsForm values={values} onChange={onChange} />);
    const input = screen.getByLabelText("昵称违禁词列表");

    expect(input).toHaveValue("广告\nSpam");
    expect(screen.getByLabelText("违禁词列表")).toHaveValue("正文限制");

    fireEvent.change(input, { target: { value: "广告\nSpam,推广，刷屏" } });
    expect(onChange).toHaveBeenLastCalledWith(KEY_COMMENT_NICKNAME_FORBIDDEN_WORDS, "广告\nSpam,推广，刷屏");

    rerender(
      <CommentSettingsForm
        values={{ ...values, [KEY_COMMENT_NICKNAME_FORBIDDEN_WORDS]: "广告\nSpam,推广，刷屏" }}
        onChange={onChange}
      />
    );
    fireEvent.change(input, { target: { value: "" } });

    expect(onChange).toHaveBeenLastCalledWith(KEY_COMMENT_NICKNAME_FORBIDDEN_WORDS, "");
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(screen.getByLabelText("违禁词列表")).toHaveValue("正文限制");
  });
});
