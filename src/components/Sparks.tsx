// Små gnister som skytes ut i en ring, til feiringer (for eksempel «Bestilt!»).
// Hver gnist får sin egen vinkel (--a), og CSS-animasjonen «spark» i globals.css flytter den utover.
export function Sparks({ count = 12 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="spark" aria-hidden style={{ ["--a" as string]: `${(360 / count) * i}deg`, animationDelay: `${(i % 3) * 40}ms` }} />
      ))}
    </>
  );
}
