"use client";
import Link from "next/link";
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
  const [done, setDone] = useState<number | null>(null);
  const [pending, start] = useTransition();
  const q = query.trim().toLowerCase();

  function toggle(name: string) {
    setPicked((p) => (p.includes(name) ? p.filter((n) => n !== name) : [...p, name]));
  }

  function add() {
    setError(null);
    setDone(null);
    const all = PALETTE.flatMap((g) => g.colors);
    start(async () => {
      const res = await addFilamentsAction(all.filter((c) => picked.includes(c.name)));
      if (res.error) setError(res.error);
      else {
        setDone(picked.length);
        setPicked([]);
      }
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
      {done != null && (
        <p className="ok-text small-text">
          La til {done === 1 ? "1 farge" : `${done} farger`}. <Link href="/admin/farger">Se Mine farger</Link>
        </p>
      )}
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
    <form noValidate action={action} className="form">
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

type MyColor = { id: number; name: string; hex: string; inStock: boolean };

/** Hvilken Bambu-type en farge hører til, ut fra navnet. Farger Liam har laget selv havner i «Egne farger». */
function lineOf(name: string): string {
  const hit = PALETTE.map((g) => g.line).filter((l) => name.startsWith(l + " ")).sort((a, b) => b.length - a.length)[0];
  return hit ?? "Egne farger";
}

// Mine farger: alle fargene Liam har, gruppert etter type som små ruter.
// Trykk på en rute for å bytte mellom «inne» og «tom». I «Rediger» kan han fjerne farger.
export function MyColors({ list }: { list: MyColor[] }) {
  const [filter, setFilter] = useState<"alle" | "inne" | "tom">("alle");
  const [edit, setEdit] = useState(false);
  const [pending, start] = useTransition();
  const empty = list.filter((c) => !c.inStock).length;
  const shown = list.filter((c) => (filter === "alle" ? true : filter === "inne" ? c.inStock : !c.inStock));

  // Samme rekkefølge som i fargekartet, med egne farger til slutt.
  const order = [...PALETTE.map((g) => g.line), "Egne farger"];
  const groups = order
    .map((line) => ({ line, colors: shown.filter((c) => lineOf(c.name) === line) }))
    .filter((g) => g.colors.length > 0);

  return (
    <div className="my-colors">
      <div className="my-colors-bar">
        <div className="seg" role="group" aria-label="Vis">
          <button type="button" className={filter === "alle" ? "on" : ""} aria-pressed={filter === "alle"} onClick={() => setFilter("alle")}>Alle ({list.length})</button>
          <button type="button" className={filter === "inne" ? "on" : ""} aria-pressed={filter === "inne"} onClick={() => setFilter("inne")}>Inne ({list.length - empty})</button>
          <button type="button" className={filter === "tom" ? "on" : ""} aria-pressed={filter === "tom"} onClick={() => setFilter("tom")}>Tom ({empty})</button>
        </div>
        <button type="button" className={`small ${edit ? "" : "secondary"}`} onClick={() => setEdit(!edit)}>
          {edit ? "Ferdig" : "Rediger"}
        </button>
      </div>
      <p className="muted small-text">
        {edit ? "Trykk «Fjern» på farger du ikke vil ha i listen lenger." : "Trykk på en farge for å merke den som tom eller inne igjen."}
      </p>
      {groups.length === 0 && <p className="muted">Ingen farger her.</p>}
      {groups.map((g) => (
        <section key={g.line} className="my-group">
          <h3>{g.line}</h3>
          <div className="palette">
            {g.colors.map((c) => {
              const short = g.line === "Egne farger" ? c.name : c.name.slice(g.line.length + 1);
              if (edit) {
                return (
                  <div key={c.id} className="pal mine-edit">
                    <span className="pal-dot" style={{ background: colorFill(c.hex) }} />
                    <span className="pal-name">{short}</span>
                    <ConfirmButton
                      disabled={pending}
                      className="small danger"
                      question={`Fjerne «${c.name}»? Gamle bestillinger beholder fargen.`}
                      confirmLabel="Ja, fjern"
                      onConfirm={() => start(() => deleteFilamentAction(c.id))}
                    >
                      Fjern
                    </ConfirmButton>
                  </div>
                );
              }
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`pal${c.inStock ? "" : " empty"}`}
                  disabled={pending}
                  aria-pressed={c.inStock}
                  title={c.inStock ? `${c.name}: trykk for å merke som tom` : `${c.name}: trykk når den er inne igjen`}
                  onClick={() => start(() => setInStockAction(c.id, !c.inStock))}
                >
                  <span className="pal-dot" style={{ background: colorFill(c.hex) }} />
                  <span className="pal-name">{short}</span>
                  <span className={`pal-state${c.inStock ? "" : " off"}`}>{c.inStock ? "Inne" : "Tom"}</span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
