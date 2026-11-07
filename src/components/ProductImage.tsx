import { Icon } from "@/components/Icon";
// Viser produktbildet, eller et ikon hvis produktet ikke har bilde.
export function ProductImage({ url, alt }: { url: string | null; alt: string }) {
  if (!url) {
    return <div className="product-img empty" aria-hidden><Icon name="cube" size={40} /></div>;
  }
  // eslint-disable-next-line @next/next/no-img-element -- vi bruker vanlig <img>, ikke next/image (sparer Vercel-kvote)
  return <img src={url} alt={alt} className="product-img" loading="lazy" />;
}
