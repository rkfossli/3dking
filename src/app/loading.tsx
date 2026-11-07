// Vises mens en side lastes: grå blokker som blinker, i stedet for en tom skjerm.
export default function Loading() {
  return (
    <main className="page skeleton" aria-busy="true" aria-label="Laster">
      <span className="sk sk-title" />
      <span className="sk sk-line" />
      <div className="sk-grid">
        <span className="sk sk-card" />
        <span className="sk sk-card" />
        <span className="sk sk-card" />
        <span className="sk sk-card" />
      </div>
    </main>
  );
}
