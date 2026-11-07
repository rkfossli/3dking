"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteProductAction, setAvailableAction } from "@/app/product-actions";

// Knappene på hvert produkt i admin-listen: Endre, Skjul/Vis og Slett.
export function ProductRowActions({ id, name, available }: { id: number; name: string; available: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="row-actions">
      <div className="row-buttons">
        <Link href={`/admin/produkter/${id}`} className="button small secondary">Endre</Link>
        <button type="button" className="small secondary" disabled={pending} onClick={() => start(() => setAvailableAction(id, !available))}>
          {available ? "Skjul" : "Vis"}
        </button>
        <button
          type="button"
          className="small danger"
          disabled={pending}
          onClick={() => {
            if (!confirm(`Slette «${name}» for godt? Dette kan ikke angres.`)) return;
            start(async () => setError((await deleteProductAction(id)).error ?? null));
          }}
        >
          Slett
        </button>
      </div>
      {error && <p className="error small-text">{error}</p>}
    </div>
  );
}
