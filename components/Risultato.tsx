"use client";

import { useState, type ReactNode } from "react";
import { conta } from "@/lib/builder";
import type { Rilievo } from "@/lib/lint";
import type { Diagnosi } from "@/lib/qualita";
import type { Salvato } from "@/lib/types";

type Scheda = "prompt" | "analisi" | "variabili" | "prova" | "libreria";
type Vista = "unico" | "coppia" | "json";

interface Props {
  prompt: string;
  system: string;
  user: string;
  payload: string;
  rifinito: string | null;
  versione: "generato" | "rifinito";
  setVersione: (v: "generato" | "rifinito") => void;
  diagnosi: Diagnosi;
  rilievi: Rilievo[];
  variabili: string[];
  valori: Record<string, string>;
  setValore: (nome: string, valore: string) => void;
  salvati: Salvato[];
  salva: () => void;
  carica: (id: string) => void;
  elimina: (id: string) => void;
  copia: (testo: string, cosa: string) => void;
  scarica: () => void;
  rifinisci: () => void;
  esegui: () => void;
  azzera: () => void;
  prova: { risposta: string; uso: { ingresso: number; uscita: number } | null } | null;
  inCorso: "rifinitura" | "prova" | null;
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
  const [vista, setVista] = useState<Vista>("unico");

  const s = conta(p.prompt);
  const vuoto = !p.prompt.trim();
  const mancanti = p.diagnosi.voci.filter((v) => !v.ok).length;
  const gravi = p.rilievi.filter((r) => r.gravita === "alta").length;

  // Il testo da copiare dipende da quale vista stai guardando.
  const corrente =
    vista === "json" ? p.payload : vista === "coppia" ? `${p.system}\n\n${p.user}` : p.prompt;

  const schede: [Scheda, string, number][] = [
    ["prompt", "Prompt", 0],
    ["analisi", "Analisi", mancanti + p.rilievi.length],
    ["variabili", "Variabili", p.variabili.length],
    ["prova", "Prova", 0],
    ["libreria", "Libreria", p.salvati.length],
  ];

