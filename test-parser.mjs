// Snelle test van de parser in index.html (code tussen /*P*/ en /*/P*/).
// Gebruik: node test-parser.mjs
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const code = html.slice(html.indexOf('/*P*/') + 5, html.indexOf('/*/P*/'));
const { DEF, parse, kcalOf, macrosOf } = new Function(code + '; return { DEF, parse, kcalOf, macrosOf };')();

// Twee soorten brood van verschillende winkels (DekaMarkt is het laatst gebruikt).
const WINKELS = [...DEF,
  { id: 'a1', name: 'brood', store: 'Appie', kcal: 90, unit: 'stuk', aliases: [], uses: 1, last: 1 },
  { id: 'd1', name: 'brood', store: 'DekaMarkt', kcal: 100, unit: 'stuk', aliases: [], uses: 5, last: 2 },
];

const cases = [
  ['Hey, ik heb nu 3 bolletjes en 3 eieren op, zet dit in de dagcalorie', ['3x bolletje', '3x ei'], []],
  ['twee boterhammen met kaas en een banaan', ['2x boterham', '1x plak kaas', '1x banaan'], []],
  ['200 gram kipfilet, 150g rijst', ['200x kipfilet', '150x rijst'], []],
  ['anderhalve kroket', ['1.5x kroket'], []],
  ['een koffie met melk plus 2 plakken ham', ['1x koffie met melk', '2x plak ham'], []],
  ['ik had een kapsalon en een blikje cola', ['1x blikje cola'], ['kapsalon']],
  // winkels
  ['twee sneetjes brood van de appie', ['2x brood (Appie)'], [], WINKELS],
  ['2 brood van dekamarkt', ['2x brood (DekaMarkt)'], [], WINKELS],
  ['appie brood en een ei', ['1x brood (Appie)', '1x ei'], [], WINKELS],
  ['een brood', ['1x brood (DekaMarkt)'], [], WINKELS], // geen winkel genoemd: laatst gebruikt
];

let fail = 0;
for (const [text, want, wantUnknown, prods = DEF] of cases) {
  const r = parse(text, prods);
  const got = r.items.map(i => `${i.qty}x ${i.name}${i.store ? ` (${i.store})` : ''}`);
  const ok = JSON.stringify(got) === JSON.stringify(want) && JSON.stringify(r.unknown) === JSON.stringify(wantUnknown);
  if (!ok) fail++;
  console.log(ok ? 'OK  ' : 'FOUT', text, '→', got.join(' | '), r.unknown.length ? '? ' + r.unknown.join(', ') : '',
    '=', Math.round(r.items.reduce((a, i) => a + kcalOf(i), 0)), 'kcal');
}
// andere winkel als alternatief aanbieden
{
  const alts = parse('een brood', WINKELS).items[0].alts;
  // "brood" is ook een bijnaam van de standaard-boterham (p2), dus die staat er ook tussen.
  const ok = JSON.stringify(alts) === JSON.stringify(['a1', 'p2']);
  if (!ok) fail++;
  console.log(ok ? 'OK  ' : 'FOUT', 'alternatieven bij "een brood":', alts.join(','));
}

// eiwit, vet en koolhydraten
const per100 = { kcal: 200, eiwit: 10, vet: 5, koolhydraten: 30 };
const macroCases = [
  ['150 g van een 100g-product', { unit: '100g', qty: 150, per: 200 }, { nutr: { per100 } }, { eiwit: 15, vet: 7.5, koolhydraten: 45 }],
  ['2 stuks met gram per stuk', { unit: 'stuk', qty: 2, per: 80 }, { grams: 40, nutr: { per100 } }, { eiwit: 8, vet: 4, koolhydraten: 24 }],
  ['stuk zonder gram: gram afleiden uit kcal', { unit: 'stuk', qty: 2, per: 90 }, { nutr: { per100 } }, { eiwit: 9, vet: 4.5, koolhydraten: 27 }],
  ['alleen eiwit bekend', { unit: '100g', qty: 100, per: 100 }, { nutr: { per100: { kcal: 100, eiwit: 20 } } }, { eiwit: 20 }],
  ['geen voedingswaarden', { unit: 'stuk', qty: 1, per: 100 }, {}, null],
];
for (const [naam, item, prod, want] of macroCases) {
  const got = macrosOf(item, prod);
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fail++;
  console.log(ok ? 'OK  ' : 'FOUT', 'macro:', naam, '→', JSON.stringify(got));
}
process.exit(fail ? 1 : 0);
