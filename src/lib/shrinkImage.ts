// Krymper et bilde i nettleseren før det lastes opp.
// Et mobilbilde kan være 5 MB. Krympet til 1200 px blir det ca. 150–300 kB,
// som går raskere å laste opp og sparer gratiskvoten i Vercel Blob.

const MAX_SIDE = 1200;

export async function shrinkImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  // Tegn bildet på et usynlig "lerret" (canvas) i den nye størrelsen.
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);

  // Lagre lerretet som JPEG med 82 % kvalitet.
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Klarte ikke å krympe bildet."))), "image/jpeg", 0.82),
  );
  return new File([blob], "bilde.jpg", { type: "image/jpeg" });
}
