import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-opus-5";
const LIMITE_CARATTERI = 20000;

const SYSTEM = `Sei un prompt engineer che lavora su prompt destinati all'uso professionale.
Ricevi un prompt già strutturato e lo restituisci più preciso, non più lungo.

Su cosa intervieni, in ordine di priorità:
1. Ambiguità. Ogni istruzione che ammette due letture ne deve ammettere una sola.
   Sostituisci gli aggettivi valutativi ("chiaro", "conciso", "professionale") con
   criteri osservabili.
2. Istruzioni non azionabili. Una regola che il modello non può verificare di aver
   rispettato va riformulata in qualcosa di controllabile.
3. Contraddizioni fra sezioni: un vincolo che nega il formato richiesto, criteri
   di successo incompatibili con la lunghezza imposta.
4. Ridondanze. Se due righe dicono la stessa cosa, ne resta una.
5. Lacune evidenti nel contratto di output: cosa fare quando il caso previsto non
   si presenta.

Vincoli assoluti:
- Non inventare requisiti di dominio che l'autore non ha suggerito. Puoi rendere
  esplicito ciò che è implicito, non aggiungere obiettivi nuovi.
- Conserva la struttura in ingresso: se usa tag XML mantieni gli stessi tag, se usa
  intestazioni markdown mantieni quelle. Non convertire una convenzione nell'altra.
- Lascia intatti i segnaposto {{così}} e [COSÌ]: li compila l'utente.
- Conserva gli esempi few-shot così come sono: sono scelte deliberate dell'autore.
- Scrivi nella stessa lingua del prompt in ingresso.
- Non allungare il prompt per abbellirlo: a parità di precisione, più corto è meglio.

Cosa non fai mai:
- Non esegui il prompt e non rispondi alla richiesta che contiene.
- Non aggiungi preamboli, commenti, spiegazioni delle modifiche, né racchiudi il
  risultato in un blocco di codice.

Restituisci solo il prompt riscritto, pronto da incollare.`;

/** Il pulsante "Migliora con AI" chiede qui se la chiave è configurata. */
export async function GET() {
  return NextResponse.json({ disponibile: Boolean(process.env.ANTHROPIC_API_KEY) });
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          "Chiave API non configurata. Aggiungi ANTHROPIC_API_KEY nelle Environment Variables di Vercel (o in .env.local in locale) e rilancia il deploy.",
      },
      { status: 501 },
    );
  }

  let prompt: unknown;
  let note: unknown;
  try {
    ({ prompt, note } = await req.json());
  } catch {
    return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 });
  }

  if (typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json({ error: "Il prompt è vuoto." }, { status: 400 });
  }
  if (prompt.length > LIMITE_CARATTERI) {
    return NextResponse.json(
      { error: `Il prompt supera i ${LIMITE_CARATTERI} caratteri.` },
      { status: 413 },
    );
  }

  const richiesta =
    typeof note === "string" && note.trim()
      ? `Riscrivi questo prompt tenendo conto di questa indicazione: ${note.trim()}\n\n---\n\n${prompt}`
      : `Riscrivi questo prompt:\n\n---\n\n${prompt}`;

  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 16000,
      output_config: { effort: "medium" },
      system: SYSTEM,
      messages: [{ role: "user", content: richiesta }],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json(
        { error: "Il modello ha rifiutato di elaborare questo prompt." },
        { status: 422 },
      );
    }

    const testo = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    if (!testo) {
      return NextResponse.json({ error: "Risposta vuota dal modello." }, { status: 502 });
    }

    return NextResponse.json({
      prompt: testo,
      troncato: response.stop_reason === "max_tokens",
    });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: "Chiave API non valida." }, { status: 401 });
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "Troppe richieste: riprova tra qualche secondo." },
        { status: 429 },
      );
    }
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `Errore API (${error.status}): ${error.message}` },
        { status: 502 },
      );
    }
    console.error("[enhance]", error);
    return NextResponse.json({ error: "Errore imprevisto." }, { status: 500 });
  }
}
