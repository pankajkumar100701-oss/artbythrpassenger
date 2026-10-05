import "server-only";

import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { BlobPreconditionFailedError, del, get, put } from "@vercel/blob";

/**
 * Where the Studio keeps what it saves.
 *
 * On a live host (Vercel) the disk is read-only, so with BLOB_READ_WRITE_TOKEN set everything
 * goes to a private Vercel Blob store instead. Without it (local development) plain files are used.
 */
export const usingBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

// Private: the login state must never be readable from a URL. Images are served through /media.
const ACCESS = "private" as const;

/**
 * A JSON document. `file` is the local copy (and, on Blob, the starting content until the first save);
 * `empty` is used when neither exists yet.
 */
export type JsonDoc<T> = { key: string; file: string; empty?: () => T };

async function readLocal<T>(doc: JsonDoc<T>): Promise<T> {
  try {
    return JSON.parse(await readFile(doc.file, "utf8")) as T;
  } catch (err) {
    if (doc.empty) return doc.empty();
    throw err;
  }
}

async function readBlob<T>(doc: JsonDoc<T>): Promise<{ data: T; etag?: string }> {
  const res = await get(doc.key, { access: ACCESS, useCache: false });
  if (res?.statusCode === 200) return { data: JSON.parse(await new Response(res.stream).text()) as T, etag: res.blob.etag };
  return { data: await readLocal(doc) };
}

export async function readDoc<T>(doc: JsonDoc<T>): Promise<T> {
  return usingBlob() ? (await readBlob(doc)).data : readLocal(doc);
}

// One queue for all writes in this process, so two quick saves can't overwrite each other.
let queue: Promise<unknown> = Promise.resolve();

/**
 * Applies a change to a document and saves it.
 * Locally: write a temp file, then rename. On Blob: save only if nobody else saved in between, else retry.
 */
export function updateDoc<T, R>(doc: JsonDoc<T>, change: (data: T) => R | Promise<R>): Promise<R> {
  const run = queue.then(async () => {
    if (!usingBlob()) {
      const data = await readLocal(doc);
      const result = await change(data);
      await mkdir(path.dirname(doc.file), { recursive: true });
      const tmp = `${doc.file}.${process.pid}.tmp`;
      await writeFile(tmp, JSON.stringify(data, null, 2) + "\n", { mode: 0o600 });
      await rename(tmp, doc.file);
      return result;
    }

    for (let attempt = 0; ; attempt++) {
      const { data, etag } = await readBlob(doc);
      const result = await change(data);
      try {
        await put(doc.key, JSON.stringify(data, null, 2) + "\n", {
          access: ACCESS,
          contentType: "application/json",
          addRandomSuffix: false,
          allowOverwrite: true,
          ...(etag ? { ifMatch: etag } : {}),
        });
        return result;
      } catch (err) {
        // Another server instance saved first: start again from its version.
        if (err instanceof BlobPreconditionFailedError && attempt < 4) continue;
        throw err;
      }
    }
  });
  queue = run.catch(() => {});
  return run;
}

// ------------------------------------------------------------------ uploaded files

export async function saveFile(dir: string, name: string, data: Buffer, contentType: string) {
  if (usingBlob()) {
    await put(`${path.basename(dir)}/${name}`, data, { access: ACCESS, contentType, addRandomSuffix: false, allowOverwrite: true });
    return;
  }
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), data);
}

export async function deleteFile(dir: string, name: string) {
  if (usingBlob()) await del(`${path.basename(dir)}/${name}`).catch(() => {});
  else await unlink(path.join(dir, name)).catch(() => {});
}

/** The file's bytes as a stream, or null when it doesn't exist. */
export async function openFile(dir: string, name: string): Promise<BodyInit | null> {
  if (usingBlob()) {
    const res = await get(`${path.basename(dir)}/${name}`, { access: ACCESS }).catch(() => null);
    return res?.statusCode === 200 ? res.stream : null;
  }
  return readFile(path.join(dir, name)).then((b) => new Uint8Array(b)).catch(() => null);
}
