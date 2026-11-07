import Link from "next/link";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { users } from "@/lib/schema";
import { ordersForUser } from "@/lib/orders";
import { kr, when, STATUS_LABEL } from "@/lib/format";
import { CancelMyOrder } from "@/components/OrderActions";
import { AdminReply } from "@/components/AdminReply";

export const dynamic = "force-dynamic";

// «Mine bestillinger»: det brukeren har bestilt, og hvor langt Liam har kommet.
export default async function MyOrdersPage() {
  const user = await requireUser();
  const list = await ordersForUser(user.id);

  // Husk når brukeren var her, så tallet på «Mine bestillinger»-knappen forsvinner.
  // Det som er endret siden forrige gang får merket «Nytt» denne ene gangen.
  const lastSeen = user.ordersSeenAt;
  const isNew = (changed: Date | null) => changed != null && (lastSeen == null || changed > lastSeen);
  const db = await getDb();
  await db.update(users).set({ ordersSeenAt: new Date() }).where(eq(users.id, user.id));

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
              <span>
                {isNew(o.changedByAdminAt) && <span className="badge nytt">Nytt</span>}{" "}
                <span className={`badge ${o.status}`}>{STATUS_LABEL[o.status]}</span>
              </span>
            </div>
            <p className="muted small-text">
              Bestilt {when(o.createdAt)} · {kr(o.quantity * o.unitPriceNok)}
              {o.madeAt && ` · laget ${when(o.madeAt)}`}
              {o.deliveredAt && ` · levert ${when(o.deliveredAt)}`}
            </p>
            {o.note && <p className="small-text">Din kommentar: «{o.note}»</p>}
            {o.status === "laget" && !o.deliveryPlan && (
              <p className="small-text">🎉 Ferdig laget! Liam gir beskjed om når den leveres.</p>
            )}
            <AdminReply approval={o.approval} reply={o.adminReply} repliedAt={o.repliedAt} deliveryPlan={o.deliveryPlan} title="Svar fra 3DKing" />
            {o.status === "ny" && <CancelMyOrder id={o.id} />}
          </li>
        ))}
      </ul>
    </main>
  );
}
