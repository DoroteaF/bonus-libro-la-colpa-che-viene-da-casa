# Landing dei bonus · «La Colpa che Viene da Casa»

Pagina a cui porta il codice QR del libro. La lettrice compila **nome, cognome ed email**, spunta l'informativa e preme **Sblocca i bonus**: i dati vengono salvati nel foglio Google e, nello stesso istante, al posto del modulo compare il pulsante **Apri la cartella dei bonus** (la cartella Drive con le schede degli esercizi e le frasi pronte). **Non viene inviata nessuna email.**

I contatti finiscono nel foglio **«lead libro la colpa che viene da casa»**, nella scheda **Lead** (creata in automatico), con queste colonne:

`Data primo invio · Nome · Cognome · Email · Libro · Consenso · Newsletter · Ultimo invio · Invii · Fonte · Versione informativa`

Se la stessa email compila di nuovo il modulo non si crea una riga doppia: si aggiornano «Ultimo invio» e il contatore «Invii».

## Contenuto della cartella

| File / cartella | A cosa serve |
|---|---|
| `index.html` | La landing: testo, i due bonus, modulo, pulsante di download dopo l'invio, informativa privacy. Si adatta a computer, tablet e telefono. |
| `copertina.jpg` | Copertina del libro mostrata nella pagina |
| `api/subscribe.js` | Riceve il modulo, lo controlla e lo passa allo script Google, poi restituisce il link della cartella |
| `api/info.js` | Fornisce all'informativa il nome del titolare e l'email di contatto |
| `api/_lib.js` | Funzioni comuni (non è un indirizzo pubblico) |
| `apps-script/Code.gs` | Lo script da incollare nel foglio Google: salva i dati e conosce il link della cartella dei bonus |
| `tests/` | Controlli automatici (`npm test`), 11 test |
| `package.json` | Impostazioni del progetto per Vercel |

## 1. Lo script nel foglio Google

1. Apri il foglio **lead libro la colpa che viene da casa** › **Estensioni › Apps Script**.
2. Cancella tutto e incolla tutto il contenuto di `apps-script/Code.gs`. Salva.
3. **Solo la prima volta:** in alto scegli la funzione **`setup`** e premi **▶ Esegui**, poi autorizza l'accesso al foglio (se compare «App non verificata»: *Avanzate › Vai al progetto*). Crea le intestazioni delle colonne.
4. **Esegui il deployment › Nuovo deployment** › tipo **Applicazione web** · Esegui come: **Io** · Chi ha accesso: **Chiunque** › **Esegui il deployment**.
5. Copia l'**URL dell'applicazione web** (finisce con `/exec`).

> Se in futuro modifichi `Code.gs` (per esempio per cambiare il link dei bonus), usa **Gestisci deployment › ✏️ › Versione: Nuova versione**: l'URL resta lo stesso e su Vercel non cambia nulla.

## 2. GitHub

Crea il repository, carica tutta la cartella `landing` (con `api`, `apps-script`, `tests`) e fai **Commit changes**.

## 3. Vercel

1. **Add New › Project › Import** del repository.
2. **Root Directory:** `landing` · Framework preset: **Other** (nessun comando di build).
3. **Environment Variables:**

| Nome | Valore |
|---|---|
| `APPS_SCRIPT_URL` | l'URL `/exec` copiato al punto 1.5 |
| `SHARED_SECRET` | `vhrbUfvYpOKwhSAkVpFn8P8DIGP90fOCbt3PGzX3sEE` |

4. **Deploy**. Se aggiungi o cambi una variabile dopo, fai **Redeploy**.

`SHARED_SECRET` è la stessa chiave scritta in cima a `Code.gs`: se la cambi, cambiala in entrambi i posti e non metterla mai nella pagina. Grazie a questa chiave il link della cartella dei bonus non compare nel codice della pagina: lo riceve solo chi invia il modulo.

## 4. Prova

1. Apri la landing dal telefono, compila il modulo e premi **Sblocca i bonus**.
2. Deve comparire «Ecco i tuoi bonus, …» con il pulsante giallo; nel foglio compare la riga.
3. Apri il pulsante **da una finestra anonima**: se Drive chiede l'accesso, imposta la cartella dei bonus su **Chiunque abbia il link · Visualizzatore**.

## Dettagli utili

- **Fonte:** aggiungendo `?fonte=instagram` (o altro) al link, la colonna «Fonte» registra da dove arriva la lettrice. Senza parametro vale `qr-libro`.
- **Chi torna sulla pagina** dallo stesso telefono ritrova subito il pulsante della cartella, senza ricompilare.
- **Protezioni:** campo nascosto contro i bot, controllo dei dati nella pagina, su Vercel e nello script, chiave segreta tra Vercel e Google, testo ripulito prima di scriverlo nel foglio.
- **Codice QR del libro:** quando hai l'indirizzo definitivo della landing, rigeneriamo il QR di pagina 194 e ricontrolliamo il PDF di stampa.

## Privacy

L'informativa nella pagina indica come titolare **Bianca Fiorentini** e come contatto l'email dell'account Google che possiede il foglio (letta in automatico dallo script). La casella obbligatoria riguarda solo l'accesso ai bonus; quella per ricevere notizie sui libri è separata e facoltativa, perché il GDPR non permette di legare il consenso al marketing a un servizio richiesto. Se un giorno scriverai alle lettrici, fallo solo con chi ha «Newsletter = sì». È una base ragionevole ma non sostituisce il parere di un consulente privacy.

## Test

Con Node 18 o superiore: `npm test`. Controllano `api/` (con lo script simulato) e `Code.gs` (con un foglio simulato): salvataggio, colonne, link restituito, nessuna email inviata, nessun duplicato, dati non validi, bot, chiave segreta e protezione dalle formule.
