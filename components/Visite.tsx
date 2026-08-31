"use client";

import { useEffect, useState } from "react";

const K_CONTATA = "promptforge:visita-contata";

/**
 * Il contatore visibile in fondo alla pagina. Registra la visita una volta per
 * sessione del browser; se l'archivio non è configurato non mostra nulla,
 * invece di esibire uno zero che non significa niente.
 */
export default function Visite() {
  const [visite, setVisite] = useState<number | null>(null);

  useEffect(() => {
    let contata = false;
    try {
      contata = sessionStorage.getItem(K_CONTATA) === "1";
    } catch {
      /* niente archivio di sessione: al massimo conta due volte */
    }

    fetch("/api/visite", { method: contata ? "GET" : "POST" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.disponibile) return;
        setVisite(d.visite);
        try {
          sessionStorage.setItem(K_CONTATA, "1");
        } catch {
          /* ignora */
        }
      })
      .catch(() => {
        /* il contatore è un di più: se non risponde, resta invisibile */
      });
  }, []);

  if (visite === null) return null;

  return (
    <span className="visite" title="Visite totali al sito">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      </svg>
      <b>{visite.toLocaleString("it-IT")}</b> visite
    </span>
  );
}
