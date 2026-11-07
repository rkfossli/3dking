import { Icon } from "@/components/Icon";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { users } from "@/lib/schema";
import { ordersForUser, type OrderRow } from "@/lib/orders";
import { kr, orderNo, plural, when, CUSTOMER_STATUS_LABEL } from "@/lib/format";
import { CancelMyOrder } from "@/components/OrderActions";
import { AdminReply } from "@/components/AdminReply";
import { ChangeResponse } from "@/components/ChangeResponse";
import { OrderSteps } from "@/components/OrderSteps";

export const dynamic = "force-dynamic";

// «Mine bestillinger»: det brukeren har bestilt, og hvor langt Liam har kommet.
// Delt i to: «Pågår» (mottatt og ferdig laget) øverst, og «Tidligere» (levert og avbrutt) sammenfoldet under.
export default async function MyOrdersPage() {
  const user = await requireUser();
  const list = await ordersForUser(user.id);
  const active = list.filter((o) => o.status === "ny" || o.status === "laget");
  const earlier = list.filter((o) => o.status === "levert" || o.status === "avbrutt");

  // Husk når brukeren var her, så tallet på «Mine bestillinger»-knappen forsvinner.
  // Det som er endret siden forrige gang får merket «Nytt» denne ene gangen.
  const lastSeen = user.ordersSeenAt;
  const isNew = (changed: Date | null) => changed != null && (lastSeen == null || changed > lastSeen);
  const db = await getDb();
  await db.update(users).set({ ordersSeenAt: new Date() }).where(eq(users.id, user.id));

  // Én bestilling i listen. Brukes i begge delene.
  const item = (o: OrderRow, inGroup = false) => (
    <li key={o.id} className={`card order status-${o.status}`}>
      <div className="order-head">
        <span>
          <b>{o.quantity} × {o.productName}</b>
          {o.orderNumber && !inGroup && <span className="order-no">{orderNo(o.orderNumber)}</span>}
        </span>
        <span className="badges">
          {isNew(o.changedByAdminAt) && <span className="badge nytt">Nytt</span>}
          {o.status === "avbrutt" && <span className="badge avbrutt">{CUSTOMER_STATUS_LABEL[o.status]}</span>}
        </span>
      </div>
      {/* Statuslinja viser hvor langt bestillingen har kommet: Mottatt → Ferdig → Levert. */}
      <OrderSteps status={o.status} />
      {/* Prisen står tydelig for seg selv, så kunden ser hva de skal betale. */}
      <p className="order-price">
        <b>{kr(o.quantity * o.unitPriceNok)}</b> <span className="muted small-text">(filament og strøm)</span>
        {o.status !== "avbrutt" && (
          <span className={`badge ${o.paidAt ? "betalt" : "ubetalt"}`}>{o.paidAt ? "Betalt" : "Ikke betalt ennå"}</span>
        )}
      </p>
      <p className="muted small-text">
        Bestilt {when(o.createdAt)}
        {o.madeAt && ` · laget ${when(o.madeAt)}`}
        {o.deliveredAt && ` · levert ${when(o.deliveredAt)}`}
      </p>
      {o.note && <p className="small-text">Ditt ønske: «{o.note}»</p>}
      {o.status === "laget" && !o.deliveryPlan && (
        <p className="small-text with-icon"><Icon name="ready" /> Ferdig laget! 3DKing sier fra når og hvor du får den.</p>
      )}
      <AdminReply approval={o.approval} reply={o.adminReply} repliedAt={o.repliedAt} deliveryPlan={o.deliveryPlan} title="Svar fra 3DKing" />
      {/* Har 3DKing foreslått endringer, kan kunden svare (og avbryte) i én boks. Ellers vanlig Avbryt-knapp. */}
      {o.approval === "endringer" && (o.status === "ny" || o.status === "laget") ? (
        <ChangeResponse id={o.id} status={o.status} response={o.customerResponse} note={o.customerNote} />
      ) : (
        o.status === "ny" && <CancelMyOrder id={o.id} />
      )}
    </li>
  );

  // Ting som ble bestilt fra samme handlekurv (samme ordrenummer) vises i én boks.
  const grouped = (rows: OrderRow[]) => {
    const groups: OrderRow[][] = [];
    for (const o of rows) {
      const g = o.orderNumber ? groups.find((x) => x[0].orderNumber === o.orderNumber) : undefined;
      if (g) g.push(o);
      else groups.push([o]);
    }
    return groups.map((g) =>
      g.length === 1 ? (
        item(g[0], false)
      ) : (
        <li key={`ordre-${g[0].orderNumber}`} className="card order-group">
          <div className="order-head">
            <b>Ordre {orderNo(g[0].orderNumber)}</b>
            <span className="muted small-text">
              {plural(g.length, "ting", "ting")} · {kr(g.reduce((sum, o) => sum + o.quantity * o.unitPriceNok, 0))}
            </span>
          </div>
          <ul className="order-list">{g.map((o) => item(o, true))}</ul>
        </li>
      ),
    );
  };

  return (
    <main className="page">
      <h1>Mine bestillinger</h1>
      {list.length === 0 && (
        <div className="card">
          <p className="muted">Du har ikke bestilt noe ennå.</p>
          <Link href="/" className="button empty-cta">
            Finn noe du liker i butikken
          </Link>
        </div>
      )}

      {list.length > 0 && (
        <>
          <h2 className="section-title">Pågår</h2>
          {active.length === 0 && <p className="muted small-text">Ingenting på gang akkurat nå.</p>}
          <ul className="order-list">{grouped(active)}</ul>
        </>
      )}

      {earlier.length > 0 && (
        // <details> er et innebygd HTML-element som kan foldes ut og inn uten JavaScript.
        <details className="earlier">
          <summary>Tidligere ({plural(earlier.length, "bestilling", "bestillinger")})</summary>
          <ul className="order-list">{grouped(earlier)}</ul>
        </details>
      )}
    </main>
  );
}
