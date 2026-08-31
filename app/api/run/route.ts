import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { chiaveDi } from "@/lib/chiave-server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-opus-5";
const LIMITE = 24000;

/**
 * Banco di prova: esegue il prompt così com'è e restituisce la risposta.
 * Serve a vedere cosa produce davvero, non cosa speri che produca.
 */
export async function POST(req: Request) {
  const chiave = chiaveDi(req);
  if (!chiave) {
    return NextResponse.json(
      {
        error:
          "Serve una chiave API. Aprine una dal pulsante Chiave in alto: resta salvata solo nel tuo browser.",
      },
      { status: 501 },
    );
  }

  let system: unknown;
  let user: unknown;
  try {
    ({ system, user } = await req.json());
  } catch {
    return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 });
  }

  if (typeof user !== "string" || !user.trim()) {
    return NextResponse.json(
      { error: "Manca la richiesta da eseguire: compila almeno l'obiettivo." },
      { status: 400 },
    );
  }

  const sistema = typeof system === "string" ? system : "";
  if (user.length + sistema.length > LIMITE) {
    return NextResponse.json(
      { error: `Il prompt supera i ${LIMITE} caratteri.` },
      { status: 413 },
    );
  }

  const client = new Anthropic({ apiKey: chiave });

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      output_config: { effort: "medium" },
      ...(sistema.trim() ? { system: sistema } : {}),
      messages: [{ role: "user", content: user }],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json(
        { error: "Il modello ha rifiutato di eseguire questo prompt." },
        { status: 422 },
      );
    }

    const testo = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    return NextResponse.json({
      risposta: testo || "(risposta vuota)",
      troncata: response.stop_reason === "max_tokens",
      uso: {
        ingresso: response.usage.input_tokens,
        uscita: response.usage.output_tokens,
      },
    });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: "Chiave API rifiutata da Anthropic: controlla di averla copiata per intero." },
        { status: 401 },
      );
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "Troppe richieste: riprova fra qualche secondo." },
        { status: 429 },
      );
    }
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `Errore API (${error.status}): ${error.message}` },
        { status: 502 },
      );
    }
    console.error("[run]", error);
    return NextResponse.json({ error: "Errore imprevisto." }, { status: 500 });
  }
}
