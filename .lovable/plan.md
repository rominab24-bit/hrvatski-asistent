## Cilj
Automatski validirati SEO ključne datoteke (`index.html` metapodaci, `public/robots.txt`, `public/sitemap.xml`) prije svakog builda kako bi objava bila blokirana ako nešto nedostaje ili je pogrešno.

## Pristup
Lokalna Node validacijska skripta koja se pokreće kao `prebuild` hook u `package.json`. Ne uvodimo vanjski CI (GitHub Actions) jer projekt objavljuje kroz Lovable — `prebuild` osigurava da svaki `vite build` (uključujući Lovable objavu) prvo prođe validaciju.

## Što validirati

### 1. `index.html`
- `<html lang>` postoji i nije prazan
- `<title>` postoji, 10–60 znakova, nije template default ("Lovable App", "Vite App")
- `<meta name="description">` postoji, 50–160 znakova, nije "Lovable Generated Project"
- `<meta name="viewport">` postoji
- `og:title`, `og:description`, `og:type`, `og:url` postoje
- `twitter:card` postoji
- `og:url` ne sadrži duplu domenu (npr. `rominab24.com.rominab24.com`) — trenutno u kodu postoji ta greška, validator će je uhvatiti

### 2. `public/robots.txt`
- Datoteka postoji
- Sadrži barem jedan `User-agent:` blok
- Ne sadrži globalni `Disallow: /` pod `User-agent: *` (osim ako je namjerno)
- `Sitemap:` direktiva pokazuje na ispravnu domenu (bez duplikata poput `.com.rominab24.com`)

### 3. `public/sitemap.xml`
- Valjan XML (parsira se bez greške)
- Root element `<urlset>` s barem jednim `<url><loc>`
- Sve `<loc>` URL-ovi imaju istu bazu i tu bazu bez dupliciranja domene
- Nema duplikata `<loc>`
- Sve rute iz `src/App.tsx` (`<Route path=...>`) osim internih (`/reset-password`, `*`, dinamičkih) postoje u sitemapu — upozorenje ako nedostaju

## Implementacija

**Nova datoteka `scripts/validate-seo.mjs`:**
- Čita `index.html`, `public/robots.txt`, `public/sitemap.xml`
- Koristi `node:fs`, regex/DOM parser (`node-html-parser` ili jednostavan regex) i `fast-xml-parser` za XML
- Prikuplja greške i upozorenja; ispisuje jasan izvještaj u stdout
- Exit code `1` na greškama, `0` na upozorenjima
- Podržava `--warn-only` zastavicu (za lokalni razvoj) i `--fix-base-url` za auto-ispravak tipa duple domene

**Izmjene `package.json`:**
```
"scripts": {
  "validate:seo": "node scripts/validate-seo.mjs",
  "prebuild": "node scripts/validate-seo.mjs",
  ...
}
```

**Ovisnosti (dev):**
- `fast-xml-parser` (~50 KB, bez tranzitivnih ovisnosti)

## Popravci koje validator odmah otkriva
Trenutni kod ima duplu domenu `kucnibudzet.rominab24.com.rominab24.com` u:
- `index.html` (og:url)
- `public/robots.txt` (Sitemap:)
- `public/sitemap.xml` (svi `<loc>`)
- `src/components/SEO.tsx` (`BASE_URL`)

Ispravit ću ih na `https://kucnibudzet.rominab24.com` u istom koraku kako `prebuild` ne bi odmah blokirao objavu.

## Dokumentacija
Kratka napomena u `README.md`: kako pokrenuti `npm run validate:seo` ručno, što validator provjerava i kako privremeno preskočiti (`SKIP_SEO_VALIDATION=1 npm run build`).

## Van opsega
- GitHub Actions / vanjski CI (može se dodati kasnije ako preseliš van Lovable-a)
- Lighthouse / stvarni HTTP crawler (`seo_chat--trigger_scan` ostaje glavni alat za dubinsku analizu — validator pokriva samo statičku validaciju datoteka)