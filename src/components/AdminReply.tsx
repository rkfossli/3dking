import { APPROVAL_LABEL, when } from "@/lib/format";

// Viser svaret fra Liam på en bestilling (godkjent / med endringer, beskjed og planlagt levering).
// Viser ingenting hvis han ikke har svart.
export function AdminReply({
  approval,
  reply,
  repliedAt,
  deliveryPlan,
  title,
}: {
  approval: string | null;
  reply: string | null;
  repliedAt: Date | null;
  deliveryPlan: string | null;
  title: string;
}) {
  if (!approval && !reply && !deliveryPlan) return null;
  return (
    <>
      {(approval || reply) && (
        <div className={`admin-reply ${approval ?? ""}`}>
          <b className="small-text">
            {title}
            {approval && `: ${APPROVAL_LABEL[approval]}`}
          </b>
          {reply && <p className="small-text">«{reply}»</p>}
          {repliedAt && <p className="muted small-text">{when(repliedAt)}</p>}
        </div>
      )}
      {deliveryPlan && (
        <p className="delivery-plan small-text">
          🚚 <b>Planlagt levering:</b> {deliveryPlan}
        </p>
      )}
    </>
  );
}
