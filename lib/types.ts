export type Target = "claude" | "gpt" | "gemini" | "generico";
export type Modalita = "strutturato" | "discorsivo";

/** Una coppia input/output per il few-shot. */
export interface Esempio {
  id: string;
  input: string;
  output: string;
}

export interface PromptSpec {
  target: Target;
  modalita: Modalita;

  // Identità e mandato
  ruolo: string;
  competenze: string;
  obiettivo: string;
  contesto: string;
  pubblico: string;

  // Procedura
  passaggi: string;

  // Contratto di output
  formato: string;
  schema: string;
  tono: string;
  lingua: string;
  lunghezza: string;

  // Paletti
  vincoli: string;
  daEvitare: string;
  casiLimite: string;

  // Calibrazione
  esempi: Esempio[];
  criteri: string;

  // Tecniche
  ragionamento: boolean;
  autocritica: boolean;
  chiediChiarimenti: boolean;
  soloFatti: boolean;
  ammettiIncertezza: boolean;
  citaFonti: boolean;
  senzaPreamboli: boolean;
  delimitatori: boolean;
}

export const SPEC_VUOTA: PromptSpec = {
  target: "claude",
  modalita: "strutturato",
  ruolo: "",
  competenze: "",
  obiettivo: "",
  contesto: "",
  pubblico: "",
  passaggi: "",
  formato: "",
  schema: "",
  tono: "",
  lingua: "Italiano",
  lunghezza: "",
  vincoli: "",
  daEvitare: "",
  casiLimite: "",
  esempi: [],
  criteri: "",
  ragionamento: false,
  autocritica: false,
  chiediChiarimenti: false,
  soloFatti: false,
  ammettiIncertezza: false,
  citaFonti: false,
  senzaPreamboli: false,
  delimitatori: false,
};

export interface Preset {
  id: string;
  nome: string;
  emoji: string;
  descrizione: string;
  spec: Partial<PromptSpec>;
}

/** Una voce della libreria salvata in locale. */
export interface Salvato {
  id: string;
  nome: string;
  data: number;
  spec: PromptSpec;
}

export function nuovoId(): string {
  return Math.random().toString(36).slice(2, 10);
}
