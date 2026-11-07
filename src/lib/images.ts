// Lagring av produktbilder.
//
// På Vercel lagres bildene i Vercel Blob (en slags harddisk på nett), og databasen
// lagrer bare lenken. Lokalt finnes ikke BLOB_READ_WRITE_TOKEN, og da lagrer vi
// bildet rett i databasen som en "data-URL". Det er greit for testing på PC-en,
// men ikke på nett, der bildene ville gjort databasen stor.
import "server-only";
import { randomUUID } from "node:crypto";
import { del, put } from "@vercel/blob";

const MAX_BYTES = 3 * 1024 * 1024; // 3 MB. Bildene krympes i nettleseren, så de er vanligvis mye mindre.

export function hasBlobStore(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/** Lagrer bildet og gir tilbake lenken. Kaster en feil med en forståelig melding hvis noe er galt. */
export async function saveImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Filen må være et bilde.");
  if (file.size > MAX_BYTES) throw new Error("Bildet er for stort (maks 3 MB).");

  if (!hasBlobStore()) {
    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    return `data:${file.type};base64,${base64}`;
  }
  const ext = file.type === "image/webp" ? "webp" : "jpg";
  const blob = await put(`produkter/${randomUUID()}.${ext}`, file, { access: "public", contentType: file.type });
  return blob.url;
}

/** Sletter et gammelt bilde fra Blob når det byttes ut. Feil her stopper ikke lagringen. */
export async function deleteImage(url: string | null): Promise<void> {
  if (!url || url.startsWith("data:") || !hasBlobStore()) return;
  try {
    await del(url);
  } catch (e) {
    console.error("Klarte ikke å slette gammelt bilde", e);
  }
}
