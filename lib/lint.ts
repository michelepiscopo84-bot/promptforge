import type { PromptSpec } from "./types";

export type Gravita = "alta" | "media";

export interface Rilievo {
  id: string;
  campo: string;
  etichetta: string;
  trovato: string;
  problema: string;
  consiglio: string;
  gravita: Gravita;
}

interface Regola {
  id: string;
  rx: RegExp;
  problema: string;
  consiglio: string;
  gravita: Gravita;
  /** Campi in cui la regola non vale: lì quella parola è legittima. */
  esclusi?: string[];
  /** Se presente, la regola vale solo in questi campi. */
  soloIn?: string[];
}

const CAMPI: { campo: keyof PromptSpec; etichetta: string }[] = [
  { campo: "obiettivo", etichetta: "Obiettivo" },
  { campo: "ruolo", etichetta: "Ruolo" },
  { campo: "competenze", etichetta: "Competenze" },
  { campo: "contesto", etichetta: "Contesto" },
  { campo: "pubblico", etichetta: "Destinatari" },
  { campo: "passaggi", etichetta: "Passaggi" },
  { campo: "formato", etichetta: "Formato" },
  { campo: "tono", etichetta: "Tono" },
  { campo: "lunghezza", etichetta: "Lunghezza" },
  { campo: "vincoli", etichetta: "Vincoli" },
  { campo: "daEvitare", etichetta: "Da non fare" },
  { campo: "casiLimite", etichetta: "Casi limite" },
  { campo: "criteri", etichetta: "Criteri" },
];

const REGOLE: Regola[] = [
  {
    id: "vaghi",
    // Aggettivi che sembrano istruzioni ma non lo sono: ognuno vale tutto
    // e il contrario di tutto finché non lo traduci in qualcosa di osservabile.
    rx: /\b(chiaro|chiara|conciso|concisa|professionale|efficace|accattivante|coinvolgente|moderno|moderna|dettagliato|dettagliata|approfondito|approfondita|adeguato|adeguata|appropriato|appropriata|adatto|adatta|ottimizzato|ottimizzata|di qualità|user.?friendly|buono|buona|migliore|ottimo|ottima|eccellente|interessante)\b/gi,
    problema: "aggettivo valutativo senza un criterio verificabile",
    consiglio:
      "Traducilo in qualcosa di osservabile: invece di «conciso», scrivi «massimo 120 parole»; invece di «professionale», di' cosa lo rende tale.",
    gravita: "alta",
    // Nei divieti nominare il difetto è il punto: non è un rilievo.
    esclusi: ["daEvitare", "casiLimite"],
  },
  {
    id: "misura",
    rx: /\b(breve|lungo|lunga|corto|corta|sintetico|sintetica|esteso|estesa)\b/gi,
    problema: "lunghezza indicata a parole invece che con un numero",
    consiglio:
      "Il modello e tu non intendete la stessa cosa per «breve». Metti un numero: parole, righe, paragrafi o caratteri.",
    gravita: "alta",
    soloIn: ["lunghezza", "formato", "obiettivo"],
  },
  {
    id: "quantita",
    rx: /\b(alcuni|alcune|molti|molte|vari|varie|diversi|diverse|parecchi|qualche|un po'|abbastanza|numerosi)\b/gi,
    problema: "quantità indefinita",
    consiglio:
      "Sostituiscila con un numero o un intervallo: «3-5 esempi» invece di «alcuni esempi».",
    gravita: "media",
    esclusi: ["daEvitare"],
  },
  {
    id: "deboli",
    rx: /\b(dovresti|potresti|prova a|cerca di|magari|possibilmente|se possibile|idealmente|preferibilmente|tenta di)\b/gi,
    problema: "istruzione formulata come suggerimento",
    consiglio:
      "Un'istruzione facoltativa viene trattata come tale. Usa l'imperativo: «scrivi», non «cerca di scrivere».",
    gravita: "alta",
  },
  {
    id: "cortesia",
    rx: /\b(per favore|per piacere|ti prego|grazie|gentilmente|se non ti dispiace)\b/gi,
    problema: "formula di cortesia",
    consiglio:
      "Non migliora la risposta e consuma token. Il modello non si offende se la togli.",
    gravita: "media",
  },
  {
    id: "meta",
    rx: /\b(come sai|come ben sai|ovviamente|naturalmente|in quanto (?:modello|ai|intelligenza)|essendo un(?:'| )ai)\b/gi,
    problema: "riferimento superfluo al modello o al suo sapere",
    consiglio:
      "Non aggiunge informazione. Se il modello deve sapere qualcosa, scrivila nel contesto.",
    gravita: "media",
  },
  {
    id: "assoluti",
    rx: /\b(sempre|mai|tutti|tutte|ogni singolo|assolutamente|in nessun caso)\b/gi,
    problema: "assoluto che potrebbe entrare in conflitto con un altro vincolo",
    consiglio:
      "Verifica che regga anche nei casi limite: gli assoluti sono la prima cosa che si contraddice quando i vincoli crescono.",
    gravita: "media",
    soloIn: ["vincoli", "criteri"],
  },
];

/**
 * Analizza ciò che hai scritto tu, non il prompt generato: i difetti stanno
 * quasi sempre nei campi, non nell'impalcatura che ci costruisce attorno.
 */
export function revisiona(spec: PromptSpec): Rilievo[] {
  const out: Rilievo[] = [];
  const visti = new Set<string>();

  for (const { campo, etichetta } of CAMPI) {
    const testo = String(spec[campo] ?? "").trim();
    if (!testo) continue;

    for (const regola of REGOLE) {
      if (regola.esclusi?.includes(campo)) continue;
      if (regola.soloIn && !regola.soloIn.includes(campo)) continue;

      for (const m of testo.matchAll(regola.rx)) {
        const trovato = m[0];
        const chiave = `${campo}:${regola.id}:${trovato.toLowerCase()}`;
        if (visti.has(chiave)) continue;
        visti.add(chiave);
        out.push({
          id: chiave,
          campo,
          etichetta,
          trovato,
          problema: regola.problema,
          consiglio: regola.consiglio,
          gravita: regola.gravita,
        });
      }
    }
  }

  // Prima i rilievi che cambiano davvero la risposta.
  return out.sort((a, b) =>
    a.gravita === b.gravita ? 0 : a.gravita === "alta" ? -1 : 1,
  );
}
