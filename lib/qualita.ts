import type { PromptSpec } from "./types";

export interface Voce {
  id: string;
  etichetta: string;
  peso: number;
  ok: boolean;
  consiglio: string;
}

export interface Diagnosi {
  punteggio: number;
  livello: string;
  voci: Voce[];
}

const pieno = (s: string) => s.trim().length > 0;

/**
 * I pesi non sono arbitrari: riflettono quanto ogni elemento sposta davvero
 * la qualità della risposta. Gli esempi pesano quanto il formato perché in
 * pratica valgono più di dieci righe di istruzioni.
 */
export function diagnostica(spec: PromptSpec): Diagnosi {
  const voci: Voce[] = [
    {
      id: "obiettivo",
      etichetta: "Obiettivo dichiarato",
      peso: 18,
      ok: pieno(spec.obiettivo),
      consiglio:
        "Senza un obiettivo esplicito il modello indovina cosa vuoi. È l'unico campo davvero obbligatorio.",
    },
    {
      id: "formato",
      etichetta: "Contratto di output",
      peso: 14,
      ok: pieno(spec.formato) || pieno(spec.schema),
      consiglio:
        "Definisci la forma della risposta, o la sceglierà il modello: quasi sempre più prolissa di quanto ti serve.",
    },
    {
      id: "esempi",
      etichetta: "Esempi (few-shot)",
      peso: 14,
      ok: spec.esempi.some((e) => pieno(e.input) && pieno(e.output)),
      consiglio:
        "Una sola coppia input/output insegna lo stile meglio di un paragrafo di descrizioni.",
    },
    {
      id: "ruolo",
      etichetta: "Ruolo e competenze",
      peso: 11,
      ok: pieno(spec.ruolo),
      consiglio:
        "Il ruolo determina il registro e la profondità tecnica. Senza, ottieni la risposta media di internet.",
    },
    {
      id: "criteri",
      etichetta: "Criteri di successo",
      peso: 10,
      ok: pieno(spec.criteri),
      consiglio:
        "Dicono al modello come autovalutarsi. Sono la premessa perché l'autocritica funzioni.",
    },
    {
      id: "contesto",
      etichetta: "Contesto fornito",
      peso: 9,
      ok: pieno(spec.contesto),
      consiglio:
        "Materiale, dati, situazione di partenza: è ciò che distingue una risposta su misura da una generica.",
    },
    {
      id: "vincoli",
      etichetta: "Vincoli e divieti",
      peso: 9,
      ok: pieno(spec.vincoli) || pieno(spec.daEvitare),
      consiglio:
        "Dire cosa NON fare corregge più errori che descrivere l'ideale. Elenca i difetti che vuoi evitare.",
    },
    {
      id: "procedura",
      etichetta: "Procedura o ragionamento",
      peso: 8,
      ok: pieno(spec.passaggi) || spec.ragionamento,
      consiglio:
        "Su compiti con più vincoli, imporre dei passaggi riduce le risposte affrettate.",
    },
    {
      id: "pubblico",
      etichetta: "Destinatari",
      peso: 4,
      ok: pieno(spec.pubblico),
      consiglio: "Chi legge determina quanto va spiegato e quanto si può dare per scontato.",
    },
    {
      id: "rigore",
      etichetta: "Difese anti-invenzione",
      peso: 3,
      ok: spec.soloFatti || spec.ammettiIncertezza || spec.citaFonti,
      consiglio:
        "Se il compito tocca fatti verificabili, imponi al modello di dichiarare ciò che non sa.",
    },
  ];

  const punteggio = voci.reduce((t, v) => t + (v.ok ? v.peso : 0), 0);

  const livello =
    punteggio >= 85
      ? "Professionale"
      : punteggio >= 65
        ? "Solido"
        : punteggio >= 40
          ? "Utilizzabile"
          : "Abbozzato";

  return { punteggio, livello, voci };
}
