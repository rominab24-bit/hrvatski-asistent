Plan: Postavljanje poddomene kucnibudzet.rominab24.com kao primarne adrese aplikacije

## Trenutno stanje
- Projekt još nije objavljen (nema published_url).
- Već su spojene domene: rominab24.com i www.rominab24.com.
- Željena nova poddomena: kucnibudzet.rominab24.com, koja će postati primarna.

## Koraci

1. **Objaviti projekt**
   - Pokrenuti objavu kako bi aplikacija bila dostupna na javnoj Lovable adresi i omogućilo se upravljanje domenama.

2. **Ažurirati kodne reference na novu domenu**
   - Proći kroz `index.html`, `public/manifest.json`, `public/robots.txt` / `public/sitemap.xml` te `capacitor.config.ts` ako sadrže hardkodirane domene (rominab24.com / www.rominab24.com).
   - Zamijeniti ih s `https://kucnibudzet.rominab24.com` kao primarnom domenom.
   - Ako postoje APP URL-ovi za deep linkove ili OAuth callback, prilagoditi ih.

3. **Dodati poddomenu u Lovable**
   - Project Settings → Project → Domains → Add/Connect domain.
   - Unijeti: `kucnibudzet.rominab24.com`.

4. **Konfigurirati DNS zapise**
   - Ako je rominab24.com kupljena kroz Lovable: DNS se upravlja u Lovable UI-ju (Manage DNS records), dodati CNAME/A zapis za poddomenu prema uputama.
   - Ako je domena na vanjskom registrar: dodati DNS zapis na tom registrar (obično A zapis na Lovable IP ili CNAME na Lovable domena, ovisno o uputama koje Lovable prikaže prilikom spajanja).

5. **Postaviti poddomenu kao primarnu**
   - U Domains postavkama označiti `kucnibudzet.rominab24.com` kao Primary domain.
   - Postojeće rominab24.com / www.rominab24.com mogu ostati kao alternativne i preusmjeravati na novu primarnu.

6. **Provjeriti objavu i pristupnost**
   - Pričekati DNS propagaciju (do 72h, obično brže).
   - Testirati `https://kucnibudzet.rominab24.com` u pregledniku.

## Napomene
- Ako se kasnije želi postaviti email s te poddomene (npr. notify@kucnibudzet.rominab24.com), to je zaseban korak nakon što domena postane aktivna.
- Capacitor Android build ne mora se dirati osim ako je unutar configa hardkodiran web URL za preview.

Odobriš li ovaj plan? Prvi korak je objaviti projekt, a zatim ću ažurirati kod i voditi te kroz postavljanje domene.