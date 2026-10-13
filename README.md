# Omnia Casa · Locandine riunioni

Programma per Windows e macOS: compili i dati della riunione, vedi l'anteprima e scarichi la locandina in PDF (A3 o A4) o PNG.

## Uso
1. Compila i campi a sinistra (condominio, data, ora, luogo, Zoom, ordine del giorno).
2. L'anteprima a destra si aggiorna in tempo reale.
3. Scegli **A4** o **A3** e premi **Scarica PDF** (oppure **Scarica immagine (PNG)**).

I dati restano salvati per la prossima volta. **Nuova riunione** azzera tutto.
Nel PDF il pulsante «Entra nella riunione» è cliccabile e porta al link Zoom inserito.

## Installazione
- **Windows:** esegui `Omnia Casa Locandine Setup 1.0.0.exe` (oppure decomprimi lo zip e apri `Omnia Casa Locandine.exe`). Se compare «Windows ha protetto il PC» → *Ulteriori informazioni* → *Esegui comunque*.
- **macOS:** apri il `.dmg` e trascina l'app in Applicazioni. Se macOS dice che l'app è «danneggiata» o «da sviluppatore non identificato»: apri *Terminale* e lancia `xattr -cr "/Applications/Omnia Casa Locandine.app"`, poi riapri l'app (oppure *Impostazioni di Sistema → Privacy e sicurezza → Apri comunque*). L'app non è firmata con un account Apple Developer.

## Per sviluppatori
```
npm install
npm start            # avvia l'app
npm run dist:win     # installer Windows (da Windows)
npm run dist:mac     # dmg/zip macOS (da macOS)
```
Su GitHub: *Actions → Crea programma Windows e macOS → Run workflow* produce gli installer scaricabili.

Il modello grafico della locandina è in `poster.js` (condiviso da anteprima ed esportazione); logo in `assets/`, font Inter in `fonts/`.
