import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ordersForUser } from "@/lib/orders";
import { kr, when, STATUS_LABEL } from "@/lib/format";
import { CancelMyOrder } from "@/components/OrderActions";

export const dynamic = "force-dynamic";

// «Mine bestillinger»: det brukeren har bestilt, og hvor langt Liam har kommet.
export default async function MyOrdersPage() {
  const user = await requireUser();
  const list = await ordersForUser(user.id);

  return (
    <main className="page">
      <p>
        <Link href="/">← Til butikken</Link>
      </p>
      <h1>Mine bestillinger</h1>
      {list.length === 0 && <div className="card"><p className="muted">Du har ikke bestilt noe ennå.</p></div>}
      <ul className="order-list">
        {list.map((o) => (
          <li key={o.id} className={`card order status-${o.status}`}>
            <div className="order-head">
              <b>{o.quantity} × {o.productName}</b>
              <span className={`badge ${o.status}`}>{STATUS_LABEL[o.status]}</span>
            </div>
            <p className="muted small-text">
              Bestilt {when(o.createdAt)} · {kr(o.quantity * o.unitPriceNok)}
              {o.deliveredAt && ` · levert ${when(o.deliveredAt)}`}
            </p>
            {o.note && <p className="small-text">«{o.note}»</p>}
            {o.status === "ny" && <CancelMyOrder id={o.id} />}
          </li>
        ))}
      </ul>
    </main>
  );
}
