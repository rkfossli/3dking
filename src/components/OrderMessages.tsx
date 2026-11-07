"use client";
import { useActionState, useEffect, useRef } from "react";
import { sendMessageAction, type MessageState } from "@/app/message-actions";
import { when } from "@/lib/format";
import { Icon } from "./Icon";

export type MessageView = { id: number; userId: number; body: string; createdAt: Date; fromAdmin: boolean; userName: string };

// Samtalen på en bestilling, som en liten chat. Mine meldinger står til høyre, de andres til venstre.
// `meId` er den som ser på. Kunden ser «3DKing» i stedet for Liams navn.
export function OrderMessages({ orderNumber, messages, meId, meIsAdmin }: { orderNumber: string; messages: MessageView[]; meId: number; meIsAdmin: boolean }) {
  const [state, action, pending] = useActionState<MessageState, FormData>(sendMessageAction, {});
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) form.current?.reset();
  }, [state]);

  return (
    <details className="messages" open={messages.length > 0}>
      <summary>
        <Icon name="message" size={16} /> Meldinger{messages.length > 0 && ` (${messages.length})`}
      </summary>
      {messages.length > 0 && (
        <ul className="chat">
          {messages.map((m) => {
            const mine = m.userId === meId;
            return (
              <li key={m.id} className={mine ? "mine" : ""}>
                <span className="bubble">{m.body}</span>
                <span className="muted chat-meta">
                  {mine ? "Deg" : m.fromAdmin ? "3DKing" : m.userName} · {when(new Date(m.createdAt))}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <form ref={form} action={action} className="chat-form">
        <input type="hidden" name="orderNumber" value={orderNumber} />
        <input name="body" placeholder={meIsAdmin ? "Skriv til kunden" : "Skriv til 3DKing"} maxLength={500} aria-label="Melding" required />
        <button type="submit" className="small" disabled={pending}>{pending ? "…" : "Send"}</button>
      </form>
      {state.error && <p className="error small-text">{state.error}</p>}
    </details>
  );
}
