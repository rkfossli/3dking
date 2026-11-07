import { Icon } from "./Icon";

// Statuslinja på en bestilling: Mottatt → Ferdig → Levert.
// Steget bestillingen er på lyser i temafargen, ferdige steg får en hake. Avbrutte bestillinger viser ingen linje.
const STEPS = [
  { key: "ny", label: "Mottatt" },
  { key: "laget", label: "Ferdig" },
  { key: "levert", label: "Levert" },
] as const;

export function OrderSteps({ status }: { status: string }) {
  const at = STEPS.findIndex((s) => s.key === status);
  if (at < 0) return null;
  // Levert er siste steg: da er alle stegene ferdige.
  const doneUpTo = status === "levert" ? STEPS.length : at;
  return (
    <ol className="steps" aria-label={`Status: ${STEPS[at].label}`}>
      {STEPS.map((s, i) => (
        <li key={s.key} className={i < doneUpTo ? "done" : i === at ? "now" : ""}>
          <span className="step-dot">{i < doneUpTo ? <Icon name="tick" size={14} /> : null}</span>
          <span className="step-lbl">{s.label}</span>
        </li>
      ))}
    </ol>
  );
}
