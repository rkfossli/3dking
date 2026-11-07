import { colorFill, type NamedColor } from "@/lib/palette";

// Fargene på en bestilling: hovedfargen først, så farge 2 og 3 hvis det er valgt flere.
export function ColorLine({ main, extra, as = "p" }: { main: NamedColor | null; extra: NamedColor[]; as?: "p" | "span" }) {
  if (!main && extra.length === 0) return null;
  const Tag = as;
  const many = extra.length > 0;
  return (
    <Tag className="small-text color-line">
      {main && (
        <span className="color-item">
          <span className="swatch" style={{ background: colorFill(main.hex) }} /> {many && "Hoved: "}
          {main.name}
        </span>
      )}
      {extra.map((c, i) => (
        <span key={i} className="color-item">
          <span className="swatch" style={{ background: colorFill(c.hex) }} /> {c.name}
        </span>
      ))}
    </Tag>
  );
}
