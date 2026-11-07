"use client";
// Handlekurven lagres i nettleseren (localStorage), så den overlever at appen lukkes.
// Først når kunden trykker «Send bestilling», går innholdet til serveren.
// Komponentene leser kurven med useCart(), og den oppdateres overalt når noe endres.
import { useSyncExternalStore } from "react";

export type CartLine = {
  id: string; // tilfeldig id for linja, så samme produkt kan ligge der to ganger med ulike ønsker
  productId: number;
  name: string;
  price: number; // pris per stk da den ble lagt i kurven (serveren sjekker prisen på nytt)
  imageUrl: string | null;
  quantity: number;
  note: string;
  colorId: number | null;
  colorName: string | null;
  colorHex: string | null;
};

const KEY = "3dking-kurv";
const EMPTY: CartLine[] = [];
let cache: CartLine[] | null = null;
const listeners = new Set<() => void>();

function read(): CartLine[] {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(parsed) ? parsed : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(lines: CartLine[]) {
  cache = lines;
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    // Privat modus eller full lagring: kurven virker likevel til siden lukkes.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Endringer i en annen fane (eller i appen på hjemskjermen) skal også vises her.
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Innholdet i kurven. På serveren (og første gang) er den tom. */
export function useCart(): CartLine[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** Hvor mange ting som ligger i kurven (antall stk til sammen). */
export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}

export function cartTotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity * l.price, 0);
}

export function addToCart(line: Omit<CartLine, "id">) {
  const lines = read();
  // Samme produkt, farge og ønske legges sammen i én linje i stedet for to.
  const same = lines.find((l) => l.productId === line.productId && l.colorId === line.colorId && l.note === line.note);
  if (same) write(lines.map((l) => (l === same ? { ...l, quantity: Math.min(20, l.quantity + line.quantity) } : l)));
  else write([...lines, { ...line, id: Math.random().toString(36).slice(2) }]);
}

export function setQuantity(id: string, quantity: number) {
  write(read().map((l) => (l.id === id ? { ...l, quantity: Math.max(1, Math.min(20, quantity)) } : l)));
}

export function removeLine(id: string) {
  write(read().filter((l) => l.id !== id));
}

export function clearCart() {
  write([]);
}
