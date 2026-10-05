import { UPLOAD_DIR } from "@/lib/artworks";
import { openFile } from "@/lib/store";

// Serves images uploaded from the Studio (content/uploads locally, Vercel Blob when live).
export async function GET(_req: Request, ctx: RouteContext<"/media/[...path]">) {
  const { path: parts } = await ctx.params;
  const name = parts.join("/");
  // Only plain "<uuid>.webp" names — blocks ../ and anything else.
  if (!/^[a-f0-9-]{36}\.webp$/.test(name)) return new Response("Not found", { status: 404 });

  const file = await openFile(UPLOAD_DIR, name);
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(file, {
    headers: {
      "Content-Type": "image/webp",
      // File names are random and never reused, so they can be cached forever.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
