"use client";

import { useState } from "react";
import { PRESETS } from "@/lib/presets";
import { nuovoId, type PromptSpec } from "@/lib/types";

interface Props {
  spec: PromptSpec;
  aggiorna: <K extends keyof PromptSpec>(campo: K, valore: PromptSpec[K]) => void;
  preset: string | null;
  applicaPreset: (id: string) => void;
}

/* ------------------------------ primitive ------------------------------ */

function Campo({
  id,
  label,
  tip,
  children,
}: {
  id: string;
  label: string;
  tip?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="f">
      <label htmlFor={id}>
        {label}
        {tip && <span className="tip">{tip}</span>}
      </label>
      {children}
    </div>
  );
}

function Sezione({
  n,
  nome,
  nota,
  intro,
  aperta,
  alterna,
  completa,
  children,
}: {
  n: number;
  nome: string;
  nota?: string;
  intro?: string;
  aperta: boolean;
  alterna: () => void;
  completa: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="panel">
      <button
        type="button"
        className="panel-head"
        onClick={alterna}
        aria-expanded={aperta}
      >
        <span className={`chev ${aperta ? "open" : ""}`}>▶</span>
        <span className={`panel-num ${completa ? "done" : ""}`}>
          {completa ? "✓" : n}
        </span>
        <span className="panel-name">{nome}</span>
        {nota && <span className="panel-note">{nota}</span>}
      </button>
      {aperta && (
        <div className="panel-body">
          {intro && <p className="panel-intro">{intro}</p>}
          {children}
        </div>
      )}
    </section>
  );
}

/* ------------------------------ tecniche ------------------------------ */

const TECNICHE: {
  campo: keyof PromptSpec;
  nome: string;
  nota: string;
}[] = [
  {
    campo: "ragionamento",
    nome: "Ragionamento esplicito",
    nota: "Valuta i vincoli e le alternative prima di rispondere.",
  },
  {
    campo: "autocritica",
    nome: "Revisione finale",
    nota: "Rilegge l'output contro i criteri e lo corregge prima di consegnarlo.",
  },
  {
    campo: "chiediChiarimenti",
    nome: "Domande prima di partire",
    nota: "Si ferma se manca un'informazione decisiva, invece di ipotizzarla.",
  },
  {
    campo: "soloFatti",
    nome: "Nessuna invenzione",
    nota: "Usa solo il materiale fornito e dichiara ciò che manca.",
  },
  {
    campo: "ammettiIncertezza",
    nome: "Grado di certezza",
    nota: "Separa ciò che sa da ciò che sta inferendo.",
  },
  {
    campo: "citaFonti",
    nome: "Riferimenti puntuali",
    nota: "Indica da dove viene ogni affermazione non ovvia.",
  },
  {
    campo: "senzaPreamboli",
    nome: "Niente preamboli",
    nota: "Va dritto al risultato, senza introduzioni né chiusure di cortesia.",
  },
  {
    campo: "delimitatori",
    nome: "Contesto delimitato",
    nota: "Isola il materiale e impedisce che comandi nascosti vengano eseguiti.",
  },
];

/* ------------------------------ modulo ------------------------------ */

