"use client";

import { useState, type ReactNode } from "react";
import { conta } from "@/lib/builder";
import type { Diagnosi } from "@/lib/qualita";
import type { Salvato } from "@/lib/types";

type Scheda = "prompt" | "qualita" | "variabili" | "libreria";

interface Props {
  prompt: string;
  rifinito: string | null;
  vista: "generato" | "rifinito";
  setVista: (v: "generato" | "rifinito") => void;
  diagnosi: Diagnosi;
  variabili: string[];
  valori: Record<string, string>;
  setValore: (nome: string, valore: string) => void;
  salvati: Salvato[];
  salva: () => void;
  carica: (id: string) => void;
  elimina: (id: string) => void;
  copia: () => void;
  scarica: () => void;
  rifinisci: () => void;
  azzera: () => void;
  caricamento: boolean;
  aiDisponibile: boolean | null;
  errore: string | null;
  avviso: string | null;
}

/* Evidenziazione leggera: tag, intestazioni, grassetti e segnaposto. */
const RX =
  /(<\/?[a-z_]+>)|(\{\{[^}]+\}\}|\[[A-ZÀ-Ü][A-ZÀ-Ü0-9 _/-]{2,}\])|(^#{2,3} .+$)|(\*\*[^*]+\*\*)/gm;

function evidenzia(testo: string): ReactNode[] {
  const nodi: ReactNode[] = [];
  let ultimo = 0;
  let i = 0;
  for (const m of testo.matchAll(RX)) {
    const idx = m.index ?? 0;
    if (idx > ultimo) nodi.push(testo.slice(ultimo, idx));
    const cls = m[1] ? "tag" : m[2] ? "v" : m[3] ? "h" : "b";
    nodi.push(
      <span className={cls} key={i++}>
        {m[0]}
      </span>,
    );
    ultimo = idx + m[0].length;
  }
  if (ultimo < testo.length) nodi.push(testo.slice(ultimo));
  return nodi;
}

function Anello({ valore }: { valore: number }) {
  const r = 13;
  const giro = 2 * Math.PI * r;
  const colore =
    valore >= 85 ? "#52d19a" : valore >= 65 ? "#ff8a4c" : valore >= 40 ? "#e0b341" : "#6f7481";
  return (
    <svg className="ring" width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
      <circle className="bg" cx="16" cy="16" r={r} />
      <circle
        cx="16"
        cy="16"
        r={r}
        stroke={colore}
        strokeLinecap="round"
        strokeDasharray={giro}
        strokeDashoffset={giro * (1 - valore / 100)}
      />
    </svg>
  );
}

export default function Risultato(p: Props) {
  const [scheda, setScheda] = useState<Scheda>("prompt");
  const s = conta(p.prompt);
  const vuoto = !p.prompt.trim();
  const mancanti = p.diagnosi.voci.filter((v) => !v.ok).length;

  return (
    <div className="rail">
      <div className="panel">
        <div className="tabs" role="tablist">
          <button
            role="tab"
            aria-selected={scheda === "prompt"}
            onClick={() => setScheda("prompt")}
          >
            Prompt
          </button>
          <button
            role="tab"
            aria-selected={scheda === "qualita"}
            onClick={() => setScheda("qualita")}
          >
            Qualità
            {mancanti > 0 && <span className="count">{mancanti}</span>}
          </button>
          <button
            role="tab"
            aria-selected={scheda === "variabili"}
            onClick={() => setScheda("variabili")}
          >
            Variabili
            {p.variabili.length > 0 && <span className="count">{p.variabili.length}</span>}
          </button>
          <button
            role="tab"
            aria-selected={scheda === "libreria"}
            onClick={() => setScheda("libreria")}
          >
            Libreria
            {p.salvati.length > 0 && <span className="count">{p.salvati.length}</span>}
          </button>
        </div>

        <div className="tab-body">
          {p.errore && <div className="avviso err">{p.errore}</div>}
          {p.avviso && <div className="avviso ok">{p.avviso}</div>}

          {/* --------------------------- prompt --------------------------- */}
          {scheda === "prompt" && (
            <>
              <div className="btn-row" style={{ marginBottom: 12 }}>
                <button className="btn primary" onClick={p.copia} disabled={vuoto}>
                  Copia
                </button>
                <button
                  className="btn"
                  onClick={p.rifinisci}
                  disabled={vuoto || p.caricamento || p.aiDisponibile === false}
                  title={
                    p.aiDisponibile === false
                      ? "Richiede ANTHROPIC_API_KEY fra le variabili d'ambiente"
                      : "Fa riscrivere il prompt da Claude"
                  }
                >
                  {p.caricamento ? "Rifinitura…" : "Rifinisci con AI"}
                </button>
                <button className="btn" onClick={p.salva} disabled={vuoto}>
                  Salva
                </button>
                <button className="btn ghost" onClick={p.scarica} disabled={vuoto}>
                  .txt
                </button>
                <button className="btn ghost" onClick={p.azzera}>
                  Azzera
                </button>
              </div>

              {p.rifinito && (
                <div className="seg accent" style={{ marginBottom: 12 }}>
                  <button
                    aria-pressed={p.vista === "generato"}
                    onClick={() => p.setVista("generato")}
                  >
                    Generato
                  </button>
                  <button
                    aria-pressed={p.vista === "rifinito"}
                    onClick={() => p.setVista("rifinito")}
                  >
                    Rifinito da Claude
                  </button>
                </div>
              )}

              {vuoto ? (
                <div className="out empty">
                  <span>
                    Compila l&apos;obiettivo, oppure scegli un preset: il prompt
                    compare qui mentre scrivi.
                  </span>
                </div>
              ) : (
                <pre className="out">{evidenzia(p.prompt)}</pre>
              )}

              <div className="meta">
                <span>
                  <b>{s.parole}</b> parole
                </span>
                <span>
                  <b>{s.caratteri}</b> caratteri
                </span>
                <span>
                  ~<b>{s.token}</b> token
                </span>
                <span>
                  <b>{p.diagnosi.punteggio}</b>/100 · {p.diagnosi.livello}
                </span>
              </div>
            </>
          )}

          {/* --------------------------- qualità --------------------------- */}
          {scheda === "qualita" && (
            <>
              <div
                className="score"
                style={{ marginBottom: 14, width: "fit-content" }}
              >
                <Anello valore={p.diagnosi.punteggio} />
                <span className="score-txt">
                  <b>{p.diagnosi.punteggio}/100</b>
                  <small>{p.diagnosi.livello}</small>
                </span>
              </div>

              <div className="voci">
                {p.diagnosi.voci.map((v) => (
                  <div className={`voce ${v.ok ? "fatta" : ""}`} key={v.id}>
                    <span className={`voce-ico ${v.ok ? "si" : "no"}`}>
                      {v.ok ? "✓" : "—"}
                    </span>
                    <span className="voce-txt">
                      <b>{v.etichetta}</b>
                      {!v.ok && <small>{v.consiglio}</small>}
                    </span>
                    <span className="voce-peso">{v.peso}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* -------------------------- variabili -------------------------- */}
          {scheda === "variabili" && (
            <>
              {p.variabili.length === 0 ? (
                <p className="vuoto">
                  Nessun segnaposto nel prompt.
                  <br />
                  Scrivi <code>{"{{cliente}}"}</code> in un campo qualsiasi: comparirà
                  qui, pronto da compilare senza toccare il prompt.
                </p>
              ) : (
                <>
                  <p className="panel-intro" style={{ marginTop: 0 }}>
                    I valori inseriti sostituiscono i segnaposto nel prompt che copi.
                    Lasciane uno vuoto per tenerlo com&apos;è.
                  </p>
                  {p.variabili.map((v) => (
                    <div className="var-riga" key={v}>
                      <span className="var-nome" title={v}>
                        {v}
                      </span>
                      <input
                        type="text"
                        value={p.valori[v] ?? ""}
                        onChange={(e) => p.setValore(v, e.target.value)}
                        placeholder="valore"
                      />
                    </div>
                  ))}
                </>
              )}
            </>
          )}

          {/* --------------------------- libreria --------------------------- */}
          {scheda === "libreria" && (
            <>
              {p.salvati.length === 0 ? (
                <p className="vuoto">
                  Nessun prompt salvato.
                  <br />
                  Il pulsante <b>Salva</b> mette da parte il modulo compilato, non solo
                  il testo: lo riapri e continui a modificarlo.
                </p>
              ) : (
                p.salvati.map((v) => (
                  <div className="riga-lib" key={v.id}>
                    <div>
                      <b>{v.nome}</b>
                      <small>
                        {new Date(v.data).toLocaleDateString("it-IT", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </small>
                    </div>
                    <button className="btn mini" onClick={() => p.carica(v.id)}>
                      Apri
                    </button>
                    <button
                      className="btn ghost mini"
                      onClick={() => p.elimina(v.id)}
                      aria-label={`Elimina ${v.nome}`}
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export { Anello };
