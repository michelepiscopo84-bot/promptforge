/**
 * Nome dell'intestazione con cui il browser passa la chiave del visitatore.
 * Sta in un file suo perche' lo usano sia il client sia le route: nessun
 * accesso alle variabili d'ambiente qui dentro.
 */
export const INTESTAZIONE_CHIAVE = "x-chiave-anthropic";

/** Controllo di forma, non di validita': quella la stabilisce Anthropic. */
export function chiavePlausibile(chiave: string): boolean {
  const c = chiave.trim();
  return c.startsWith("sk-ant-") && c.length >= 40 && c.length <= 300;
}
