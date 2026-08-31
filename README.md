# PromptForge

Generatore di prompt per AI. Compili i campi, il prompt si costruisce mentre scrivi —
e se vuoi lo fai rifinire da Claude.

## Come funziona

**Generatore locale (sempre attivo, gratis).** Tutto avviene nel browser: nessuna
chiamata di rete, nessuna chiave API. Il form raccoglie ruolo, obiettivo, contesto,
destinatari, formato, tono, vincoli, esempi e criteri di successo, e li monta nella
struttura giusta per il modello scelto:

- **Claude** → sezioni con tag XML (`<ruolo>`, `<obiettivo>`, …), il formato che segue meglio
- **GPT / Gemini / Generico** → sezioni markdown (`## Ruolo`, `## Obiettivo`, …)
- **Paragrafo unico** → per Midjourney, DALL·E, Sora o richieste brevi

Sei preset (Scrittura, Codice, Analisi, Marketing, Immagine, Agente) precompilano il
form; il pannello "Cosa manca" segnala i campi vuoti che indeboliscono il prompt.
Lo stato del form resta in `localStorage`, quindi ritrovi tutto alla riapertura.

**Rifinitura AI (opzionale).** Il pulsante "Rifinisci con AI" manda il prompt a
`/api/enhance`, che chiama Claude Opus 5 e restituisce una versione riscritta.
Senza `ANTHROPIC_API_KEY` il pulsante resta disattivato e il resto funziona come
sempre.

## In locale

```bash
npm install
npm run dev
```

Poi apri http://localhost:3000.

Per abilitare la rifinitura AI, crea `.env.local` (vedi `.env.example`):

```
ANTHROPIC_API_KEY=sk-ant-...
```

## Deploy su Vercel via GitHub

1. Crea un repository vuoto su GitHub chiamato `promptforge`.
2. Dalla cartella del progetto:

   ```bash
   git remote add origin https://github.com/<tuo-utente>/promptforge.git
   git branch -M main
   git push -u origin main
   ```

3. Su [vercel.com/new](https://vercel.com/new) importa il repository. Vercel riconosce
   Next.js da solo: **non toccare** Framework Preset, Root Directory, Build Command
   o Output Directory.
4. Solo se vuoi la rifinitura AI: in **Settings → Environment Variables** aggiungi
   `ANTHROPIC_API_KEY` per Production, Preview e Development, poi **Redeploy**
   (le variabili nuove non entrano in un build già fatto).

Ogni `git push` su `main` fa partire un deploy.

## Struttura

```
app/
  page.tsx              interfaccia (client component)
  layout.tsx            metadata e shell
  globals.css           tema
  api/enhance/route.ts  endpoint che chiama Claude
lib/
  types.ts              la specifica del prompt
  builder.ts            generatore locale + suggerimenti
  presets.ts            i sei preset
```

Per aggiungere un preset basta una voce in `lib/presets.ts`. Per cambiare la forma
del prompt generato si tocca solo `lib/builder.ts`.

## Costi

Il generatore locale è gratuito. La rifinitura AI consuma token Claude Opus 5
($5/1M input, $25/1M output): un prompt tipico costa qualche centesimo di dollaro.
