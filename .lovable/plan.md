# Plan: Dodavanje pravila privatnosti i uvjeta korištenja

## Cilj
Dodati dvije javne stranice u aplikaciju:
- `/privacy` — Pravila privatnosti
- `/terms` — Uvjeti korištenja

Stranice će pratiti postojeći „Organic Sage“ dizajn, biti dostupne bez prijave, i imati poveznice s ekrana za prijavu/registraciju.

## Zašto je važno za Google Play
Google Play zahtijeva URL pravila privatnosti za aplikacije koje prikupljaju osobne podatke — ova aplikacija prikuplja email adresu, lozinku, financijske unose i fotografije računa. Uvjeti korištenja nisu uvijek obavezni, ali su preporučeni za registraciju korisnika. Nakon objave, URL-ovi će biti javno dostupni i moći ćete ih unijeti u Google Play Console.

## Koraci

1. **Kreirati `src/pages/Privacy.tsx`**
   - Prikazati sadržaj iz uploadane HTML datoteke `pravila-privatnosti-3.html`.
   - Zamijeniti placeholder kontakt podatke s: **Romina Nikolić**, **rominab24@gmail.com**.
   - Dodati sekciju o brisanju korisničkog računa i pripadajućih podataka.
   - Koristiti postojeći dizajn aplikacije: `bg-background`, `text-foreground`, `card`, `font-display`, `rounded-3xl` itd.
   - Na dnu dodati napomenu da je stranica održavana od strane vlasnika aplikacije i da nije pravni savjet.

2. **Kreirati `src/pages/Terms.tsx`**
   - Uvjeti korištenja na hrvatskom: prihvatljiva upotreba, odgovornost korisnika, intelektualno vlasništvo, izmjene uvjeta, kontakt i rješavanje sporova.
   - Isti vizualni identitet kao stranica Pravila privatnosti.

3. **Registrirati rute u `src/App.tsx`**
   - Dodati `<Route path="/privacy" element={<Privacy />} />`.
   - Dodati `<Route path="/terms" element={<Terms />} />`.
   - Rute su javne — bez zahtjeva za prijavu.

4. **Dodati poveznice u `src/components/AuthForm.tsx`**
   - Ispod gumba za registraciju dodati tekst: „Registrirajući se prihvaćate Uvjete korištenja i Pravila privatnosti."
   - Riječi „Uvjeti korištenja" i „Pravila privatnosti" bit će linkovi na `/terms` i `/privacy`.
   - Linkovi otvaraju stranicu unutar aplikacije, a ne u vanjskom pregledniku.

5. **Dodati poveznice u `src/pages/Dashboard.tsx`**
   - Dodati diskretan footer na dnu glavnog sadržaja s linkovima: „Pravila privatnosti · Uvjeti korištenja".
   - Link vodi na `/privacy` i `/terms`.

6. **SEO / meta**
   - Postaviti `document.title` unutar svake komponente: „Pravila privatnosti — Kućni Budžet" i „Uvjeti korištenja — Kućni Budžet".
   - Koristiti semantički HTML (`<main>`, `<section>`, `<h1>`, `<h2>`).

7. **Verifikacija**
   - Pokrenuti build (`npm run build` ili ekvivalent).
   - Testirati rute `/privacy` i `/terms` u pregledniku.
   - Provjeriti da linkovi iz `AuthForm` i `Dashboard` ispravno otvaraju stranice.
   - Potvrditi da stranice rade bez prijave (javna ruta).

## Napomena o objavi za Google Play
Da bi Google Play mogao vidjeti stranicu, aplikaciju je potrebno objaviti na javnoj domeni. Vaš projekt ima spojenu domenu `rominab24.com`, ali trenutno nije objavljen. Nakon objave, stranice će biti dostupne na:
- `https://rominab24.com/privacy`
- `https://rominab24.com/terms`

Ti URL-ovi se zatim unose u Google Play Console kod popunjavanja podataka o aplikaciji.