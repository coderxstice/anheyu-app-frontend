import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSiteConfigStore } from "@/store/site-config-store";
import { FestiveFireworks } from "./FestiveFireworks";
let pathname = "/posts/demo";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));
let reduced = false;
let mobile = false;
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: query.includes("reduced-motion") ? reduced : mobile, addEventListener() {}, removeEventListener() {} }));
  useSiteConfigStore.setState({ siteConfig: {} });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); reduced = false; mobile = false; pathname = "/posts/demo"; });
describe("optional festive fireworks", () => {
  it("does not show a control or run animation by default", () => {
    render(<FestiveFireworks />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(document.querySelector("[data-firework-particle]")).toBeNull();
  });
  it("starts only after click and stops on Escape", () => {
    useSiteConfigStore.setState({ siteConfig: { fireworks: { enable: true, button_text: "节日快乐" } } });
    render(<FestiveFireworks />);
    expect(document.querySelectorAll("[data-firework-particle]")).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "节日快乐" }));
    expect(document.querySelectorAll("[data-firework-particle]").length).toBeGreaterThan(0);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(document.querySelectorAll("[data-firework-particle]")).toHaveLength(0);
  });
  it("shows static wishes with reduced motion, supports stopping and cleans timers", () => {
    reduced = true;
    useSiteConfigStore.setState({ siteConfig: { fireworks: { enable: true, button_text: "新年快乐" } } });
    const { unmount } = render(<FestiveFireworks />);
    fireEvent.click(screen.getByRole("button", { name: "新年快乐" }));
    expect(screen.getByRole("status")).toHaveTextContent("新年快乐");
    expect(document.querySelectorAll("[data-firework-particle]")).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "停止烟花" }));
    expect(screen.queryByRole("status")).toBeNull();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("renders configured labels as plain text and stops on navigation or disable", () => {
    useSiteConfigStore.setState({ siteConfig: { fireworks: { enable: true, button_text: "<b>庆祝</b>", message: "<img src=x>祝福" } } });
    const { rerender } = render(<FestiveFireworks />);
    fireEvent.click(screen.getByRole("button", { name: "<b>庆祝</b>" }));
    expect(screen.getByRole("status")).toHaveTextContent("<img src=x>祝福");
    expect(document.querySelector("img")).toBeNull();
    pathname = "/posts/another";
    rerender(<FestiveFireworks />);
    expect(screen.queryByRole("status")).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
    fireEvent.click(screen.getByRole("button", { name: "<b>庆祝</b>" }));
    act(() => useSiteConfigStore.setState({ siteConfig: { fireworks: { enable: false } } }));
    expect(screen.queryByRole("button")).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("uses fewer particles on mobile and stops automatically", () => {
    mobile = true;
    useSiteConfigStore.setState({ siteConfig: { fireworks: { enable: true } } });
    render(<FestiveFireworks />);
    fireEvent.click(screen.getByRole("button", { name: "节日快乐" }));
    expect(document.querySelectorAll("[data-firework-particle]")).toHaveLength(18);
    act(() => vi.advanceTimersByTime(6000));
    expect(document.querySelectorAll("[data-firework-particle]")).toHaveLength(0);
  });
});
