import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const REVALIDATE_TOKEN = process.env.REVALIDATE_TOKEN || "anheyu-revalidate-secret";

interface RevalidateBody {
  article?: string;
  articleID?: string;
  siteConfig?: boolean;
  categories?: boolean;
  tagsList?: boolean;
  tags?: string[];
  all?: boolean;
}

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-revalidate-token");
  if (token !== REVALIDATE_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: RevalidateBody = await request.json();
    const revalidated: string[] = [];

    if (body.all) {
      revalidatePath("/", "layout");
      revalidated.push("all");
    } else {
      const articleSlugs = new Set<string>();
      if (body.article) articleSlugs.add(body.article);
      if (body.articleID) articleSlugs.add(body.articleID);

      if (articleSlugs.size > 0) {
        for (const slug of articleSlugs) {
          revalidatePath(`/posts/${slug}`, "page");
          revalidatePath(`/doc/${slug}`, "page");
        }
        revalidatePath("/", "page");
        revalidatePath("/tags", "page");
        revalidatePath("/categories", "page");
        revalidated.push(`article:${[...articleSlugs].join(",")}`);
      }

      if (body.siteConfig) {
        revalidatePath("/", "layout");
        revalidated.push("siteConfig");
      }

      if (body.categories) {
        revalidatePath("/categories", "layout");
        revalidatePath("/", "page");
        revalidated.push("categories");
      }

      if (body.tagsList) {
        revalidatePath("/tags", "layout");
        revalidatePath("/", "page");
        revalidated.push("tags");
      }

      if (body.tags?.length) {
        revalidatePath("/link", "page");
        revalidated.push(`tags:${body.tags.join(",")}`);
      }
    }

    return NextResponse.json({ revalidated, now: Date.now() });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
