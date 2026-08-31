"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { conta, costruisciPrompt, suggerimenti } from "@/lib/builder";
import { PRESETS } from "@/lib/presets";
import { SPEC_VUOTA, type PromptSpec, type Target } from "@/lib/types";

const CHIAVE_STORAGE = "promptforge:spec";

const TARGET: { id: Target; nome: string }[] = [
  { id: "claude", nome: "Claude" },
  { id: "gpt", nome: "GPT" },
  { id: "gemini", nome: "Gemini" },
  { id: "generico", nome: "Generico" },
];

export default function Home() {
  const [spec, setSpec] = useState<PromptSpec>(SPEC_VUOTA);
  const [preset, setPreset] = useState<string | null>(null);
  const [migliorato, setMigliorato] = useState<string | null>(null);
  const [vista, setVista] = useState<"generato" | "migliorato">("generato");
  const [caricamento, setCaricamento] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [avviso, setAvviso] = useState<string | null>(null);
  const [aiDisponibile, setAiDisponibile] = useState<boolean | null>(null);
  const timerAvviso = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ripristina l'ultima sessione e chiedi al server se la chiave API c'è.
  useEffect(() => {
    try {
      const salvato = localStorage.getItem(CHIAVE_STORAGE);
      if (salvato) setSpec({ ...SPEC_VUOTA, ...JSON.parse(salvato) });
    } catch {
      /* localStorage non disponibile: si parte da vuoto */
    }
    fetch("/api/enhance")
      .then((r) => r.json())
      .then((d) => setAiDisponibile(Boolean(d.disponibile)))
      .catch(() => setAiDisponibile(false));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CHIAVE_STORAGE, JSON.stringify(spec));
    } catch {
      /* ignora */
    }
  }, [spec]);

  useEffect(
    () => () => {
      if (timerAvviso.current) clearTimeout(timerAvviso.current);
    },
    [],
  );

  const generato = useMemo(() => costruisciPrompt(spec), [spec]);
  const consigli = useMemo(() => suggerimenti(spec), [spec]);
  const mostrato = vista === "migliorato" && migliorato ? migliorato : generato;
  const statistiche = conta(mostrato);

  function aggiorna<K extends keyof PromptSpec>(campo: K, valore: PromptSpec[K]) {
    setSpec((s) => ({ ...s, [campo]: valore }));
    // Il testo migliorato si riferisce alla versione precedente: non è più valido.
    setMigliorato(null);
    setVista("generato");
  }

  function applicaPreset(id: string) {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    if (preset === id) {
      setPreset(null);
      setSpec(SPEC_VUOTA);
    } else {
      setPreset(id);
      setSpec({ ...SPEC_VUOTA, ...p.spec });
    }
    setMigliorato(null);
    setVista("generato");
  }

  function segnala(messaggio: string) {
    setAvviso(messaggio);
    if (timerAvviso.current) clearTimeout(timerAvviso.current);
    timerAvviso.current = setTimeout(() => setAvviso(null), 2500);
  }

  async function copia() {
    try {
      await navigator.clipboard.writeText(mostrato);
      segnala("Prompt copiato negli appunti.");
    } catch {
      setErrore("Il browser ha bloccato la copia: seleziona il testo manualmente.");
    }
  }

  function scarica() {
    const blob = new Blob([mostrato], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "prompt.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function migliora() {
    setErrore(null);
    setCaricamento(true);
    try {
      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: generato }),
      });
      const dati = await res.json();
      if (!res.ok) {
        setErrore(dati.error ?? "Errore durante la richiesta.");
        return;
      }
      setMigliorato(dati.prompt);
      setVista("migliorato");
      if (dati.troncato) segnala("La risposta è stata troncata: prompt molto lungo.");
    } catch {
      setErrore("Impossibile contattare il server.");
    } finally {
      setCaricamento(false);
    }
  }

  function azzera() {
    setSpec(SPEC_VUOTA);
    setPreset(null);
    setMigliorato(null);
    setVista("generato");
    setErrore(null);
  }

  const vuoto = !generato.trim();

  return (
    <div className="wrap">
      <header className="top">
        <div className="brand">
          <div className="brand-mark">⚡</div>
          <div>
            <h1>PromptForge</h1>
            <p className="sub">
              Compila i campi, il prompt si costruisce mentre scrivi.
            </p>
          </div>
        </div>
        <div className="seg" role="group" aria-label="Modello di destinazione">
          {TARGET.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={spec.target === t.id}
              onClick={() => aggiorna("target", t.id)}
            >
              {t.nome}
            </button>
          ))}
        </div>
      </header>

      <div className="cols">
        {/* ---------------- colonna sinistra: il form ---------------- */}
        <div>
          <section className="card">
            <p className="card-title">Punto di partenza</p>
            <div className="chips">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="chip"
                  aria-pressed={preset === p.id}
                  onClick={() => applicaPreset(p.id)}
                  title={p.descrizione}
                >
                  {p.emoji} {p.nome}
                </button>
              ))}
            </div>
          </section>

          <section className="card">
            <p className="card-title">Il compito</p>

            <div className="field">
              <label htmlFor="obiettivo">
                Obiettivo<span className="hint">l&apos;unico campo indispensabile</span>
              </label>
              <textarea
                id="obiettivo"
                value={spec.obiettivo}
                onChange={(e) => aggiorna("obiettivo", e.target.value)}
                placeholder="Cosa deve produrre il modello, in una o due frasi."
              />
            </div>

            <div className="field">
              <label htmlFor="ruolo">
                Ruolo<span className="hint">chi deve essere il modello</span>
              </label>
              <input
                id="ruolo"
                type="text"
                value={spec.ruolo}
                onChange={(e) => aggiorna("ruolo", e.target.value)}
                placeholder="un editor che taglia senza pietà tutto ciò che non serve"
              />
            </div>

            <div className="field">
              <label htmlFor="contesto">Contesto</label>
              <textarea
                id="contesto"
                value={spec.contesto}
                onChange={(e) => aggiorna("contesto", e.target.value)}
                placeholder="Materiale, dati, vincoli di partenza, situazione."
              />
            </div>

            <div className="field">
              <label htmlFor="pubblico">Destinatari</label>
              <input
                id="pubblico"
                type="text"
                value={spec.pubblico}
                onChange={(e) => aggiorna("pubblico", e.target.value)}
                placeholder="Chi legge, e cosa sa già dell'argomento."
              />
            </div>
          </section>

          <section className="card">
            <p className="card-title">La forma</p>

            <div className="field">
              <label htmlFor="formato">Formato della risposta</label>
              <textarea
                id="formato"
                value={spec.formato}
                onChange={(e) => aggiorna("formato", e.target.value)}
                placeholder="Tabella markdown, JSON, elenco numerato, email…"
              />
            </div>

            <div className="row">
              <div className="field">
                <label htmlFor="tono">Tono</label>
                <input
                  id="tono"
                  type="text"
                  value={spec.tono}
                  onChange={(e) => aggiorna("tono", e.target.value)}
                  placeholder="Diretto, sobrio, ironico…"
                />
              </div>
              <div className="field">
                <label htmlFor="lunghezza">Lunghezza</label>
                <input
                  id="lunghezza"
                  type="text"
                  value={spec.lunghezza}
                  onChange={(e) => aggiorna("lunghezza", e.target.value)}
                  placeholder="300 parole, 5 punti…"
                />
              </div>
            </div>

            <div className="row">
              <div className="field">
                <label htmlFor="lingua">Lingua della risposta</label>
                <input
                  id="lingua"
                  type="text"
                  value={spec.lingua}
                  onChange={(e) => aggiorna("lingua", e.target.value)}
                  placeholder="Italiano"
                />
              </div>
              <div className="field">
                <label htmlFor="modalita">Struttura</label>
                <select
                  id="modalita"
                  value={spec.modalita}
                  onChange={(e) =>
                    aggiorna("modalita", e.target.value as PromptSpec["modalita"])
                  }
                >
                  <option value="strutturato">A sezioni (consigliato)</option>
                  <option value="discorsivo">Paragrafo unico (immagini, richieste brevi)</option>
                </select>
              </div>
            </div>
          </section>

          <section className="card">
            <p className="card-title">I paletti</p>

            <div className="field">
              <label htmlFor="vincoli">
                Vincoli<span className="hint">uno per riga — soprattutto cosa NON fare</span>
              </label>
              <textarea
                id="vincoli"
                value={spec.vincoli}
                onChange={(e) => aggiorna("vincoli", e.target.value)}
                placeholder={"Niente elenchi puntati\nNon citare la concorrenza"}
              />
            </div>

            <div className="field">
              <label htmlFor="esempi">
                Esempi<span className="hint">anche uno solo cambia molto</span>
              </label>
              <textarea
                id="esempi"
                value={spec.esempi}
                onChange={(e) => aggiorna("esempi", e.target.value)}
                placeholder="Input → output desiderato, oppure un estratto nello stile giusto."
              />
            </div>

            <div className="field">
              <label htmlFor="criteri">Criteri di successo</label>
              <textarea
                id="criteri"
                value={spec.criteri}
                onChange={(e) => aggiorna("criteri", e.target.value)}
                placeholder="Come si riconosce una risposta riuscita da una mediocre."
              />
            </div>

            <div className="checks">
              <label className="check">
                <input
                  type="checkbox"
                  checked={spec.ragionamento}
                  onChange={(e) => aggiorna("ragionamento", e.target.checked)}
                />
                <span>
                  Ragionamento passo passo
                  <small>Utile per problemi con più vincoli o calcoli.</small>
                </span>
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={spec.chiediChiarimenti}
                  onChange={(e) => aggiorna("chiediChiarimenti", e.target.checked)}
                />
                <span>
                  Chiedi chiarimenti prima di iniziare
                  <small>Evita che il modello colmi i vuoti a caso.</small>
                </span>
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={spec.soloFatti}
                  onChange={(e) => aggiorna("soloFatti", e.target.checked)}
                />
                <span>
                  Nessuna informazione inventata
                  <small>Deve dire quando un dato gli manca.</small>
                </span>
              </label>
            </div>
          </section>
        </div>

        {/* ---------------- colonna destra: il risultato ---------------- */}
        <div className="sticky">
          <section className="card">
            <p className="card-title">Prompt</p>

            {errore && <div className="alert err">{errore}</div>}
            {avviso && <div className="alert ok">{avviso}</div>}

            {migliorato && (
              <div className="actions">
                <div className="seg" role="group" aria-label="Versione del prompt">
                  <button
                    type="button"
                    aria-pressed={vista === "generato"}
                    onClick={() => setVista("generato")}
                  >
                    Generato
                  </button>
                  <button
                    type="button"
                    aria-pressed={vista === "migliorato"}
                    onClick={() => setVista("migliorato")}
                  >
                    Rifinito con AI
                  </button>
                </div>
              </div>
            )}

            <div className="actions">
              <button className="btn primary" onClick={copia} disabled={vuoto}>
                Copia
              </button>
              <button className="btn" onClick={scarica} disabled={vuoto}>
                Scarica .txt
              </button>
              <button
                className="btn"
                onClick={migliora}
                disabled={vuoto || caricamento || aiDisponibile === false}
                title={
                  aiDisponibile === false
                    ? "Richiede ANTHROPIC_API_KEY nelle variabili d'ambiente"
                    : "Fa riscrivere il prompt a Claude"
                }
              >
                {caricamento ? "Sto rifinendo…" : "Rifinisci con AI"}
              </button>
              <button className="btn" onClick={azzera}>
                Azzera
              </button>
            </div>

            {vuoto ? (
              <pre className="output vuoto">
                Scrivi l&apos;obiettivo: il prompt compare qui.
              </pre>
            ) : (
              <pre className="output">{mostrato}</pre>
            )}

            <div className="stats">
              <span>
                <b>{statistiche.parole}</b> parole
              </span>
              <span>
                <b>{statistiche.caratteri}</b> caratteri
              </span>
              <span>
                ~<b>{statistiche.token}</b> token
              </span>
              {aiDisponibile === false && <span>Rifinitura AI non configurata</span>}
            </div>
          </section>

          {consigli.length > 0 && (
            <section className="card">
              <p className="card-title">Cosa manca</p>
              <ul className="tips">
                {consigli.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      <footer>
        Tutto resta nel browser. La rifinitura con AI è l&apos;unica funzione che invia
        il prompt a un server.
      </footer>
    </div>
  );
}
