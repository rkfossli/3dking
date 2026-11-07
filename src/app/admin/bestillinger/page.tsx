import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { countByStatus, ordersByStatus, isStatus, type OrderRow, type Status } from "@/lib/orders";
import { kr, orderNo, plural, when, CUSTOMER_RESPONSE_LABEL, STATUS_LABEL } from "@/lib/format";
import { OrderReplyForm } from "@/components/OrderReplyForm";
import { AdminReply } from "@/components/AdminReply";
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
  const counts = await countByStatus();

  // Summer for det som vises: hva brukerne betaler, og hva filamentet kostet.
  const total = list.reduce((sum, o) => sum + o.quantity * o.unitPriceNok, 0);
  const cost = list.reduce((sum, o) => sum + o.quantity * (o.costNok ?? 0), 0);

  // Samle bestillingene per person. Rekkefølgen er den første bestillingen til hver person.
  const groups: { userId: number; userName: string; orders: OrderRow[] }[] = [];
  for (const o of list) {
    const g = groups.find((x) => x.userId === o.userId);
    if (g) g.orders.push(o);
    else groups.push({ userId: o.userId, userName: o.userName, orders: [o] });
  }

  // Én bestilling med knapper og svar-skjema. inGroup = den ligger i en boks for én person.
  const orderCard = (o: OrderRow, inGroup: boolean) => (
    <li key={o.id} className={`card order status-${o.status}`}>
      <div className="order-head">
        <span>
          <b>{o.quantity} × {o.productName}</b>
          {o.orderNumber && <span className="order-no">{orderNo(o.orderNumber)}</span>}
        </span>
        <span className="badges">
          {o.status !== "avbrutt" && (
            <span className={`badge ${o.paidAt ? "betalt" : "ubetalt"}`}>{o.paidAt ? "Betalt" : "Ikke betalt"}</span>
          )}
          <span className={`badge ${o.status}`}>{STATUS_LABEL[o.status]}</span>
        </span>
      </div>
      <p className="small-text">
        {inGroup ? kr(o.quantity * o.unitPriceNok) : <>Bestilt av <b>{o.userName}</b> · {kr(o.quantity * o.unitPriceNok)}</>}
      </p>
      <p className="muted small-text">
        Bestilt {when(o.createdAt)}
        {o.madeAt && ` · laget ${when(o.madeAt)}`}
        {o.deliveredAt && ` · levert ${when(o.deliveredAt)}`}
        {o.paidAt && ` · betalt ${when(o.paidAt)}`}
      </p>
      {o.colorName && (
        <p className="small-text color-line">
          <span className="swatch" style={{ background: o.colorHex ?? undefined }} /> {o.colorName}
        </p>
      )}
      {o.note && <p className="small-text">«{o.note}»</p>}
      <AdminReply approval={o.approval} reply={o.adminReply} repliedAt={o.repliedAt} deliveryPlan={o.deliveryPlan} title="Ditt svar" />
      {o.approval === "endringer" && (
        <p className={`customer-response small-text ${o.customerResponse ?? "venter"}`}>
          <b>{o.userName}:</b>{" "}
          {o.customerResponse ? CUSTOMER_RESPONSE_LABEL[o.customerResponse] : "har ikke svart på endringene ennå"}
          {o.customerNote && <> · «{o.customerNote}»</>}
          {o.customerRespondedAt && <span className="muted"> · {when(o.customerRespondedAt)}</span>}
        </p>
      )}
      <AdminOrderActions id={o.id} status={o.status} paid={o.paidAt != null} />
      {o.status !== "avbrutt" && (
        <OrderReplyForm id={o.id} userName={o.userName} approval={o.approval} reply={o.adminReply} deliveryPlan={o.deliveryPlan} status={o.status} />
      )}
    </li>
  );

  return (
    <main className="page">
      <AdminNav active="bestillinger" />
      <nav className="tabs small-tabs">
        {FILTERS.map((f) => {
          // Tallet viser hvor mange som ligger under hvert filter. «Alle» får ikke tall.
          const n = f === "alle" ? 0 : counts[f];
          return (
            <Link key={f} href={`/admin/bestillinger?vis=${f}`} className={f === filter ? "on" : ""}>
              {f === "alle" ? "Alle" : STATUS_LABEL[f]}
              {n > 0 && <span className="filter-count">{n}</span>}
            </Link>
          );
        })}
      </nav>

      {list.length === 0 && <div className="card"><p className="muted">Ingen bestillinger her.</p></div>}
      {list.length > 0 && (
        <p className="muted small-text">
          {plural(list.length, "bestilling", "bestillinger")} · {kr(total)} · filament ca. {kr(cost)}
          {(filter === "ny" || filter === "laget") && " · eldste først"}
        </p>
      )}

      <ul className="order-list">
        {groups.map((g) =>
          g.orders.length === 1 ? (
            orderCard(g.orders[0], false)
          ) : (
            // Flere bestillinger fra samme person samles i én boks, så Liam ser at de hører sammen.
            <li key={`kunde-${g.userId}`} className="card customer-group">
              <div className="order-head">
                <b>{g.userName}</b>
                <span className="muted small-text">
                  {plural(g.orders.length, "bestilling", "bestillinger")} · {kr(g.orders.reduce((sum, o) => sum + o.quantity * o.unitPriceNok, 0))}
                </span>
              </div>
              <ul className="order-list">{g.orders.map((o) => orderCard(o, true))}</ul>
            </li>
          ),
        )}
      </ul>
    </main>
  );
}
