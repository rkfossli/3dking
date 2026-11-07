"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const KEY = "3dking-skjul-pinhint";

// Forslag på forsiden til kunder som fortsatt bruker PIN-en Liam laget. Forsvinner når de bytter,
// eller når de trykker «Ikke nå» (huskes på denne enheten).
export function PinHint() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- leser nettleseren én gang ved oppstart
      setShow(localStorage.getItem(KEY) !== "1");
    } catch {
      setShow(true);
    }
  }, []);
  if (!show) return null;
  return (
    <div className="card hint">
      <p className="small-text">
        Du bruker PIN-en Liam laget til deg. Lag gjerne din egen, så er det bare du som kan den.
      </p>
      <div className="row-buttons left">
        <Link href="/meg#pin" className="button small">Bytt PIN</Link>
        <button
          type="button"
          className="small secondary"
          onClick={() => {
            try {
              localStorage.setItem(KEY, "1");
            } catch {}
            setShow(false);
          }}
        >
          Ikke nå
        </button>
      </div>
    </div>
  );
}
