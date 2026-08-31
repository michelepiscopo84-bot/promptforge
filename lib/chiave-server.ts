import "server-only";
import { chiavePlausibile, INTESTAZIONE_CHIAVE } from "./chiave";

/**
 * La chiave del visitatore ha la precedenza su quella del server: viaggia solo
 * dentro la singola richiesta e non viene mai scritta su disco né nei log.
 * Se manca, si ripiega sulla chiave dell'ambiente, quando configurata.
 */
export function chiaveDi(req: Request): string | null {
  const propria = req.headers.get(INTESTAZIONE_CHIAVE)?.trim();
  if (propria) return chiavePlausibile(propria) ? propria : null;
  return process.env.ANTHROPIC_API_KEY ?? null;
}