  return (
    <div className="rail">
      <div className="panel">
        <div className="tabs" role="tablist">
          {schede.map(([id, nome, n]) => (
            <button
              key={id}
              role="tab"
              aria-selected={scheda === id}
              onClick={() => setScheda(id)}
            >
              {nome}
              {n > 0 && <span className="count">{n}</span>}
            </button>
          ))}
        </div>

        <div className="tab-body">
          {p.errore && <div className="avviso err">{p.errore}</div>}
          {p.avviso && <div className="avviso ok">{p.avviso}</div>}

          {/* ============================ prompt ============================ */}
          {scheda === "prompt" && (
            <>
              <div className="btn-row" style={{ marginBottom: 12 }}>
                <button
                  className="btn primary"
                  onClick={() => p.copia(corrente, vista === "json" ? "Payload" : "Prompt")}
                  disabled={vuoto}
                >
                  Copia
                </button>
                <button
                  className="btn"
                  onClick={p.rifinisci}
                  disabled={vuoto || p.inCorso !== null || p.aiDisponibile === false}
                  title={
                    p.aiDisponibile === false
                      ? "Richiede ANTHROPIC_API_KEY fra le variabili d'ambiente"
                      : "Fa riscrivere il prompt da Claude"
                  }
                >
                  {p.inCorso === "rifinitura" ? "Rifinitura…" : "Rifinisci con AI"}
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

              <div className="seg" style={{ marginBottom: 12 }}>
                <button aria-pressed={vista === "unico"} onClick={() => setVista("unico")}>
                  Testo unico
                </button>
                <button
                  aria-pressed={vista === "coppia"}
                  onClick={() => setVista("coppia")}
                  title="Istruzioni stabili nel system, richiesta nel messaggio utente"
                >
                  System + User
                </button>
                <button
                  aria-pressed={vista === "json"}
                  onClick={() => setVista("json")}
                  title="Corpo della richiesta pronto per l'API"
                >
                  JSON API
                </button>
              </div>

              {p.rifinito && vista === "unico" && (
                <div className="seg accent" style={{ marginBottom: 12 }}>
                  <button
                    aria-pressed={p.versione === "generato"}
                    onClick={() => p.setVersione("generato")}
                  >
                    Generato
                  </button>
                  <button
                    aria-pressed={p.versione === "rifinito"}
                    onClick={() => p.setVersione("rifinito")}
                  >
                    Rifinito da Claude
                  </button>
                </div>
              )}

              {vuoto ? (
                <div className="out empty">
                  <span>
                    Compila l&apos;obiettivo, oppure scegli un mestiere fra i preset: il
                    prompt compare qui mentre scrivi.
                  </span>
                </div>
              ) : vista === "coppia" ? (
                <>
                  <div className="blocco-tit">
                    <span>System · istruzioni stabili</span>
                    <button
                      className="btn ghost mini"
                      onClick={() => p.copia(p.system, "System")}
                      disabled={!p.system}
                    >
                      Copia
                    </button>
                  </div>
                  <pre className="out" style={{ minHeight: 0, maxHeight: "26vh" }}>
                    {p.system
                      ? evidenzia(p.system)
                      : "(vuoto: in modalità paragrafo unico va tutto nel messaggio)"}
                  </pre>
                  <div className="blocco-tit" style={{ marginTop: 12 }}>
                    <span>User · richiesta e materiale</span>
                    <button
                      className="btn ghost mini"
                      onClick={() => p.copia(p.user, "Messaggio")}
                    >
                      Copia
                    </button>
                  </div>
                  <pre className="out" style={{ minHeight: 0, maxHeight: "22vh" }}>
                    {evidenzia(p.user)}
                  </pre>
                </>
              ) : vista === "json" ? (
                <pre className="out">{p.payload}</pre>
              ) : (
                <pre className="out">{evidenzia(p.prompt)}</pre>
              )}

              <div className="meta">
                <span>
                  <b>{s.parole}</b> parole
                </span>
                <span>
                  ~<b>{s.token}</b> token
                </span>
                <span>
                  <b>{p.diagnosi.punteggio}</b>/100 · {p.diagnosi.livello}
                </span>
                {gravi > 0 && (
                  <span style={{ color: "var(--red)" }}>
                    <b>{gravi}</b> da correggere
                  </span>
                )}
              </div>
            </>
          )}

          {/* ============================ analisi ============================ */}
          {scheda === "analisi" && (
            <>
              <div className="score" style={{ marginBottom: 16, width: "fit-content" }}>
                <Anello valore={p.diagnosi.punteggio} />
                <span className="score-txt">
                  <b>{p.diagnosi.punteggio}/100</b>
                  <small>{p.diagnosi.livello}</small>
                </span>
              </div>

              <p className="sotto-tit">Revisione del testo</p>
              {p.rilievi.length === 0 ? (
                <p className="vuoto" style={{ padding: "12px 0 20px" }}>
                  Nessun rilievo: niente aggettivi valutativi, quantità indefinite o
                  istruzioni formulate come suggerimenti.
                </p>
              ) : (
                <div className="voci" style={{ marginBottom: 20 }}>
                  {p.rilievi.map((r) => (
                    <div className="voce" key={r.id}>
                      <span className={`voce-ico ${r.gravita === "alta" ? "grave" : "no"}`}>
                        !
                      </span>
                      <span className="voce-txt">
                        <b>
                          <span className="campo-tag">{r.etichetta}</span>
                          <q>{r.trovato}</q> — {r.problema}
                        </b>
                        <small>{r.consiglio}</small>
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <p className="sotto-tit">Completezza</p>
              <div className="voci">
                {p.diagnosi.voci.map((v) => (
                  <div className={`voce ${v.ok ? "fatta" : ""}`} key={v.id}>
                    <span className={`voce-ico ${v.ok ? "si" : "no"}`}>{v.ok ? "✓" : "—"}</span>
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

          {/* =========================== variabili =========================== */}
          {scheda === "variabili" &&
            (p.variabili.length === 0 ? (
              <p className="vuoto">
                Nessun segnaposto nel prompt.
                <br />
                Scrivi <code>{"{{cliente}}"}</code> in un campo qualsiasi: comparirà qui, e
                il prompt resta riutilizzabile senza riscriverlo.
              </p>
            ) : (
              <>
                <p className="panel-intro" style={{ marginTop: 0 }}>
                  I valori sostituiscono i segnaposto nel prompt che copi, esegui o
                  scarichi. Lasciane uno vuoto per tenerlo com&apos;è.
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
            ))}

          {/* ============================= prova ============================= */}
          {scheda === "prova" && (
            <>
              <p className="panel-intro" style={{ marginTop: 0 }}>
                Esegue il prompt su Claude e mostra cosa produce davvero. È l&apos;unico modo
                per sapere se le istruzioni funzionano: il punteggio misura la forma, non il
                risultato.
              </p>

              <div className="btn-row" style={{ marginBottom: 12 }}>
                <button
                  className="btn primary"
                  onClick={p.esegui}
                  disabled={vuoto || p.inCorso !== null || p.aiDisponibile === false}
                >
                  {p.inCorso === "prova" ? "In esecuzione…" : "Esegui il prompt"}
                </button>
                {p.prova && (
                  <button
                    className="btn ghost"
                    onClick={() => p.copia(p.prova?.risposta ?? "", "Risposta")}
                  >
                    Copia risposta
                  </button>
                )}
              </div>

              {p.aiDisponibile === false ? (
                <p className="vuoto">
                  Serve <code>ANTHROPIC_API_KEY</code> fra le variabili d&apos;ambiente.
                  <br />
                  Senza, tutto il resto funziona lo stesso.
                </p>
              ) : p.prova ? (
                <>
                  <pre className="out">{p.prova.risposta}</pre>
                  {p.prova.uso && (
                    <div className="meta">
                      <span>
                        ingresso <b>{p.prova.uso.ingresso}</b>
                      </span>
                      <span>
                        uscita <b>{p.prova.uso.uscita}</b>
                      </span>
                      <span>
                        costo ~$
                        <b>
                          {(
                            (p.prova.uso.ingresso * 5 + p.prova.uso.uscita * 25) /
                            1_000_000
                          ).toFixed(4)}
                        </b>
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <p className="vuoto">
                  Nessuna esecuzione. Ogni prova consuma token Claude Opus 5: qualche
                  centesimo.
                </p>
              )}
            </>
          )}

          {/* ============================ libreria ============================ */}
          {scheda === "libreria" &&
            (p.salvati.length === 0 ? (
              <p className="vuoto">
                Nessun prompt salvato.
                <br />
                <b>Salva</b> mette da parte il modulo compilato, non solo il testo: lo riapri
                e continui a modificarlo.
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
            ))}
        </div>
      </div>
    </div>
  );
}

export { Anello };
