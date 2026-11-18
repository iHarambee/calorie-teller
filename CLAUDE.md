# Calorie Teller — projectoverdracht

Persoonlijke calorie-app voor Jordy (iPhone). Gebouwd in een Claude-chat op 18 nov 2026, wordt nu verder ontwikkeld in Claude Code.

## Communicatie
- Antwoord in het Nederlands, kort en praktisch.
- Zeg eerlijk en duidelijk wanneer iets onzeker of niet getest is.

## Wat de app is
Een losse web-app (PWA) die Jordy via Safari op zijn beginscherm zet ("Zet op beginscherm"), zodat hij als echte app opent. Er is geen build-stap: gewone HTML/CSS/JS.

Functies die er nu in zitten:
- **Invoer in gewone taal, getypt of ingesproken:** bijv. "Hey, ik heb nu 3 bolletjes en 3 eieren op". Een lokale Nederlandse parser maakt daar items van. Je ziet eerst een voorbeeld en voegt het met één tik toe.
- **Spraak:** via `webkitSpeechRecognition` (nl-NL). Werkt dat niet, dan gebruikt hij de microfoon van het iOS-toetsenbord.
- **Eigen producten:** naam, kcal per stuk of per 100 g, gram per stuk, andere namen. Er staan standaardproducten in, met geschatte waarden.
- **Zoek online (zonder API-sleutel):** in het productformulier zoekt de knop "Zoek" in Open Food Facts op naam (`cgi/search.pl`, bijv. "dekamarkt witte bolen") of op barcode (`api/v2/product/<ean>`). Een resultaat vult naam, winkel, kcal en macro's per 100 g in. Let op: de data komt van gebruikers, dekking is wisselend (niet elk product staat erin) en Open Food Facts geeft bij snel achter elkaar zoeken soms tijdelijk een 503 (zonder CORS-header). De app probeert twee keer en toont dan een melding. `search.openfoodfacts.org` heeft geen CORS en werkt niet vanuit de browser.
- **Dagweergave:** ring met resterende kcal, een "bon" van de dag (verwijderen en ongedaan maken), een balkje per dag voor de afgelopen 7 dagen, en navigatie per dag.
- **Snelknoppen** voor de meest gebruikte producten, en een instelbaar dagdoel (standaard 2000).
- **Back-up:** als bestand downloaden, kopiëren, en terugzetten (bestand of plakken).
- **Offline:** via een service worker.

