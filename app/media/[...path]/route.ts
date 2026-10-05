import { readFile } from "node:fs/promises";
import path from "node:path";
import { UPLOAD_DIR } from "@/lib/artworks";

// Serves images uploaded from the Studio (stored in content/uploads).
export async function GET(_req: Request, ctx: RouteContext<"/media/[...path]">) {
  const { path: parts } = await ctx.params;
  const name = parts.join("/");
  // Only plain "<uuid>.webp" names — blocks ../ and anything else.
  if (!/^[a-f0-9-]{36}\.webp$/.test(name)) return new Response("Not found", { status: 404 });

  try {
    const file = await readFile(path.join(UPLOAD_DIR, name));
    return new Response(file, {
      headers: {
        "Content-Type": "image/webp",
        // File names are random and never reused, so they can be cached forever.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
