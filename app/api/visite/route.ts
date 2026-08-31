import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHIAVE = "promptforge:visite";

/**
 * Il contatore vive su Redis (Upstash, gratuito dal Marketplace di Vercel).
 * I nomi delle variabili cambiano a seconda di come lo colleghi: li accetta
 * entrambi. Se non c'è nessun archivio, il contatore semplicemente non compare.
 */
const URL_KV = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const TOKEN_KV = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

async function comando(...parti: string[]): Promise<unknown> {
  const res = await fetch(URL_KV as string, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN_KV}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(parti),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Redis ${res.status}`);
  const dati = (await res.json()) as { result?: unknown };
  return dati.result;
}

const numero = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);

/**
 * Un'impronta breve di chi visita, per non contare venti volte chi ricarica.
 * L'indirizzo IP non viene mai memorizzato: solo questo hash, che scade in un
 * giorno e non permette di risalire alla persona.
 */
function impronta(req: Request): string {
  const ip = (req.headers.get("x-forwarded-for") ?? "ignoto").split(",")[0].trim();
  const agente = req.headers.get("user-agent") ?? "";
  const giorno = new Date().toISOString().slice(0, 10);
  return createHash("sha256").update(`${ip}|${agente}|${giorno}`).digest("hex").slice(0, 24);
}

/** Lettura sola: quante visite risultano finora. */
export async function GET() {
  if (!URL_KV || !TOKEN_KV) return NextResponse.json({ disponibile: false });
  try {
    return NextResponse.json({ disponibile: true, visite: numero(await comando("GET", CHIAVE)) });
  } catch {
    return NextResponse.json({ disponibile: false });
  }
}

/** Registra la visita, una sola volta al giorno per visitatore. */
export async function POST(req: Request) {
  if (!URL_KV || !TOKEN_KV) return NextResponse.json({ disponibile: false });

  try {
    const gia = await comando("SET", `promptforge:v:${impronta(req)}`, "1", "NX", "EX", "86400");
    // "OK" significa prima visita di oggi; null significa che l'abbiamo già contata.
    const visite = gia === "OK" ? await comando("INCR", CHIAVE) : await comando("GET", CHIAVE);
    return NextResponse.json({ disponibile: true, visite: numero(visite) });
  } catch {
    return NextResponse.json({ disponibile: false });
  }
}
