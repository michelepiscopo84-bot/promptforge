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

**Revisione automatica del testo.** Analizza quello che scrivi tu, non l'impalcatura:
segnala gli aggettivi valutativi senza criterio («chiaro», «professionale»), le
lunghezze a parole invece che a numeri, le quantità indefinite, le istruzioni
formulate come suggerimenti («cerca di…»), le formule di cortesia e gli assoluti che
rischiano di contraddirsi. Ogni rilievo cita il termine trovato e dice come
riscriverlo. I divieti sono esclusi dal controllo: lì nominare il difetto è il punto.

**Divisione system / user.** Le istruzioni stabili nel system, richiesta e materiale
nel messaggio utente: è la forma in cui un prompt va davvero usato via API, e
permette di sfruttare la cache sul prefisso. La vista **JSON API** dà il corpo della
richiesta già pronto da incollare.

**Banco di prova.** Esegue il prompt su Claude e mostra cosa produce davvero, con
token consumati e costo della singola esecuzione. Il punteggio misura la forma, la
prova misura il risultato.

**Punteggio di qualità 0-100.** Pesato su quanto ogni elemento sposta davvero il
risultato: gli esempi valgono quanto il contratto di output, i destinatari molto meno.
La scheda *Analisi* elenca cosa manca e perché conta.

**Variabili.** Scrivi `{{cliente}}` in qualsiasi campo: compare nella scheda
*Variabili*, la compili lì e il prompt che copi è già pronto. Il modello resta
riutilizzabile.

**Libreria locale.** Salva il modulo compilato, non solo il testo: lo riapri e
continui a modificarlo.

**Dieci preset professionali** già compilati a livello alto: Implementazione,
Code review, Analisi dati, Estrazione dati (JSON), Contenuti editoriali,
Copy commerciale, Consulenza, System prompt, Traduzione, Immagini.

## La chiave la mette chi usa il sito

Le due funzioni che parlano con Claude — *Rifinisci con AI* e *Prova* — usano la
chiave del visitatore, non una del sito. Il pulsante **Chiave** in alto apre il
pannello dove incollarla.

- Resta salvata **solo nel browser di chi la inserisce** (`localStorage`).
- Viaggia dentro la singola richiesta, in un'intestazione, per parlare con
  Anthropic: non viene scritta su disco né nei log del server.
- Il consumo lo paga chi la possiede. Chi pubblica il sito non spende nulla e non
  rischia bollette a sorpresa.
- Chi non ne ha una usa tutto il resto: generatore, revisione, punteggio,
  variabili e libreria non richiedono alcuna chiave.

Se invece imposti `ANTHROPIC_API_KEY` fra le variabili d'ambiente, il sito ne ha una
propria e le funzioni AI restano disponibili per chiunque **a tue spese**: su un sito
pubblico è sconsigliato senza un limite di richieste. Quando entrambe sono presenti,
vince quella del visitatore.

## Rifinitura AI

Il pulsante *Rifinisci con AI* manda il prompt a `/api/enhance`, che chiama
Claude Opus 5 con istruzioni precise: togliere ambiguità, rendere azionabili le
istruzioni non verificabili, eliminare contraddizioni fra sezioni — senza allungare
il prompt, senza inventare requisiti, conservando la convenzione (XML o markdown) e
gli esempi.

Senza chiave il pulsante è disattivato e tutto il resto funziona.

## In locale

```bash
npm install
npm run dev
```

Le funzioni AI si abilitano incollando la propria chiave nel pannello **Chiave**,
senza toccare nessun file. In alternativa, per averle sempre attive in locale, crea
`.env.local` (vedi `.env.example`).

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
  api/enhance/route.ts   rifinitura del prompt via Claude
  api/run/route.ts       banco di prova: esegue il prompt
  api/visite/route.ts    contatore visite su Redis
components/
  Chiave.tsx             pannello della chiave del visitatore
  Visite.tsx             il contatore in fondo alla pagina
  Modulo.tsx             il modulo in sei sezioni
  Risultato.tsx          prompt, analisi, variabili, prova, libreria
lib/
  types.ts               la specifica del prompt
  chiave.ts              nome dell'intestazione e controllo di forma
  chiave-server.ts       da dove prendere la chiave: visitatore o ambiente
  builder.ts             generatore, tecniche, system/user, variabili
  lint.ts                revisione del testo scritto dall'utente
  qualita.ts             punteggio pesato e diagnosi
  presets.ts             i dieci preset
```

Per cambiare la forma dei prompt generati si tocca solo `lib/builder.ts`; per
aggiungere un mestiere, una voce in `lib/presets.ts`; per ritarare il punteggio,
i pesi in `lib/qualita.ts`.

## Costi

Il generatore, la revisione, il punteggio, le variabili e la libreria sono gratuiti e
non richiedono alcun account. Rifinitura e prova consumano token Claude Opus 5
($5/1M input, $25/1M output) sull'account di chi mette la chiave: qualche centesimo
a esecuzione.

## Visite

Due strumenti distinti, che rispondono a due domande diverse.

**Il contatore in fondo alla pagina** mostra le visite totali a chiunque apra il
sito. Richiede un archivio condiviso: su Vercel si collega in pochi clic dalla scheda
**Storage** del progetto, scegliendo un database **Redis** (Upstash ha un piano
gratuito). Vercel inietta da solo le variabili `KV_REST_API_URL` e
`KV_REST_API_TOKEN`; il codice accetta anche i nomi `UPSTASH_REDIS_REST_*`. Dopo il
collegamento serve un **Redeploy**.

Finché nessun archivio è collegato il contatore **non compare affatto**, invece di
mostrare uno zero che non significherebbe niente.

Conta una visita per visitatore al giorno: l'indirizzo IP non viene mai memorizzato,
solo un hash che scade in 24 ore e da cui non si risale a nessuno.

**Vercel Web Analytics** è l'altra metà: invisibile sul sito, raccoglie visitatori,
pagine viste e provenienza nella scheda **Analytics** del progetto. Niente cookie,
nessun banner da mostrare. Attenzione: i blocchi pubblicità impediscono la
registrazione, quindi le tue visite potrebbero non comparire.
