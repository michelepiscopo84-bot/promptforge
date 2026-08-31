"use client";

import { useState } from "react";
import { chiavePlausibile } from "@/lib/chiave";

interface Props {
  chiave: string;
  salva: (chiave: string) => void;
  dimentica: () => void;
  chiudi: () => void;
  /** Se il sito ha già una chiave sua, quella del visitatore è facoltativa. */
  chiaveDelSito: boolean;
}

export default function Chiave({ chiave, salva, dimentica, chiudi, chiaveDelSito }: Props) {
  const [bozza, setBozza] = useState(chiave);
  const [errore, setErrore] = useState<string | null>(null);

  function conferma() {
    const c = bozza.trim();
    if (!c) {
      setErrore("Incolla la chiave prima di salvare.");
      return;
    }
    if (!chiavePlausibile(c)) {
      setErrore("Non sembra una chiave Anthropic: iniziano tutte con sk-ant- e sono lunghe.");
      return;
    }
    setErrore(null);
    salva(c);
  }

  return (
    <section className="panel chiave-pannello">
      <div className="panel-body" style={{ borderTop: "none", paddingTop: 16 }}>
        <div className="chiave-top">
          <p className="sotto-tit" style={{ margin: 0 }}>
            La tua chiave Anthropic
          </p>
          <button className="btn ghost mini" onClick={chiudi}>
            Chiudi
          </button>
        </div>

        <p className="panel-intro" style={{ marginTop: 10 }}>
          Serve solo a <b>Rifinisci con AI</b> e <b>Prova</b>. Tutto il resto — generatore,
          revisione, punteggio, variabili, libreria — funziona senza.
          {chiaveDelSito && " Il sito ne ha già una: la tua, se la metti, ha la precedenza."}
        </p>

        {errore && <div className="avviso err">{errore}</div>}

        <div className="chiave-riga">
          <input
            type="password"
            value={bozza}
            onChange={(e) => setBozza(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && conferma()}
            placeholder="sk-ant-..."
            className="mono"
            autoComplete="off"
            spellCheck={false}
            aria-label="Chiave API Anthropic"
          />
          <button className="btn primary" onClick={conferma}>
            Salva
          </button>
          {chiave && (
            <button className="btn ghost" onClick={dimentica}>
              Dimentica
            </button>
          )}
        </div>

        <ul className="tips">
          <li>
            Resta salvata <b>solo nel tuo browser</b>. Viaggia dentro la singola richiesta
            per parlare con Anthropic e non viene scritta da nessuna parte sul server.
          </li>
          <li>
            Il consumo lo paghi tu, sul tuo account. Un prompt rifinito costa qualche
            centesimo di dollaro.
          </li>
          <li>
            La crei su{" "}
            <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">
              console.anthropic.com
            </a>{" "}
            → API Keys. Serve un account con credito: Anthropic non ha un piano gratuito
            permanente.
          </li>
          <li>
            Su un computer condiviso usa <b>Dimentica</b> quando hai finito.
          </li>
        </ul>
      </div>
    </section>
  );
}
