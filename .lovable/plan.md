
# Globalni mjesečni limit AI skeniranja računa

Cilj: ograničiti ukupan broj AI skeniranja računa na **250 po kalendarskom mjesecu** za cijelu aplikaciju (svi korisnici zajedno). Kad se limit dosegne, skeniranje se blokira do 1. sljedećeg mjeseca uz jasnu poruku korisniku.

## Što se mijenja

### 1. Baza — brojač u novoj tablici
Nova tablica `ai_scan_usage` s jednim retkom po mjesecu:
- `month` (npr. `2026-07`) kao primarni ključ
- `count` — koliko je skeniranja obavljeno tog mjeseca
- `updated_at`

Uz nju SECURITY DEFINER funkcija `increment_scan_usage(monthly_limit int)` koja atomarno:
1. Umetne/pročita redak za tekući mjesec.
2. Ako je `count >= monthly_limit` → vrati `{ allowed: false, count, limit }`.
3. Inače inkrementira i vrati `{ allowed: true, count, limit }`.

RLS: tablica zaključana, pristup samo preko funkcije (poziva ju edge funkcija sa service role ključem). Autentificirani korisnici smiju pročitati samo tekući `count` i limit preko posebne read-only funkcije `get_scan_usage()` da UI može prikazati stanje.

### 2. Edge funkcija `scan-receipt`
Na samom početku (nakon auth provjere, prije poziva AI-ja):
- Pozove `increment_scan_usage(250)`.
- Ako `allowed = false`, vrati **HTTP 429** s porukom:
  > „Dosegnut je mjesečni limit AI skeniranja (250/mjesec). Skeniranje će ponovno biti dostupno 1. u sljedećem mjesecu. Troškove možete i dalje unositi ručno."
- Inače nastavi normalno. (Nema smanjivanja brojača kod AI greške — jednostavnije i sprječava zlouporabu; 250/mjesec ima dovoljno margine.)

### 3. Frontend
- `useReceiptScanner` prepoznaje status 429 s poljem `limit_reached` i prikazuje jasan toast s porukom iznad.
- `ReceiptScanner` komponenta na ulaznom ekranu diskretno prikazuje „Iskorišteno X / 250 skeniranja ovog mjeseca" (dohvat preko `get_scan_usage` RPC-a pri otvaranju).
- Kad je limit dosegnut, gumbi „Fotografiraj" i „Odaberi sliku" su onemogućeni s objašnjenjem; ručni unos troška ostaje potpuno funkcionalan.

## Što se NE mijenja
- Postojeći tijek skeniranja, PII redakcija, kategorizacija i feedback ostaju identični.
- Nema per-user limita — samo globalni.
- Nema promjena u naplati/kreditima; ovo je aplikacijski limit neovisan od Lovable kredita.

## Tehnički detalji

- `month` se računa iz `now() AT TIME ZONE 'Europe/Zagreb'` formatiranog kao `YYYY-MM` da se reset događa u ponoć po lokalnom vremenu.
- Broj 250 je konstanta u edge funkciji — lako promjenjiva jednom vrijednošću ako kasnije poželiš drugi limit.
- Read RPC `get_scan_usage()` vraća `{ count, limit, month }` bez ikakvih osobnih podataka; siguran za sve prijavljene korisnike.
