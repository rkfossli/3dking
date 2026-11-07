"use client";
import { useActionState, useState, useTransition } from "react";
import { addFilamentAction, addFilamentsAction, deleteFilamentAction, setInStockAction, type FilamentState } from "@/app/filament-actions";
import { PALETTE, colorFill } from "@/lib/palette";
import { ConfirmButton } from "./ConfirmButton";
import { Icon } from "./Icon";

// Fargekartet: alle PLA-fargene til Bambu Lab, gruppert etter type.
// Trykk på fargene du har (flere om gangen) og legg dem til med én knapp.
// Farger som allerede er lagt inn, er merket med en hake og kan ikke velges igjen.
export function FilamentForm({ existing }: { existing: string[] }) {
  const have = new Set(existing.map((n) => n.toLowerCase()));
  const [picked, setPicked] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const q = query.trim().toLowerCase();

  function toggle(name: string) {
    setPicked((p) => (p.includes(name) ? p.filter((n) => n !== name) : [...p, name]));
  }

  function add() {
    setError(null);
    const all = PALETTE.flatMap((g) => g.colors);
    start(async () => {
      const res = await addFilamentsAction(all.filter((c) => picked.includes(c.name)));
      if (res.error) setError(res.error);
      else setPicked([]);
    });
  }

  return (
    <div className="form">
      <label>
        Søk
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="For eksempel Silk eller Blue" />
      </label>
      {PALETTE.map((g, i) => {
        const colors = q ? g.colors.filter((c) => c.name.toLowerCase().includes(q)) : g.colors;
        if (colors.length === 0) return null;
        const chosen = g.colors.filter((c) => picked.includes(c.name)).length;
        const owned = g.colors.filter((c) => have.has(c.name.toLowerCase())).length;
        return (
          <details key={g.line} className="pal-group" open={q !== "" || i === 0}>
            <summary>
              <span>{g.line}</span>
              <span className="muted small-text">
                {chosen > 0 ? `${chosen} valgt · ` : ""}
                {owned > 0 ? `${owned} av ${g.colors.length} inne` : `${g.colors.length} farger`}
              </span>
            </summary>
            <div className="palette" role="group" aria-label={g.line}>
              {colors.map((c) => {
                const added = have.has(c.name.toLowerCase());
                const on = picked.includes(c.name);
                return (
                  <button
                    key={c.name}
                    type="button"
                    className={`pal${on ? " on" : ""}`}
                    disabled={added || pending}
                    aria-pressed={on}
                    title={c.name}
                    onClick={() => toggle(c.name)}
                  >
                    <span className="pal-dot" style={{ background: colorFill(c.hex) }}>
                      {(on || added) && <Icon name="tick" size={16} />}
                    </span>
                    <span className="pal-name">{c.name.slice(g.line.length + 1)}</span>
                  </button>
                );
              })}
            </div>
          </details>
        );
      })}
      {error && <p className="error small-text">{error}</p>}
      <div className="pal-add">
        <button type="button" onClick={add} disabled={pending || picked.length === 0}>
          {pending ? "Legger til …" : picked.length === 0 ? "Trykk på fargene du har" : `Legg til ${picked.length === 1 ? "1 farge" : `${picked.length} farger`}`}
        </button>
      </div>
      <details className="own-color">
        <summary>Mangler fargen? Lag din egen</summary>
        <OwnColorForm />
      </details>
    </div>
  );
}

// Egen farge: navn og fargekode. Forhåndsvisningen viser fargen mens du skriver.
function OwnColorForm() {
  const [hex, setHex] = useState("#");
  // React tømmer feltene selv etter innsending. Fargekoden styres av oss, så den nullstilles her.
  const [state, action, pending] = useActionState<FilamentState, FormData>(async (prev, form) => {
    const res = await addFilamentAction(prev, form);
    if (res.ok) setHex("#");
    return res;
  }, {});
  const valid = /^#[0-9a-f]{6}$/i.test(hex);
  return (
    <form action={action} className="form">
      <div className="filament-fields">
        <span className="swatch big own-preview" style={{ background: valid ? hex : "transparent" }} aria-hidden />
        <label>
          Navn
          <input name="name" placeholder="For eksempel Galaksesvart" maxLength={60} required />
        </label>
      </div>
      <label>
        Fargekode
        <input name="hex" value={hex} onChange={(e) => setHex(e.target.value)} placeholder="#3a2f6b" maxLength={7} autoCapitalize="none" />
      </label>
      <p className="muted small-text">Fargekoden står ofte på nettsiden der du kjøpte filamentet, for eksempel #3a2f6b.</p>
      {state.error && <p className="error small-text">{state.error}</p>}
      <button type="submit" className="secondary" disabled={pending}>{pending ? "Lagrer …" : "Legg til egen farge"}</button>
    </form>
  );
}

// Én farge i listen: prøve, navn, På lager/Tom og Slett.
export function FilamentRow({ id, name, hex, inStock }: { id: number; name: string; hex: string; inStock: boolean }) {
  const [pending, start] = useTransition();
  return (
    <li className={`user-row${inStock ? "" : " inactive"}`}>
      <div className="thumb-row">
        <span className="swatch big" style={{ background: colorFill(hex) }} />
        <div>
          <b>{name}</b>
          {!inStock && <span className="tag">tom</span>}
        </div>
      </div>
      <div className="row-buttons">
        <button type="button" className="small secondary" disabled={pending} onClick={() => start(() => setInStockAction(id, !inStock))}>
          {inStock ? "Tom" : "På lager"}
        </button>
        <ConfirmButton
          disabled={pending}
          question={`Slette fargen «${name}»? Gamle bestillinger beholder fargen.`}
          confirmLabel="Ja, slett"
          onConfirm={() => start(() => deleteFilamentAction(id))}
        >
          Slett
        </ConfirmButton>
      </div>
    </li>
  );
}
