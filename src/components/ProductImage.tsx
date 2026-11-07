import { Icon } from "@/components/Icon";
// Viser produktbildet. Mangler bildet, vises et ikon og «Bilde kommer snart».
// «small» brukes i admin-listen, der det bare er plass til ikonet.
export function ProductImage({ url, alt, small = false }: { url: string | null; alt: string; small?: boolean }) {
  if (!url) {
    return (
      <div className="product-img empty">
        <Icon name="cube" size={small ? 22 : 40} />
        {!small && <span className="no-image">Bilde kommer snart</span>}
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element -- vi bruker vanlig <img>, ikke next/image (sparer Vercel-kvote)
  return <img src={url} alt={alt} className="product-img" loading="lazy" />;
}