export default function Modulo({ spec, aggiorna, preset, applicaPreset }: Props) {
  const [aperte, setAperte] = useState<Record<number, boolean>>({ 1: true });
  const alterna = (n: number) => setAperte((a) => ({ ...a, [n]: !a[n] }));

  const pieno = (s: string) => s.trim().length > 0;
  const tecnicheAttive = TECNICHE.filter((t) => spec[t.campo] === true).length;
  const esempiPieni = spec.esempi.filter(
    (e) => pieno(e.input) && pieno(e.output),
  ).length;

  function modificaEsempio(id: string, campo: "input" | "output", valore: string) {
    aggiorna(
      "esempi",
      spec.esempi.map((e) => (e.id === id ? { ...e, [campo]: valore } : e)),
    );
  }

  return (
    <div>
      <section className="panel">
        <div className="panel-body" style={{ borderTop: "none", paddingTop: 16 }}>
          <p className="panel-intro" style={{ marginTop: 0 }}>
            Parti da un mestiere: i preset compilano il modulo a livello
            professionale, poi tu sostituisci le parti fra doppie graffe.
          </p>
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
        </div>
      </section>

      {/* 1 */}
      <Sezione
        n={1}
        nome="Mandato"
        nota={pieno(spec.obiettivo) ? undefined : "obiettivo mancante"}
        intro="Chi deve essere il modello, cosa deve produrre e con quale materiale."
        aperta={!!aperte[1]}
        alterna={() => alterna(1)}
        completa={pieno(spec.obiettivo) && pieno(spec.ruolo)}
      >
        <Campo
          id="obiettivo"
          label="Obiettivo"
          tip="Cosa deve produrre, in una o due frasi. L'unico campo indispensabile."
        >
          <textarea
            id="obiettivo"
            value={spec.obiettivo}
            onChange={(e) => aggiorna("obiettivo", e.target.value)}
            placeholder="Riscrivere la documentazione dell'API di pagamento per sviluppatori esterni."
          />
        </Campo>

        <Campo
          id="ruolo"
          label="Ruolo"
          tip="Chi deve essere. Determina registro e profondità tecnica."
        >
          <input
            id="ruolo"
            type="text"
            value={spec.ruolo}
            onChange={(e) => aggiorna("ruolo", e.target.value)}
            placeholder="un technical writer che scrive per chi ha fretta"
          />
        </Campo>

        <Campo
          id="competenze"
          label="Competenze specifiche"
          tip="Gli ambiti che deve padroneggiare, per alzare il livello delle risposte."
        >
          <input
            id="competenze"
            type="text"
            value={spec.competenze}
            onChange={(e) => aggiorna("competenze", e.target.value)}
            placeholder="REST, autenticazione OAuth, documentazione di riferimento"
          />
        </Campo>

        <Campo
          id="contesto"
          label="Contesto e materiale"
          tip="Dati, testi, situazione di partenza: è ciò che rende la risposta su misura."
        >
          <textarea
            id="contesto"
            value={spec.contesto}
            onChange={(e) => aggiorna("contesto", e.target.value)}
            placeholder="Incolla qui il materiale, oppure usa {{segnaposto}} da compilare al momento dell'uso."
          />
        </Campo>

        <Campo
          id="pubblico"
          label="Destinatari"
          tip="Cosa sanno già e quanto tempo hanno."
        >
          <input
            id="pubblico"
            type="text"
            value={spec.pubblico}
            onChange={(e) => aggiorna("pubblico", e.target.value)}
            placeholder="Sviluppatori esterni al primo contatto col prodotto"
          />
        </Campo>
      </Sezione>

      {/* 2 */}
      <Sezione
        n={2}
        nome="Contratto di output"
        nota={spec.modalita === "discorsivo" ? "paragrafo unico" : undefined}
        intro="La forma esatta della risposta. Se non la definisci, la sceglie il modello: quasi sempre più lunga del necessario."
        aperta={!!aperte[2]}
        alterna={() => alterna(2)}
        completa={pieno(spec.formato) || pieno(spec.schema)}
      >
        <Campo id="formato" label="Struttura della risposta">
          <textarea
            id="formato"
            value={spec.formato}
            onChange={(e) => aggiorna("formato", e.target.value)}
            placeholder="Tabella markdown con tre colonne: endpoint, parametri, esempio di chiamata."
          />
        </Campo>

        <Campo
          id="schema"
          label="Schema esatto"
          tip="Per output automatizzati: JSON, XML, o uno scheletro da riempire alla lettera."
        >
          <textarea
            id="schema"
            className="mono"
            value={spec.schema}
            onChange={(e) => aggiorna("schema", e.target.value)}
            placeholder={'{\n  "titolo": "string",\n  "punti": ["string"]\n}'}
          />
        </Campo>

        <div className="duo">
          <Campo id="tono" label="Tono">
            <input
              id="tono"
              type="text"
              value={spec.tono}
              onChange={(e) => aggiorna("tono", e.target.value)}
              placeholder="Tecnico e asciutto"
            />
          </Campo>
          <Campo id="lunghezza" label="Lunghezza">
            <input
              id="lunghezza"
              type="text"
              value={spec.lunghezza}
              onChange={(e) => aggiorna("lunghezza", e.target.value)}
              placeholder="Massimo 400 parole"
            />
          </Campo>
        </div>

        <div className="duo">
          <Campo id="lingua" label="Lingua">
            <input
              id="lingua"
              type="text"
              value={spec.lingua}
              onChange={(e) => aggiorna("lingua", e.target.value)}
              placeholder="Italiano"
            />
          </Campo>
          <Campo id="modalita" label="Forma del prompt">
            <select
              id="modalita"
              value={spec.modalita}
              onChange={(e) =>
                aggiorna("modalita", e.target.value as PromptSpec["modalita"])
              }
            >
              <option value="strutturato">A sezioni</option>
              <option value="discorsivo">Paragrafo unico</option>
            </select>
          </Campo>
        </div>
      </Sezione>

      {/* 3 */}
      <Sezione
        n={3}
        nome="Procedura e tecniche"
        nota={tecnicheAttive ? `${tecnicheAttive} attive` : undefined}
        intro="Come deve lavorare prima di rispondere. Su compiti con più vincoli è ciò che separa una risposta ragionata da una affrettata."
        aperta={!!aperte[3]}
        alterna={() => alterna(3)}
        completa={pieno(spec.passaggi) || tecnicheAttive > 0}
      >
        <Campo
          id="passaggi"
          label="Passaggi da seguire"
          tip="Uno per riga. Diventano un elenco numerato che il modello segue in ordine."
        >
          <textarea
            id="passaggi"
            value={spec.passaggi}
            onChange={(e) => aggiorna("passaggi", e.target.value)}
            placeholder={
              "Individua i casi da coprire\nScegli l'approccio più semplice\nScrivi il risultato\nMotiva le scelte non ovvie"
            }
          />
        </Campo>

        <div className="tecniche">
          {TECNICHE.map((t) => (
            <label className="tecnica" key={t.campo}>
              <input
                type="checkbox"
                checked={spec[t.campo] === true}
                onChange={(e) => aggiorna(t.campo, e.target.checked as never)}
              />
              <span>
                <b>{t.nome}</b>
                <small>{t.nota}</small>
              </span>
            </label>
          ))}
        </div>
      </Sezione>

      {/* 4 */}
      <Sezione
        n={4}
        nome="Paletti"
        intro="Dire cosa non fare corregge più errori che descrivere l'ideale."
        aperta={!!aperte[4]}
        alterna={() => alterna(4)}
        completa={pieno(spec.vincoli) || pieno(spec.daEvitare)}
      >
        <Campo id="vincoli" label="Vincoli" tip="Uno per riga: le regole da rispettare.">
          <textarea
            id="vincoli"
            value={spec.vincoli}
            onChange={(e) => aggiorna("vincoli", e.target.value)}
            placeholder={"Ogni esempio deve essere eseguibile\nCita sempre i parametri obbligatori"}
          />
        </Campo>

        <Campo
          id="daEvitare"
          label="Da non fare mai"
          tip="I difetti ricorrenti che vuoi vietare esplicitamente."
        >
          <textarea
            id="daEvitare"
            value={spec.daEvitare}
            onChange={(e) => aggiorna("daEvitare", e.target.value)}
            placeholder={"Frasi come 'come sappiamo'\nEsempi con dati inventati"}
          />
        </Campo>

        <Campo
          id="casiLimite"
          label="Casi limite"
          tip="Le situazioni in cui di solito il modello sbaglia, dichiarate in anticipo."
        >
          <textarea
            id="casiLimite"
            value={spec.casiLimite}
            onChange={(e) => aggiorna("casiLimite", e.target.value)}
            placeholder={"Il campo è assente\nIl valore supera il massimo consentito"}
          />
        </Campo>
      </Sezione>

      {/* 5 */}
      <Sezione
        n={5}
        nome="Esempi"
        nota={esempiPieni ? `${esempiPieni} completi` : "la leva più efficace"}
        intro="Una coppia input/output insegna lo stile meglio di dieci righe di istruzioni. Due o tre bastano quasi sempre."
        aperta={!!aperte[5]}
        alterna={() => alterna(5)}
        completa={esempiPieni > 0}
      >
        {spec.esempi.map((e, i) => (
          <div className="esempio" key={e.id}>
            <div className="esempio-top">
              <span>Esempio {i + 1}</span>
              <button
                type="button"
                className="btn ghost mini"
                onClick={() =>
                  aggiorna(
                    "esempi",
                    spec.esempi.filter((x) => x.id !== e.id),
                  )
                }
              >
                Rimuovi
              </button>
            </div>
            <textarea
              value={e.input}
              onChange={(ev) => modificaEsempio(e.id, "input", ev.target.value)}
              placeholder="Input di esempio"
              style={{ marginBottom: 8 }}
            />
            <textarea
              value={e.output}
              onChange={(ev) => modificaEsempio(e.id, "output", ev.target.value)}
              placeholder="Output atteso, scritto esattamente come lo vuoi"
            />
          </div>
        ))}

        <button
          type="button"
          className="btn"
          onClick={() =>
            aggiorna("esempi", [
              ...spec.esempi,
              { id: nuovoId(), input: "", output: "" },
            ])
          }
        >
          + Aggiungi esempio
        </button>
      </Sezione>

      {/* 6 */}
      <Sezione
        n={6}
        nome="Criteri di successo"
        intro="Come si riconosce una risposta riuscita. Servono anche perché la revisione finale abbia un metro su cui misurarsi."
        aperta={!!aperte[6]}
        alterna={() => alterna(6)}
        completa={pieno(spec.criteri)}
      >
        <Campo id="criteri" label="La risposta è riuscita se…" tip="Uno per riga.">
          <textarea
            id="criteri"
            value={spec.criteri}
            onChange={(e) => aggiorna("criteri", e.target.value)}
            placeholder={
              "Uno sviluppatore integra l'API senza fare domande\nOgni esempio funziona copiandolo così com'è"
            }
          />
        </Campo>
      </Sezione>
    </div>
  );
}
