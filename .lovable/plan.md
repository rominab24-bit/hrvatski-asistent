Budući da ne planirate dodavati analitiku, oglašavanje niti praćenje trećih strana, zasebna stranica "Politika kolačića" nije potrebna. Dovoljno je dodati odjeljak u postojeća Pravila privatnosti, bez cookie bannera.

### Plan

1. **Novi odjeljak u Pravilima privatnosti**
   - U `src/pages/Privacy.tsx` dodati sekciju **13. Kolačići (cookies)** nakon postojeće sekcije 12 (Brisanje računa).
   - Sadržaj će objasniti:
     - Što su kolačići i zašto se koriste.
     - Koje kolačiće aplikacija koristi: isključivo funkcionalni kolačić za zapamćivanje stanja bočne trake (`sidebar:state`), trajanje 7 dana.
     - Aplikacija **ne koristi** kolačiće za analitiku, oglašavanje, praćenje ni profiliranje.
     - Aplikacija **ne koristi** kolačiće trećih strana.
     - Korisnik može u bilo kojem trenutku obrisati kolačiće putem postavki svog preglednika, što može utjecati na neka UI-pamćenja (npr. stanje trake), ali ne i na sigurnost financijskih podataka.
     - Naglasiti da se prijavna sesija čuva u sigurnom lokalnom spremištu preglednika (localStorage), a ne kao kolačić.

2. **Ažuriranje datume zadnje izmjene**
   - Promijeniti datum "Zadnja izmjena" na vrh `Privacy.tsx` na trenutni datum (23. srpnja 2026.) zbog dodanog sadržaja.

3. **Provjera**
   - Pokrenuti `npm run build` (odnosno `vite build`) kako bi se potvrdilo da izmjena ne lomi build.

### Što se neće raditi
- Neće se dodavati zasebna ruta `/cookies`.
- Neće se dodavati cookie banner niti mehanizam pristanka.
- Neće se dodavati analitika ili treći kolačići.