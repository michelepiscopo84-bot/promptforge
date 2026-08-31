export type Target = "claude" | "gpt" | "gemini" | "generico";
export type Modalita = "strutturato" | "discorsivo";

export interface PromptSpec {
  target: Target;
  modalita: Modalita;
  ruolo: string;
  obiettivo: string;
  contesto: string;
  pubblico: string;
  formato: string;
  tono: string;
  lingua: string;
  lunghezza: string;
  vincoli: string;
  esempi: string;
  criteri: string;
  ragionamento: boolean;
  chiediChiarimenti: boolean;
  soloFatti: boolean;
}

export const SPEC_VUOTA: PromptSpec = {
  target: "claude",
  modalita: "strutturato",
  ruolo: "",
  obiettivo: "",
  contesto: "",
  pubblico: "",
  formato: "",
  tono: "",
  lingua: "Italiano",
  lunghezza: "",
  vincoli: "",
  esempi: "",
  criteri: "",
  ragionamento: false,
  chiediChiarimenti: false,
  soloFatti: false,
};

export interface Preset {
  id: string;
  nome: string;
  emoji: string;
  descrizione: string;
  spec: Partial<PromptSpec>;
}
