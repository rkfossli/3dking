import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { ordersByStatus, isStatus, type Status } from "@/lib/orders";
import { kr, when, STATUS_LABEL } from "@/lib/format";
import { AdminNav } from "@/components/AdminNav";
import { AdminOrderActions } from "@/components/OrderActions";

export const dynamic = "force-dynamic";

const FILTERS: (Status | "alle")[] = ["ny", "laget", "levert", "avbrutt", "alle"];

// Liams bestillingsfane. ?vis=laget i adressen velger hvilke bestillinger som vises.
export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/bestillinger">) {
  await requireAdmin();
  const { vis } = await searchParams;
  const filter: Status | "alle" = typeof vis === "string" && (isStatus(vis) || vis === "alle") ? vis : "ny";
  const list = await ordersByStatus(filter);

  // Summer for det som vises: hva brukerne betaler, og hva filamentet kostet.
  const total = list.reduce((sum, o) => sum + o.quantity * o.unitPriceNok, 0);
  const cost = list.reduce((sum, o) => sum + o.quantity * (o.costNok ?? 0), 0);

  return (
    <main className="page">
      <AdminNav active="bestillinger" />
      <nav className="tabs small-tabs">
        {FILTERS.map((f) => (
          <Link key={f} href={`/admin/bestillinger?vis=${f}`} className={f === filter ? "on" : ""}>
            {f === "alle" ? "Alle" : STATUS_LABEL[f]}
          </Link>
        ))}
      </nav>

      {list.length === 0 && <div className="card"><p className="muted">Ingen bestillinger her.</p></div>}
      {list.length > 0 && (
        <p className="muted small-text">
          {list.length} bestilling(er) · {kr(total)} · filament ca. {kr(cost)}
        </p>
      )}

      <ul className="order-list">
        {list.map((o) => (
          <li key={o.id} className={`card order status-${o.status}`}>
            <div className="order-head">
              <b>{o.quantity} × {o.productName}</b>
              <span className={`badge ${o.status}`}>{STATUS_LABEL[o.status]}</span>
            </div>
            <p className="small-text">
              Til <b>{o.userName}</b> · {kr(o.quantity * o.unitPriceNok)}
            </p>
            <p className="muted small-text">
              Bestilt {when(o.createdAt)}
              {o.madeAt && ` · laget ${when(o.madeAt)}`}
              {o.deliveredAt && ` · levert ${when(o.deliveredAt)}`}
            </p>
            {o.note && <p className="small-text">«{o.note}»</p>}
            <AdminOrderActions id={o.id} status={o.status} />
          </li>
        ))}
      </ul>
    </main>
  );
}