## Bestanden
- `index.html` — de hele app (CSS + JS in één bestand). De parser staat tussen de markers `/*P*/ … /*/P*/`.
- `sw.js` — service worker, netwerk eerst en anders de cache. **Verhoog de cachenaam `C` (nu `kcal-v10`) bij elke release.**
- `manifest.json`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` — de PWA-gegevens en iconen.
- `test-parser.mjs` — snelle test van de parser: `node test-parser.mjs`.

## Gegevens
- `localStorage['kcal-v1']` = `{products:[{id,name,store?,kcal,unit:'stuk'|'100g',aliases[],uses,last?,grams?,nutr?:{per100:{kcal,eiwit,koolhydraten,suikers,vet,verzadigd,vezels,zout}},added?}], goal, mgoals:{eiwit,vet,koolhydraten}, days:{'YYYY-MM-DD':[{id,name,label,qty,unit,kcal,m?:{eiwit,vet,koolhydraten},time}]}}`
- `store` = winkel of merk (vrije tekst). Dezelfde naam mag bij meerdere winkels voorkomen. De parser kiest de winkel die je noemt ("brood van de appie"), anders het laatst gebruikte (`last`), en biedt in het voorbeeld een ⇄-knop voor de andere versies.
- `mgoals` = dagdoelen in gram; 0 betekent geen doel. `m` per bonregel = eiwit, vet en koolhydraten in gram, vastgelegd bij het toevoegen (uit `nutr.per100`; bij "stuk" via `grams`, anders afgeleid uit kcal). Regels zonder `m` tellen niet mee en het dashboard meldt dat.
- Alles staat alleen op de telefoon. Er is geen server en geen account.

## Geen betaalde diensten, geen camera (besluit van Jordy)
- Jordy wil eerst zonder geld werken. Daarom zijn de Claude-API (etiketfoto lezen, eten schatten) en het API-sleutelscherm **verwijderd** (v9). Alles gaat handmatig, plus de gratis "Zoek online" via Open Food Facts.
- Geen camerafuncties meer (foto van een etiket, barcode scannen). Bouw dat niet terug zonder dat Jordy erom vraagt.
- Producten worden handmatig ingevuld of via "Zoek online". De oude `kcal-key` in localStorage wordt niet meer gebruikt.

## Standaardproducten en bronnen (v10, `defv: 2`)
De standaardlijst (`DEF` in `index.html`) heeft nu gram per stuk en voedingswaarden per 100 g. `migrateDefaults()` zet die op een bestaande telefoon alleen op standaardproducten die Jordy niet zelf heeft aangepast (zelfde kcal als vroeger, geen winkel, geen eigen `nutr`) en voegt olijfolie en havermout toe als hij die nog niet heeft.
Herkomst, zodat je weet hoe hard de cijfers zijn:
- **USDA FoodData Central (SR Legacy, publiek domein), opgehaald:** ei hardgekookt 155 kcal/12,6 g eiwit/10,6 g vet/1,1 g kh; olijfolie 884 kcal (100 g vet); banaan 89 kcal; rijst gekookt 130 kcal; cola 42 kcal per 100 ml. Koolhydraten zijn "by difference" min vezels, zodat ze overeenkomen met Nederlandse etiketten (daar zitten vezels er niet in).
- **Nederlandse winkelproducten (Open Food Facts, mediaan van NL-producten) als controle:** pindakaas ca. 625 kcal, jong belegen kaas ca. 375 kcal, halfvolle melk ca. 48 kcal. Havermout: gemiddelde van Quaker, AH en PLUS-etiketten (ca. 372 kcal/100 g droog). De medianen voor bolletjes, brood, ham, kwark en kipfilet waren te rommelig (ook smaakjes en beleg).
- **Richtwaarden door mij gekozen, niet opgezocht:** bolletjes (wit 270, volkoren 245 kcal per 100 g, 55 g per stuk), boterham (235 kcal per 100 g, 35 g per snee), plak ham, magere kwark, kipfilet, appel (52 kcal), gram per stuk, en de eetlepel olijfolie (14 g).
- **Zonder voedingswaarden gelaten:** koffie met melk, kroket, kant-en-klaarmaaltijd (niet te verifiëren). Ze tellen niet mee voor eiwit, vet en koolhydraten.
- NEVO (RIVM) is bewust niet gebruikt: het downloaden gaat via een formulier met voorwaarden, en hergebruik mag alleen ongewijzigd met bronvermelding.
- De USDA-testsleutel `DEMO_KEY` heeft maar 10 aanvragen per uur.

## Ontwerp
- Stijl in de geest van Apple's Liquid Glass: kaarten met `backdrop-filter` (blur + saturate), een lichtrandje via een `::before`-laag, een zwevende glazen tabbalk onderaan en ronde knoppen.
- Kleuren: één donker palet in **blauw en donkergrijs** (Jordy's keuze). Er is geen lichte modus.
- Accent: donkerder blauw, verloop van `#3a7bea` naar `#1646b4`, achtergrond blauwer en minder grijs (basis `#0a1226`). Over het dagdoel heen wordt de ring rood `#ff453a`.
- Letters: SF Pro (systeemletter).
- Houd rekening met de safe areas van de iPhone (`env(safe-area-inset-*)`) en met `black-translucent` voor de statusbalk.

## Hosting
- **GitHub Pages**: https://iharambee.github.io/calorie-teller/ (repository `iHarambee/calorie-teller`, publiek, branch `main`). Een `git push` zet het ongeveer 1 minuut later online; GitHub bewaart pagina's tot 10 minuten (`max-age=600`).
- Commits gebruiken het noreply-adres van GitHub. Pas na een ja van Jordy pushen.

## Testen
- Parser: `node test-parser.mjs`.
- Uiterlijk: Playwright/Chromium met een viewport van 390×844. Dit is nog **niet op een echte iPhone getest**.
- Onzeker: of `webkitSpeechRecognition` werkt als de app vanaf het beginscherm opent.

## Volgende stappen (door Jordy gekozen om mee te beginnen)
1. **Siri / Opdrachten:** de app leest een URL-parameter (bijv. `?eet=3 bolletjes`) bij het openen en zet die in het voorbeeld. Maak ook een iOS-opdracht: "Dicteer tekst" → open de URL. Daarna Jordy uitleggen hoe hij de opdracht maakt.
2. ~~Barcode scannen met de camera~~ — vervallen: Jordy wil geen camerafuncties. Barcode intypen in "Zoek online" werkt wel.
3. ~~Eiwit en macro's per dag~~ — gebouwd (dashboard met doelen).

Ideeën die Jordy nog kan kiezen: opgeslagen maaltijden, gisteren kopiëren, maaltijden indelen (ontbijt/lunch/…), gewicht met grafiek, doelcalculator, water.

Later eventueel: vaste maaltijden met één tik, gewicht bijhouden met een grafiek, een dagdoel-calculator (Jordy wil droogtrainen of afvallen) en een weekgemiddelde.

## Oude versie
Er bestaat ook een eerdere versie als Claude-artifact (rode stijl, gegevens in het Claude-account). Gegevens overzetten gaat met "Kopieer al je gegevens" in de oude versie en "Back-up terugzetten" in deze app. Die versie wordt niet verder ontwikkeld.
