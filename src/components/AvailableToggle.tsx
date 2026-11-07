"use client";
import { useTransition } from "react";
import { setAvailableAction } from "@/app/product-actions";

export function AvailableToggle({ id, available }: { id: number; available: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" className="small secondary" disabled={pending} onClick={() => start(() => setAvailableAction(id, !available))}>
      {available ? "Skjul" : "Vis"}
    </button>
  );
}
