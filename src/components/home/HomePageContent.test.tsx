import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { HomePageContent } from "./HomePageContent";

vi.mock("@/components/home", () => ({
 HomeTop: () => <div>顶部</div>, CategoryBar: () => <div>分类</div>,
 FeedArticleList: () => <article>文章内容</article>, Sidebar: () => <aside>侧边栏</aside>,
}));
it("server rendered homepage remains visible before animation or hydration", () => {
 const html = renderToStaticMarkup(<HomePageContent/>);
 expect(html).toContain("文章内容");
 expect(html).not.toContain("opacity:0");
 expect(html).not.toContain("visibility:hidden");
});
