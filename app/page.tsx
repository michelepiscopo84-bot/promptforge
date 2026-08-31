"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Modulo from "@/components/Modulo";
import Risultato, { Anello } from "@/components/Risultato";
import { applicaVariabili, costruisciPrompt, variabili } from "@/lib/builder";
import { PRESETS } from "@/lib/presets";
import { diagnostica } from "@/lib/qualita";
import { nuovoId, SPEC_VUOTA, type PromptSpec, type Salvato, type Target } from "@/lib/types";

const K_SPEC = "promptforge:spec";
const K_LIB = "promptforge:libreria";

const TARGET: { id: Target; nome: string }[] = [
  { id: "claude", nome: "Claude" },
  { id: "gpt", nome: "GPT" },
  { id: "gemini", nome: "Gemini" },
  { id: "generico", nome: "Generico" },
];

export default function Home() {
  const [spec, setSpec] = useState<PromptSpec>(SPEC_VUOTA);
  const [preset, setPreset] = useState<string | null>(null);
  const [rifinito, setRifinito] = useState<string | null>(null);
  const [vista, setVista] = useState<"generato" | "rifinito">("generato");
  const [valori, setValori] = useState<Record<string, string>>({});
  const [salvati, setSalvati] = useState<Salvato[]>([]);
  const [caricamento, setCaricamento] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [avviso, setAvviso] = useState<string | null>(null);
  const [aiDisponibile, setAiDisponibile] = useState<boolean | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Ripristino della sessione e verifica della chiave API lato server. */
  useEffect(() => {
    try {
      const s = localStorage.getItem(K_SPEC);
      if (s) setSpec({ ...SPEC_VUOTA, ...JSON.parse(s) });
      const l = localStorage.getItem(K_LIB);
      if (l) setSalvati(JSON.parse(l));
    } catch {
      /* archivio non disponibile: si parte puliti */
    }
    fetch("/api/enhance")
      .then((r) => r.json())
      .then((d) => setAiDisponibile(Boolean(d.disponibile)))
      .catch(() => setAiDisponibile(false));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(K_SPEC, JSON.stringify(spec));
    } catch {
      /* ignora */
    }
  }, [spec]);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const generato = useMemo(() => costruisciPrompt(spec), [spec]);
  const diagnosi = useMemo(() => diagnostica(spec), [spec]);
  const base = vista === "rifinito" && rifinito ? rifinito : generato;
  const nomiVariabili = useMemo(() => variabili(base), [base]);
  const prompt = useMemo(() => applicaVariabili(base, valori), [base, valori]);

  function segnala(msg: string) {
    setAvviso(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAvviso(null), 2600);
  }

  function aggiorna<K extends keyof PromptSpec>(campo: K, valore: PromptSpec[K]) {
    setSpec((s) => ({ ...s, [campo]: valore }));
    // La versione rifinita si riferisce al prompt precedente: non vale più.
    setRifinito(null);
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
    setValori({});
    setRifinito(null);
    setVista("generato");
  }

  /* ----------------------------- libreria ----------------------------- */

  function scriviLibreria(nuova: Salvato[]) {
    setSalvati(nuova);
    try {
      localStorage.setItem(K_LIB, JSON.stringify(nuova));
    } catch {
      setErrore("Non riesco a scrivere nell'archivio del browser.");
    }
  }

  function salva() {
    const proposto =
      spec.obiettivo.trim().split("\n")[0].slice(0, 48) || "Prompt senza titolo";
    const nome = window.prompt("Nome del prompt", proposto);
    if (!nome) return;
    scriviLibreria([
      { id: nuovoId(), nome: nome.trim(), data: Date.now(), spec },
      ...salvati,
    ]);
    segnala("Salvato nella libreria.");
  }

  function carica(id: string) {
    const v = salvati.find((x) => x.id === id);
    if (!v) return;
    setSpec({ ...SPEC_VUOTA, ...v.spec });
    setPreset(null);
    setRifinito(null);
    setVista("generato");
    setValori({});
    segnala(`Aperto: ${v.nome}`);
  }

  function elimina(id: string) {
    scriviLibreria(salvati.filter((x) => x.id !== id));
  }

  /* ----------------------------- azioni ----------------------------- */

  async function copia() {
    try {
      await navigator.clipboard.writeText(prompt);
      segnala("Prompt copiato negli appunti.");
    } catch {
      setErrore("Il browser ha bloccato la copia: seleziona il testo a mano.");
    }
  }

  function scarica() {
    const blob = new Blob([prompt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "prompt.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function rifinisci() {
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
      setRifinito(dati.prompt);
      setVista("rifinito");
      if (dati.troncato) segnala("Risposta troncata: il prompt è molto lungo.");
    } catch {
      setErrore("Impossibile contattare il server.");
    } finally {
      setCaricamento(false);
    }
  }

  function azzera() {
    setSpec(SPEC_VUOTA);
    setPreset(null);
    setRifinito(null);
    setVista("generato");
    setValori({});
    setErrore(null);
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="mark">
          <div className="mark-badge">⚡</div>
          <div>
            <h1>PromptForge</h1>
            <p>Prompt engineering strutturato</p>
          </div>
        </div>

        <div className="seg" role="group" aria-label="Modello di destinazione">
          {TARGET.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={spec.target === t.id}
              onClick={() => aggiorna("target", t.id)}
              title={
                t.id === "claude"
                  ? "Sezioni con tag XML: la convenzione che Claude segue meglio"
                  : "Sezioni in markdown"
              }
            >
              {t.nome}
            </button>
          ))}
        </div>

        <div className="score">
          <Anello valore={diagnosi.punteggio} />
          <span className="score-txt">
            <b>{diagnosi.punteggio}/100</b>
            <small>{diagnosi.livello}</small>
          </span>
        </div>
      </header>

      <div className="grid">
        <Modulo
          spec={spec}
          aggiorna={aggiorna}
          preset={preset}
          applicaPreset={applicaPreset}
        />

        <Risultato
          prompt={prompt}
          rifinito={rifinito}
          vista={vista}
          setVista={setVista}
          diagnosi={diagnosi}
          variabili={nomiVariabili}
          valori={valori}
          setValore={(n, v) => setValori((x) => ({ ...x, [n]: v }))}
          salvati={salvati}
          salva={salva}
          carica={carica}
          elimina={elimina}
          copia={copia}
          scarica={scarica}
          rifinisci={rifinisci}
          azzera={azzera}
          caricamento={caricamento}
          aiDisponibile={aiDisponibile}
          errore={errore}
          avviso={avviso}
        />
      </div>

      <footer className="piede">
        <span>
          Modulo e libreria restano nel tuo browser. Solo la rifinitura con AI invia
          il prompt a un server.
        </span>
        <span>
          {spec.target === "claude" ? "Formato XML" : "Formato markdown"} ·{" "}
          {spec.modalita === "discorsivo" ? "paragrafo unico" : "a sezioni"}
        </span>
      </footer>
    </div>
  );
}
