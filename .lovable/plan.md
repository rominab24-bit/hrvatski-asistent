
# Čarobnjak za preporuku pretplate

Dodajemo mali interaktivni čarobnjak u **Postavke** koji na temelju očekivanog broja korisnika i prosječnog broja AI skeniranja mjesečno izračunava:
- ukupno očekivano skeniranja/mjesec (uz poštivanje globalnog limita 250/mj),
- procijenjeni trošak u Lovable kreditima,
- preporučeni Lovable plan (Pro tier ili Business),
- poveznicu na Lovable pricing i Settings → Plans & credits.

## Korisničko iskustvo

Novi gumb "Kalkulator pretplate" u `src/pages/Settings.tsx` otvara `Dialog` s 3 koraka (koristimo postojeći `Dialog` iz shadcn-a, bez novih zavisnosti):

1. **Broj korisnika** — slider/Input 1–1000.
2. **Prosjek skeniranja po korisniku mjesečno** — slider 0–250 (uz napomenu da globalni limit 250 vrijedi za cijelu aplikaciju).
3. **Rezultat** — kartica s:
   - Ukupno skeniranja/mj = `min(korisnici × prosjek, 250)` (globalni cap)
   - Procijenjeni trošak: `skeniranja × 0.01` kredita (+ mala rezerva ~20% za ostale Cloud/edge troškove)
   - Preporuka plana:
     - ≤ ~80 kredita/mj → **Pro 100**
     - ≤ ~200 → **Pro 250**
     - ≤ ~400 → **Pro 500**
     - ≤ ~800 → **Business 1000**
     - > 800 → **Business 2000+ ili Enterprise**
   - Kratko objašnjenje ("Ova procjena uključuje samo AI skeniranje računa; stvarni trošak može varirati zbog ostalih operacija.")
   - Dva linka: [Pogledaj sve planove](https://lovable.dev/pricing) i uputa "Otvori Settings → Plans & credits u Lovable workspace-u za odabir plana."

## Tehnički detalji

- Nova komponenta `src/components/SubscriptionWizard.tsx` — čisti frontend, bez API poziva.
- Konstante:
  ```ts
  const CREDITS_PER_SCAN = 0.01;
  const GLOBAL_MONTHLY_SCAN_LIMIT = 250;
  const OVERHEAD_MULTIPLIER = 1.2;
  ```
- Funkcija `recommendPlan(credits: number)` vraća `{ name, credits, url }`.
- Integracija u `src/pages/Settings.tsx`: nova `Card` iznad "Opasna zona" s gumbom koji otvara `SubscriptionWizard`.
- Sve na hrvatskom, u skladu s postojećim Organic Sage stilom (koristi postojeće shadcn komponente: `Dialog`, `Slider`, `Button`, `Card`).

## Što se NE mijenja

- Nema promjena u bazi, edge funkcijama ili logici skeniranja.
- Nema stvarnog dohvata trenutnih kredita iz Lovable API-ja (nije dostupno iz aplikacijskog runtime-a) — samo procjena.
