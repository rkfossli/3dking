import Link from "next/link";
import { kr, when } from "@/lib/format";
import type { Wish } from "@/lib/wishes";
import { DeleteWish, WishReply } from "./WishActions";

const STATUS: Record<string, string> = { ny: "Venter på svar", ja: "Ja!", nei: "Nei" };

// Ett ønske, slik kunden og Liam ser det. `admin` viser hvem som ønsket det og svar-skjemaet.
export function WishCard({ wish: w, admin = false }: { wish: Wish; admin?: boolean }) {
  return (
    <li className={`card wish status-${w.status}`}>
      <div className="order-head">
        <span>
          {admin ? <b>{w.userName}</b> : <b>Ditt ønske</b>}
          <span className="order-no">{when(w.createdAt)}</span>
        </span>
        <span className={`badge wish-${w.status}`}>{STATUS[w.status] ?? w.status}</span>
      </div>
      <p className="wish-text">{w.text}</p>
      {w.link && (
        <p className="small-text">
          <a href={w.link} target="_blank" rel="noreferrer">{w.link.replace(/^https?:\/\//, "").slice(0, 60)}</a>
        </p>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element -- små bilder fra kunden */}
      {w.imageUrl && <img src={w.imageUrl} alt="" className="wish-img" loading="lazy" />}
      {(w.status !== "ny" || w.adminReply) && !admin && (
        <div className="admin-reply">
          <p className="small-text">
            <b>Svar fra 3DKing:</b> {w.status === "ja" ? `Ja, for ${kr(w.priceNok ?? 0)} (filament og strøm).` : w.status === "nei" ? "Nei, dessverre." : ""}
          </p>
          {w.adminReply && <p className="small-text">«{w.adminReply}»</p>}
        </div>
      )}
      {!admin && w.productId && (
        <Link href={`/produkt/${w.productId}`} className="button small">Bestill den</Link>
      )}
      {!admin && w.status === "ja" && !w.productId && <p className="muted small-text">3DKing legger den ut under Modeller, så kan du bestille den.</p>}
      {!admin && w.status === "ny" && <DeleteWish id={w.id} />}
      {admin && <WishReply id={w.id} status={w.status} price={w.priceNok} reply={w.adminReply} productId={w.productId} />}
    </li>
  );
}
