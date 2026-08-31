import type { PromptSpec } from "./types";

/** Trasforma un blocco multiriga in un elenco puntato markdown. */
function elenco(testo: string): string {
  return testo
    .split("\n")
    .map((r) => r.trim().replace(/^[-*•]\s*/, ""))
    .filter(Boolean)
    .map((r) => `- ${r}`)
    .join("\n");
}

function pulisci(testo: string): string {
  return testo.trim().replace(/\n{3,}/g, "\n\n");
}

interface Sezione {
  tag: string;
  titolo: string;
  corpo: string;
}

/**
 * Le istruzioni finali derivate dalle spunte: sono la parte che più spesso
 * viene dimenticata scrivendo un prompt a mano.
 */
function istruzioni(spec: PromptSpec): string[] {
  const out: string[] = [];
  if (spec.ragionamento) {
    out.push(
      "Ragiona passo dopo passo prima di rispondere: esponi il percorso logico, poi la conclusione.",
    );
  }
  if (spec.chiediChiarimenti) {
    out.push(
      "Se qualcosa di essenziale non è chiaro, fai le domande necessarie prima di iniziare, invece di dare per scontate le risposte.",
    );
  }
  if (spec.soloFatti) {
    out.push(
      "Usa solo le informazioni fornite o che puoi verificare. Se un dato ti manca, dillo esplicitamente invece di ipotizzarlo.",
    );
  }
  if (spec.lingua.trim()) {
    out.push(`Rispondi in ${spec.lingua.trim()}.`);
  }
  return out;
}

/** Prompt discorsivo: un blocco unico, per generatori di immagini o richieste brevi. */
function costruisciDiscorsivo(spec: PromptSpec): string {
  const parti = [
    spec.ruolo.trim() && `Agisci come ${spec.ruolo.trim()}.`,
    spec.obiettivo.trim(),
    spec.contesto.trim() && `Contesto: ${spec.contesto.trim()}.`,
    spec.pubblico.trim() && `Destinatari: ${spec.pubblico.trim()}.`,
    spec.tono.trim() && `Tono: ${spec.tono.trim()}.`,
    spec.formato.trim() && `Formato: ${spec.formato.trim()}.`,
    spec.lunghezza.trim() && `Lunghezza: ${spec.lunghezza.trim()}.`,
  ].filter(Boolean) as string[];

  const regole = [
    ...spec.vincoli
      .split("\n")
      .map((r) => r.trim().replace(/^[-*•]\s*/, ""))
      .filter(Boolean),
    ...istruzioni(spec),
  ];

  if (regole.length) parti.push(`Vincoli: ${regole.join("; ")}.`);
  if (spec.criteri.trim()) parti.push(`La risposta è buona se: ${spec.criteri.trim()}.`);

  return pulisci(parti.join(" "));
}

/** Prompt strutturato: sezioni esplicite, il formato che i modelli seguono meglio. */
function costruisciStrutturato(spec: PromptSpec): string {
  const sezioni: Sezione[] = [];
  const aggiungi = (tag: string, titolo: string, corpo: string) => {
    if (corpo.trim()) sezioni.push({ tag, titolo, corpo: corpo.trim() });
  };

  if (spec.ruolo.trim()) {
    aggiungi("ruolo", "Ruolo", `Sei ${spec.ruolo.trim()}.`);
  }
  aggiungi("obiettivo", "Obiettivo", spec.obiettivo);
  aggiungi("contesto", "Contesto", spec.contesto);
  aggiungi("destinatari", "Destinatari", spec.pubblico);

  const formato = [
    spec.formato.trim(),
    spec.lunghezza.trim() && `Lunghezza indicativa: ${spec.lunghezza.trim()}.`,
    spec.tono.trim() && `Tono: ${spec.tono.trim()}.`,
  ]
    .filter(Boolean)
    .join("\n");
  aggiungi("formato", "Formato della risposta", formato);

  const regole = [
    spec.vincoli.trim() && elenco(spec.vincoli),
    istruzioni(spec)
      .map((r) => `- ${r}`)
      .join("\n"),
  ]
    .filter(Boolean)
    .join("\n");
  aggiungi("vincoli", "Vincoli", regole);

  aggiungi("esempi", "Esempi", spec.esempi);
  aggiungi("criteri", "Criteri di successo", spec.criteri);

  // Claude segue meglio i tag XML; gli altri modelli i titoli markdown.
  if (spec.target === "claude") {
    return pulisci(
      sezioni.map((s) => `<${s.tag}>\n${s.corpo}\n</${s.tag}>`).join("\n\n"),
    );
  }

  return pulisci(sezioni.map((s) => `## ${s.titolo}\n${s.corpo}`).join("\n\n"));
}

export function costruisciPrompt(spec: PromptSpec): string {
  return spec.modalita === "discorsivo"
    ? costruisciDiscorsivo(spec)
    : costruisciStrutturato(spec);
}

/** Campi vuoti che indeboliscono davvero il prompt, per il pannello dei suggerimenti. */
export function suggerimenti(spec: PromptSpec): string[] {
  const s: string[] = [];
  if (!spec.obiettivo.trim()) s.push("Manca l'obiettivo: è l'unico campo davvero indispensabile.");
  if (!spec.ruolo.trim()) s.push("Senza un ruolo la risposta resta generica.");
  if (!spec.formato.trim()) s.push("Senza formato il modello sceglie da solo, e spesso sbaglia.");
  if (!spec.pubblico.trim()) s.push("Indicare i destinatari cambia registro e livello di dettaglio.");
  if (!spec.vincoli.trim()) s.push("I vincoli servono soprattutto a dire cosa NON fare.");
  if (!spec.criteri.trim()) s.push("Un criterio di successo dà al modello un modo per autovalutarsi.");
  if (!spec.esempi.trim() && spec.modalita === "strutturato")
    s.push("Anche un solo esempio migliora la resa più di dieci righe di istruzioni.");
  return s;
}

export function conta(prompt: string) {
  const parole = prompt.trim() ? prompt.trim().split(/\s+/).length : 0;
  return {
    caratteri: prompt.length,
    parole,
    token: Math.ceil(prompt.length / 3.6), // stima grossolana
  };
}
