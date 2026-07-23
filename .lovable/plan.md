Dodati objašnjenje u Pravila privatnosti o tome kako Google obrađuje slike računa i kako se koristi ocjenjivanje palac gore/dolje.

Plan:
1. U `src/pages/Privacy.tsx`, u sekciju 4 „Obrada pomoću umjetne inteligencije", dodati novi odlomak s napomenom:
   - Prema Googleovim uvjetima korištenja, Google ne koristi sadržaj poslan putem Gemini API-ja (fotografije računa) za treniranje svojih AI modela, osim ako korisnik izričito ne dopusti.
   - Ocjenjivanje palac gore/dolje (potvrda/ispravak kategorije) dozvoljeno je prema istim uvjetima i pohranjuje se u našu bazu isključivo radi poboljšanja kategorizacije u aplikaciji; ti se podaci ne šalju Googleu.
2. Ažurirati datum „Zadnja izmjena" na 24. srpnja 2026. kako odražava novi sadržaj.
3. Pokrenuti build/SEO provjeru kako bi se osiguralo da stranica i dalje ispravno renderira bez grešaka i da meta podaci budu u redu.

Izmjene su isključivo sadržajne i odnose se na postojeću stranicu Pravila privatnosti; ne diraju se druge stranice niti funkcionalnost aplikacije.