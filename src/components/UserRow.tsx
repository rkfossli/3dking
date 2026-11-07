"use client";
import { useState, useTransition } from "react";
import { resetPinAction, setActiveAction } from "@/app/admin-actions";

type Props = { id: number; displayName: string; username: string; role: string; active: boolean; isMe: boolean };

export function UserRow({ id, displayName, username, role, active, isMe }: Props) {
  const [pin, setPin] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <li className={`user-row${active ? "" : " inactive"}`}>
      <div>
        <b>{displayName}</b> <span className="muted">@{username}</span>
        {role === "admin" && <span className="tag">admin</span>}
        {!active && <span className="tag">av</span>}
        {pin && <p className="pin">Ny PIN: {pin}</p>}
      </div>
      {!isMe && (
        <div className="row-buttons">
          <button
            type="button"
            className="small"
            disabled={pending}
            onClick={() => start(async () => setPin((await resetPinAction(id)).pin))}
          >
            Ny PIN
          </button>
          <button type="button" className="small secondary" disabled={pending} onClick={() => start(() => setActiveAction(id, !active))}>
            {active ? "Slå av" : "Slå på"}
          </button>
        </div>
      )}
    </li>
  );
}
