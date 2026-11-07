// Formatering som kan brukes både på serveren og i nettleseren.

/** 150 → "150 kr" */
export function kr(n: number): string {
  return `${n.toLocaleString("nb-NO")} kr`;
}
