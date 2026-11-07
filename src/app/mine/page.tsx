import { Icon } from "@/components/Icon";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { users } from "@/lib/schema";
import { ordersForUser, type OrderRow } from "@/lib/orders";
import { kr, plural, when, CUSTOMER_STATUS_LABEL } from "@/lib/format";
import { CancelMyOrder } from "@/components/OrderActions";
import { AdminReply } from "@/components/AdminReply";
import { ChangeResponse } from "@/components/ChangeResponse";

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
  const item = (o: OrderRow) => (
    <li key={o.id} className={`card order status-${o.status}`}>
      <div className="order-head">
        <b>{o.quantity} × {o.productName}</b>
        <span className="badges">
          {isNew(o.changedByAdminAt) && <span className="badge nytt">Nytt</span>}
          <span className={`badge ${o.status}`}>{CUSTOMER_STATUS_LABEL[o.status]}</span>
        </span>
      </div>
      <p className="muted small-text">
        Bestilt {when(o.createdAt)} · {kr(o.quantity * o.unitPriceNok)}
        {o.status !== "avbrutt" && (o.paidAt ? " · betalt" : " · ikke betalt ennå")}
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

  return (
    <main className="page">
      <p>
        <Link href="/" className="back"><Icon name="arrow-left" size={16} /> Til butikken</Link>
      </p>
      <h1>Mine bestillinger</h1>
      {list.length === 0 && (
        <div className="card">
          <p className="muted">
            Du har ikke bestilt noe ennå. <Link href="/">Finn noe du liker i butikken.</Link>
          </p>
        </div>
      )}

      {list.length > 0 && (
        <>
          <h2 className="section-title">Pågår</h2>
          {active.length === 0 && <p className="muted small-text">Ingenting på gang akkurat nå.</p>}
          <ul className="order-list">{active.map(item)}</ul>
        </>
      )}

      {earlier.length > 0 && (
        // <details> er et innebygd HTML-element som kan foldes ut og inn uten JavaScript.
        <details className="earlier">
          <summary>Tidligere ({plural(earlier.length, "bestilling", "bestillinger")})</summary>
          <ul className="order-list">{earlier.map(item)}</ul>
        </details>
      )}
    </main>
  );
}
