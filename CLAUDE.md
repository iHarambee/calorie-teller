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
- **Foto van een etiket:** Claude leest de voedingswaarden en slaat het product op met voedingswaarden per 100 g.
- **Zoek online (zonder API-sleutel):** in het productformulier zoekt de knop "Zoek" in Open Food Facts op naam (`cgi/search.pl`, bijv. "dekamarkt witte bolen") of op barcode (`api/v2/product/<ean>`). Een resultaat vult naam, winkel, kcal en macro's per 100 g in. Let op: de data komt van gebruikers, dekking is wisselend (niet elk product staat erin) en Open Food Facts geeft bij snel achter elkaar zoeken soms tijdelijk een 503 (zonder CORS-header). De app probeert twee keer en toont dan een melding. `search.openfoodfacts.org` heeft geen CORS en werkt niet vanuit de browser.
- **Schatten van onbekend eten:** via Claude, met de optie om het als product te bewaren.
- **Dagweergave:** ring met resterende kcal, een "bon" van de dag (verwijderen en ongedaan maken), een balkje per dag voor de afgelopen 7 dagen, en navigatie per dag.
- **Snelknoppen** voor de meest gebruikte producten, en een instelbaar dagdoel (standaard 2000).
- **Back-up:** als bestand downloaden, kopiëren, en terugzetten (bestand of plakken).
- **Offline:** via een service worker.

## Bestanden
- `index.html` — de hele app (CSS + JS in één bestand). De parser staat tussen de markers `/*P*/ … /*/P*/`.
- `sw.js` — service worker, netwerk eerst en anders de cache. **Verhoog de cachenaam `C` (nu `kcal-v5`) bij elke release.**
- `manifest.json`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` — de PWA-gegevens en iconen.
- `test-parser.mjs` — snelle test van de parser: `node test-parser.mjs`.

## Gegevens
- `localStorage['kcal-v1']` = `{products:[{id,name,store?,kcal,unit:'stuk'|'100g',aliases[],uses,last?,grams?,nutr?:{per100:{kcal,eiwit,koolhydraten,suikers,vet,verzadigd,vezels,zout}},est?}], goal, mgoals:{eiwit,vet,koolhydraten}, days:{'YYYY-MM-DD':[{id,name,label,qty,unit,kcal,m?:{eiwit,vet,koolhydraten},time}]}}`
- `store` = winkel of merk (vrije tekst). Dezelfde naam mag bij meerdere winkels voorkomen. De parser kiest de winkel die je noemt ("brood van de appie"), anders het laatst gebruikte (`last`), en biedt in het voorbeeld een ⇄-knop voor de andere versies.
- `mgoals` = dagdoelen in gram; 0 betekent geen doel. `m` per bonregel = eiwit, vet en koolhydraten in gram, vastgelegd bij het toevoegen (uit `nutr.per100`; bij "stuk" via `grams`, anders afgeleid uit kcal). Regels zonder `m` tellen niet mee en het dashboard meldt dat. Geschatte producten (Claude) hebben nog geen macro's.
- `localStorage['kcal-key']` = de Anthropic API-sleutel van Jordy. Die blijft op zijn telefoon en hoort niet in de back-up.
- Alles staat alleen op de telefoon. Er is geen server en geen account.

## Claude (AI)
- Directe browser-aanroep naar `https://api.anthropic.com/v1/messages` met de header `anthropic-dangerous-direct-browser-access: true`.
- Modellen: `claude-haiku-5-5` voor schattingen, `claude-sonnet-5-5` voor het lezen van etiketfoto's.
- Antwoorden komen terug als JSON. Zonder sleutel verbergt de app de AI-knoppen en werkt de rest gewoon.

## Ontwerp
- Stijl in de geest van Apple's Liquid Glass: kaarten met `backdrop-filter` (blur + saturate), een lichtrandje via een `::before`-laag, een zwevende glazen tabbalk onderaan en ronde knoppen.
- Kleuren: één donker palet in **blauw en donkergrijs** (Jordy's keuze). Er is geen lichte modus.
- Accent: blauw `#4aa3ff` met een verloop van `#5cb0ff` naar `#1a6ae6`. Over het dagdoel heen wordt de ring rood `#ff453a`.
- Letters: SF Pro (systeemletter).
- Houd rekening met de safe areas van de iPhone (`env(safe-area-inset-*)`) en met `black-translucent` voor de statusbalk.

## Hosting
- Netlify, gratis plan: 300 credits per maand. Elke productie-deploy kost 15 credits, dus maximaal ongeveer 20 deploys per maand.
- Mogelijke volgende stap: de map op GitHub zetten en Netlify daaraan koppelen, zodat elke push automatisch online komt.

## Testen
- Parser: `node test-parser.mjs`.
- Uiterlijk: Playwright/Chromium met een viewport van 390×844. Dit is nog **niet op een echte iPhone getest**.
- Onzeker: of `webkitSpeechRecognition` werkt als de app vanaf het beginscherm opent.

## Volgende stappen (door Jordy gekozen om mee te beginnen)
1. **Siri / Opdrachten:** de app leest een URL-parameter (bijv. `?eet=3 bolletjes`) bij het openen en zet die in het voorbeeld. Maak ook een iOS-opdracht: "Dicteer tekst" → open de URL. Daarna Jordy uitleggen hoe hij de opdracht maakt.
2. **Barcode scannen:** camera plus een JS-barcodelezer (Safari heeft geen `BarcodeDetector`), en dan de Open Food Facts API (`https://world.openfoodfacts.org/api/v2/product/<ean>.json`) → product met voedingswaarden. Niet elk Nederlands product staat erin, dus terugvallen op een foto of handmatig invullen.
3. **Eiwit en macro's per dag:** op basis van `nutr.per100` (plus grammen per stuk). Producten zonder voedingswaarden tellen niet mee, en dat moet de app duidelijk laten zien.

Later eventueel: vaste maaltijden met één tik, gewicht bijhouden met een grafiek, een dagdoel-calculator (Jordy wil droogtrainen of afvallen) en een weekgemiddelde.

## Oude versie
Er bestaat ook een eerdere versie als Claude-artifact (rode stijl, gegevens in het Claude-account). Gegevens overzetten gaat met "Kopieer al je gegevens" in de oude versie en "Back-up terugzetten" in deze app. Die versie wordt niet verder ontwikkeld.
