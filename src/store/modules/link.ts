import { defineStore } from "pinia";
import { getPublicLinkList, getPublicLinkCategories } from "@/api/postLink";
import type { LinkItem, LinkCategory } from "@/api/postLink/type";

interface LinkState {
  categories: LinkCategory[];
  linksByCategory: Record<
    number,
    {
      list: LinkItem[];
      page: number;
      total: number;
      loading: boolean;
      finished: boolean;
    }
  >;
  bannerLinks: LinkItem[];
  bannerDataLoaded: boolean;
}

export const useLinkStore = defineStore("postLink", {
  state: (): LinkState => ({
    categories: [],
    linksByCategory: {},
    bannerLinks: [],
    bannerDataLoaded: false
  }),
  actions: {
    async fetchCategories() {
      if (this.categories.length > 0) return;
      const res = await getPublicLinkCategories();
      if (res.code === 200) {
        this.categories = res.data;
        this.categories.forEach(cat => {
          this.linksByCategory[cat.id] = {
            list: [],
            page: 0,
            total: 0,
            loading: false,
            finished: false
          };
        });
      }
    },
    async fetchInitialBannerLinks() {
      if (this.bannerDataLoaded) return;
      const res = await getPublicLinkList({ page: 1, pageSize: 100 });
      if (res.code === 200 && res.data.list) {
        const allLinks = res.data.list;
        const cardLinks = allLinks.filter(
          link => link.category?.style === "card"
        );
        const listLinks = allLinks.filter(
          link => link.category?.style === "list"
        );
        let finalLinks = [...cardLinks];
        if (finalLinks.length < 30) {
          const needed = 30 - finalLinks.length;
          finalLinks = [...finalLinks, ...listLinks.slice(0, needed)];
        }
        this.bannerLinks = finalLinks.slice(0, 30);
        this.bannerDataLoaded = true;
      }
    },
    async fetchLinksForCategory(categoryId: number) {
      const categoryState = this.linksByCategory[categoryId];
      if (categoryState.loading || categoryState.finished) return;
      categoryState.loading = true;
      categoryState.page += 1;
      try {
        const res = await getPublicLinkList({
          category_id: categoryId,
          page: categoryState.page,
          pageSize: 20
        });
        if (res.code === 200 && res.data.list) {
          const fetchedLinks = res.data.list;
          categoryState.list.push(...fetchedLinks);
          categoryState.total = res.data.total;
          if (
            fetchedLinks.length < 20 ||
            categoryState.list.length >= categoryState.total
          ) {
            categoryState.finished = true;
          }
        } else {
          categoryState.page -= 1;
        }
      } catch (error) {
        console.error(
          `Failed to fetch links for category ${categoryId}`,
          error
        );
        categoryState.page -= 1;
      } finally {
        categoryState.loading = false;
      }
    }
  }
});
