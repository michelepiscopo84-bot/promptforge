# PromptForge

Strumento di prompt engineering strutturato. Compili un modulo, ottieni un prompt
professionale nella convenzione giusta per il modello di destinazione, con un
punteggio che ti dice cosa manca.

## Cosa fa davvero

**Il generatore lavora in locale.** Nessuna chiamata di rete, nessuna chiave API,
nessun dato che esce dal browser. Il prompt si ricostruisce a ogni battuta.

**Adatta la sintassi al modello.** Non è cosmesi: cambia quanto il modello rispetta
le istruzioni.

- **Claude** → sezioni con tag XML (`<ruolo>`, `<procedura>`, `<vincoli>`…)
- **GPT / Gemini / Generico** → intestazioni markdown
- **Paragrafo unico** → per Midjourney, DALL·E, Sora

**Copre le tecniche che spostano il risultato**, non tre spunte generiche:

| Tecnica | Cosa aggiunge al prompt |
|---|---|
| Ragionamento esplicito | Impone di valutare vincoli e alternative prima di rispondere |
| Revisione finale | Rilegge l'output contro i criteri e lo corregge prima di consegnarlo |
| Domande prima di partire | Si ferma se manca un'informazione decisiva, invece di ipotizzarla |
| Nessuna invenzione | Vincola alle sole informazioni fornite, con obbligo di dichiarare i vuoti |
| Grado di certezza | Separa ciò che sa da ciò che sta inferendo |
| Riferimenti puntuali | Ogni affermazione non ovvia deve indicare la fonte |
| Niente preamboli | Elimina introduzioni, riepiloghi e chiusure di cortesia |
| Contesto delimitato | Isola il materiale e neutralizza i comandi nascosti al suo interno |

Più il **few-shot** con coppie input/output, i **casi limite** dichiarati in anticipo,
lo **schema di output** esatto per gli usi automatizzati, e i **criteri di successo**
su cui si appoggia la revisione finale.

**Punteggio di qualità 0-100.** Pesato su quanto ogni elemento sposta davvero il
risultato: gli esempi valgono quanto il contratto di output, i destinatari molto meno.
La scheda *Qualità* elenca cosa manca e perché conta.

**Variabili.** Scrivi `{{cliente}}` in qualsiasi campo: compare nella scheda
*Variabili*, la compili lì e il prompt che copi è già pronto. Il modello resta
riutilizzabile.

**Libreria locale.** Salva il modulo compilato, non solo il testo: lo riapri e
continui a modificarlo.

**Dieci preset professionali** già compilati a livello alto: Implementazione,
Code review, Analisi dati, Estrazione dati (JSON), Contenuti editoriali,
Copy commerciale, Consulenza, System prompt, Traduzione, Immagini.

## Rifinitura AI (opzionale)

Il pulsante *Rifinisci con AI* manda il prompt a `/api/enhance`, che chiama
Claude Opus 5 con istruzioni precise: togliere ambiguità, rendere azionabili le
istruzioni non verificabili, eliminare contraddizioni fra sezioni — senza allungare
il prompt, senza inventare requisiti, conservando la convenzione (XML o markdown) e
gli esempi.

Senza `ANTHROPIC_API_KEY` il pulsante è disattivato e tutto il resto funziona.

## In locale

```bash
npm install
npm run dev
```

Per abilitare la rifinitura, crea `.env.local` (vedi `.env.example`):

```
ANTHROPIC_API_KEY=sk-ant-...
```

## Deploy su Vercel via GitHub

Il repo è già collegato: `git push` sul branch `main` fa partire un deploy.

Per la rifinitura AI, in **Settings → Environment Variables** aggiungi
`ANTHROPIC_API_KEY` su Production, Preview e Development, poi **Redeploy** — una
variabile aggiunta dopo non entra in un build già fatto.

Se il sito mostra la pagina di login di Vercel invece dell'app, la causa è
**Settings → Deployment Protection**, non il codice.

## Struttura

```
app/
  page.tsx               stato e composizione
  layout.tsx             shell e metadata
  globals.css            tema
  api/enhance/route.ts   rifinitura via Claude
components/
  Modulo.tsx             il modulo in sei sezioni
  Risultato.tsx          output, qualità, variabili, libreria
lib/
  types.ts               la specifica del prompt
  builder.ts             generatore, tecniche, variabili
  qualita.ts             punteggio pesato e diagnosi
  presets.ts             i dieci preset
```

Per cambiare la forma dei prompt generati si tocca solo `lib/builder.ts`; per
aggiungere un mestiere, una voce in `lib/presets.ts`; per ritarare il punteggio,
i pesi in `lib/qualita.ts`.

## Costi

Il generatore è gratuito e funziona senza account. La rifinitura consuma token
Claude Opus 5 ($5/1M input, $25/1M output): qualche centesimo a prompt.
