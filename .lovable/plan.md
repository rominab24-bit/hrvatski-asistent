# Kalkulator pretplate vidljiv samo vlasniku

Kalkulator pretplate ostaje netaknut, ali se u Postavkama prikazuje samo kad je prijavljen vlasnik (`rominab24@gmail.com`). Svi ostali korisnici i dalje vide indikator globalnog limita skeniranja (Used X / 250) u skeneru — to ne dirama.

## Izmjene

1. **`src/lib/owner.ts`** (novo)
   - Konstanta `OWNER_EMAILS = ['rominab24@gmail.com']` (niz da lako dodam još kasnije).
   - Helper `isOwner(user)` koji case-insensitive uspoređuje `user.email`.

2. **`src/pages/Settings.tsx`**
   - Importa `isOwner` i koristi `useAuth()` (već je tu).
   - Cijelu `Card` sekciju "Kalkulator pretplate" (uklj. `<SubscriptionWizard />`) renderiraj samo ako `isOwner(user)`.

## Što se NE mijenja

- `SubscriptionWizard.tsx` ostaje isti.
- Indikator limita skeniranja i logika 250/mj ostaju za sve korisnike.
- Nema promjena u bazi, RLS-u ili edge funkcijama — provjera je čisto UI (kalkulator ne otkriva osjetljive podatke, samo lokalnu procjenu).

## Napomena

Ako se kasnije pridruži još vlasnika, samo dopišem email u `OWNER_EMAILS`. Za jaču kontrolu (npr. skrivanje osjetljivih admin akcija) preporučam kasnije uvesti pravi `user_roles` sustav s `has_role()` u bazi, ali za ovaj kalkulator to nije potrebno.
