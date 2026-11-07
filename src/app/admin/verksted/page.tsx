import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { workshopStats } from "@/lib/orders";
import { kr, when } from "@/lib/format";
import { statsSince } from "@/lib/stats";
import { RestartStats } from "@/components/RestartStats";
import { AdminNav } from "@/components/AdminNav";

export const dynamic = "force-dynamic";

/** 1. januar i år, norsk tid (nesten: midnatt UTC er 01:00 i Norge, godt nok for statistikk). */
function startOfYear(): Date {
  const year = Number(new Intl.DateTimeFormat("nb-NO", { timeZone: "Europe/Oslo", year: "numeric" }).format(new Date()));
  return new Date(Date.UTC(year, 0, 1));
}

// Verkstedet: store tall om alt 3DKing har printet. ?periode=ar viser bare i år.
export default async function WorkshopPage({ searchParams }: PageProps<"/admin/verksted">) {
  await requireAdmin();
  const { periode } = await searchParams;
  const thisYear = periode === "ar";
  const s = await workshopStats(thisYear ? startOfYear() : undefined);
  const since = await statsSince();

  return (
    <main className="page">
      <AdminNav active="verksted" />
      <nav className="tabs small-tabs">
        <Link href="/admin/verksted" className={thisYear ? "" : "on"}>Hele tiden</Link>
        <Link href="/admin/verksted?periode=ar" className={thisYear ? "on" : ""}>I år</Link>
      </nav>
      <div className="big-stats">
        <div className="big-stat">
          <b>{s.printed}</b>
          <span>ting printet</span>
        </div>
        <div className="big-stat">
          <b>{s.orders}</b>
          <span>bestillinger</span>
        </div>
        <div className="big-stat">
          <b>{s.customers}</b>
          <span>{s.customers === 1 ? "kunde" : "kunder"}</span>
        </div>
        <div className="big-stat">
          <b>{kr(s.filament)}</b>
          <span>filament brukt</span>
        </div>
        <div className="big-stat wide">
          <b>{s.top ? s.top.name : "Ingen ennå"}</b>
          <span>{s.top ? `Mest bestilt · ${s.top.items} stk` : "Mest bestilt"}</span>
        </div>
      </div>
      <p className="muted small-text">
        Avbrutte bestillinger teller ikke. «Ting printet» er det som er ferdig laget eller levert. Kundene har betalt eller skal betale {kr(s.income)} til
        sammen, som dekker filament og strøm.
      </p>
      <div className="card stats-start">
        <p className="small-text">
          {since ? <>Tellingen startet <b>{when(since)}</b>. Bestillinger fra før er ikke med.</> : "Tellingen tar med alle bestillinger."}
        </p>
        <RestartStats />
      </div>
    </main>
  );
}
