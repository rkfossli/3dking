// Formatering som kan brukes både på serveren og i nettleseren.

/** 150 → "150 kr" */
export function kr(n: number): string {
  return `${n.toLocaleString("nb-NO")} kr`;
}

/** Dato og klokkeslett i norsk tid, for eksempel "7. nov. 18:24". */
export function when(d: Date): string {
  return d.toLocaleString("nb-NO", { timeZone: "Europe/Oslo", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** Norske navn på statusene. */
export const STATUS_LABEL: Record<string, string> = {
  ny: "Ny",
  laget: "Laget",
  levert: "Levert",
  avbrutt: "Avbrutt",
};

/** Statusnavnene slik kunden ser dem. «Ny» sier lite til den som har bestilt. */
export const CUSTOMER_STATUS_LABEL: Record<string, string> = {
  ny: "Mottatt",
  laget: "Ferdig laget",
  levert: "Levert",
  avbrutt: "Avbrutt",
};

/** 1 → "1 bestilling", 3 → "3 bestillinger". Riktig flertall i stedet for «bestilling(er)». */
export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** Kundens svar på «godkjent med endringer». */
export const CUSTOMER_RESPONSE_LABEL: Record<string, string> = {
  godtatt: "Endringene er godtatt",
  avslatt: "Endringene er ikke ønsket",
};

/** Teksten som vises for svaret fra admin. */
export const APPROVAL_LABEL: Record<string, string> = {
  godkjent: "Godkjent",
  endringer: "Godkjent med endringer",
};
