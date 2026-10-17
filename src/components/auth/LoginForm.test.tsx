import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSiteConfigStore } from "@/store/site-config-store";
import { authApi } from "@/lib/api/auth";
import { LoginForm } from "./LoginForm";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}));
vi.mock("@/components/common", () => ({ ThemeToggle: () => null }));
vi.mock("@/lib/api/auth", () => ({
  authApi: {
    checkEmail: vi.fn(),
    getCaptchaConfig: vi.fn(),
    register: vi.fn(),
    login: vi.fn(),
  },
}));

describe("LoginForm registration policy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSiteConfigStore.setState({
      siteConfig: { ENABLE_REGISTRATION: true },
      isLoaded: true,
    });
    vi.mocked(authApi.checkEmail).mockResolvedValue({
      code: 200, message: "success", data: { exists: false },
    });
    vi.mocked(authApi.getCaptchaConfig).mockResolvedValue({
      code: 200, message: "success", data: { provider: "none" },
    });
  });

  it.each([true, false])("goes to password login without account discovery when registration=%s", async enabled => {
    useSiteConfigStore.setState({ siteConfig: { ENABLE_REGISTRATION: enabled } });
    render(<LoginForm />);
    fireEvent.change(screen.getByPlaceholderText("电子邮箱"), { target: { value: "user@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    expect(await screen.findByPlaceholderText("密码")).toBeInTheDocument();
    expect(authApi.checkEmail).not.toHaveBeenCalled();
    expect(screen.queryByText(/不存在/)).not.toBeInTheDocument();
  });

  it("keeps explicit registration available when enabled", async () => {
    render(<LoginForm />);
    fireEvent.click(screen.getByRole("button", { name: "立即注册" }));
    expect(await screen.findByPlaceholderText("重复密码")).toBeInTheDocument();
  });

  it("does not open registration through an initial step when disabled", () => {
    useSiteConfigStore.setState({ siteConfig: { ENABLE_REGISTRATION: false } });
    render(<LoginForm initialStep="register" />);
    expect(screen.queryByPlaceholderText("重复密码")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "立即注册" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下一步" })).toBeInTheDocument();
  });

  it("closes an open registration form when the site disables registration", async () => {
    render(<LoginForm initialStep="register" />);
    expect(await screen.findByPlaceholderText("重复密码")).toBeInTheDocument();
    act(() => useSiteConfigStore.setState({ siteConfig: { ENABLE_REGISTRATION: false } }));
    expect(await screen.findByRole("button", { name: "下一步" })).toBeInTheDocument();
    expect(authApi.register).not.toHaveBeenCalled();
  });
});

