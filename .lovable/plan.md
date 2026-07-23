Cilj: Zamijeniti trenutačnu domenu `kucnibudzet.rominab24.com.rominab24.com` ispravnom poddomenom `kucnibudzet.rominab24.com`.

````text
Trenutačno stanje:
- Custom domain: https://kucnibudzet.rominab24.com.rominab24.com (dupli sufiks)
- Cilj:       https://kucnibudzet.rominab24.com
````

## Korak 1: Dodati novu domenu u Lovable
- Putanja: **Project Settings → Project section → Domains** (ili **Publish dialog → Add custom domain**)
- Unijeti: `kucnibudzet.rominab24.com`
- Lovable će generirati potrebne DNS zapise.

## Korak 2: Postaviti DNS zapise kod registrara domene rominab24.com
Na mjestu gdje se upravlja DNS-om za `rominab24.com` (registrar / DNS hosting) dodati:

- **A zapis:**
  - Name: `kucnibudzet`
  - Value: `185.158.133.1`

- **TXT zapis (verifikacija):**
  - Name: `_lovable.kucnibudzet` (Lovable prikaže točnu vrijednost)
  - Value: `lovable_verify=...` (vrijednost iz Lovable UI-a)

Ako `rominab24.com` koristi Cloudflare ili sličan proxy, u Lovable dijalogu za povezivanje domene označiti opciju **"Domain uses Cloudflare or a similar proxy"** — tada se koristi CNAME verifikacija umjesto A zapisa.

## Korak 3: Pričekati propagaciju DNS-a
- Najčešće 15 minuta do 72 sata.
- U Lovable UI-u status domene će prijeći u **Verifying** → **Active**.

## Korak 4: Postaviti novu domenu kao primarnu
- Kada domena postane **Active**, u Project Settings → Domains odabrati `kucnibudzet.rominab24.com` kao **Primary**.
- Lovable će automatski preusmjeriti druge domene na nju.

## Korak 5: Ukloniti staru duplu domenu
- U Project Settings → Domains ukloniti `kucnibudzet.rominab24.com.rominab24.com` da se izbjegne zbunjujući URL.

## Korak 6: Ažurirati kod i SEO datoteke za novu domenu
Nakon što se domena promijeni, ažurirati sve reference u projektu:
- `public/sitemap.xml` — `<loc>` URL-ovi
- `public/robots.txt` — `Sitemap:` direktiva
- `index.html` — `og:url` meta tag
- `src/components/SEO.tsx` — `BASE_URL` konstanta
- `capacitor.config.ts` — ako uključuje server URL
- Ponovno objaviti aplikaciju da promjene budu vidljive na produkciji.

## Korak 7: Ponovno verificirati Google Search Console
- Nakon što je nova domena aktivna, ponoviti verifikaciju u Google Search Console i poslati novi sitemap.

## Napomene
- `www.rominab24.com` i `rominab24.com` ostaju netaknuti ako se i dalje koriste za drugu svrhu.
- Ako je domena `rominab24.com` kupljena kroz Lovable, DNS zapise možete uređivati direktno u **Project Settings → Domains → ⋮ → Configure → Manage DNS records**.
- Ako nije kupljena kroz Lovable, zapise morate dodati na registrarovoj stranici za DNS upravljanje.