import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';

export default function Terms() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Uvjeti korištenja — Kućni Budžet';
  }, []);

  const Section = ({ number, title, children }: { number: number; title: string; children: React.ReactNode }) => (
    <section className="bg-card border border-border rounded-3xl p-6 shadow-sm">
      <h2 className="font-display text-xl font-medium text-foreground mb-4">
        <span className="text-primary font-semibold mr-2">{number}.</span>
        {title}
      </h2>
      <div className="space-y-3 text-foreground/90 leading-relaxed">{children}</div>
    </section>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Natrag">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h1 className="font-display text-xl font-medium">Uvjeti korištenja</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <div className="text-center mb-6">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary border border-primary/20 rounded-full px-4 py-1 mb-4">
            Kućni Budžet
          </span>
          <p className="text-sm text-muted-foreground">Zadnja izmjena: 19. srpnja 2026.</p>
        </div>

        <Section number={1} title="Uvod">
          <p>
            Ovi uvjeti korištenja reguliraju korištenje mobilne i web aplikacije <strong>Kućni Budžet</strong> (u daljnjem tekstu: „aplikacija"). Aplikaciju je razvila i vlasnik je <strong>Romina Nikolić</strong>, kontakt:{' '}
            <a href="mailto:rominab24@gmail.com" className="text-primary hover:underline underline-offset-4">
              rominab24@gmail.com
            </a>
            .
          </p>
          <p>
            Preuzimanjem, instaliranjem ili korištenjem aplikacije prihvaćate ove uvjete. Ako se ne slažete s uvjetima, nemojte koristiti aplikaciju.
          </p>
        </Section>

        <Section number={2} title="Dopuštena upotreba">
          <p>Aplikacija je namijenjena isključivo za osobnu upotrebu i praćenje vlastitih kućnih troškova.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Ne smijete koristiti aplikaciju za bilo kakve nezakonite aktivnosti.</li>
            <li>Ne smijete pokušavati ugroziti sigurnost, funkcionalnost ili dostupnost aplikacije.</li>
            <li>Ne smijete koristiti aplikaciju na način koji bi oštetio treće strane ili narušio njihova prava.</li>
          </ul>
        </Section>

        <Section number={3} title="Korisnički račun">
          <p>
            Za korištenje nekih funkcija aplikacije potrebno je kreirati korisnički račun. Vi ste odgovorni za čuvanje svoje lozinke i za sve aktivnosti koje se dogode pod vašim računom.
          </p>
          <p>
            Obvezujete se da ćete unositi točne podatke te da nećete dijeliti pristupne podatke trećim osobama. Ako sumnjate u neovlašteni pristup, obavijestite nas odmah.
          </p>
        </Section>

        <Section number={4} title="Sadržaj i podaci korisnika">
          <p>
            Svi financijski unosi, fotografije računa i ostali podaci koje unesete u aplikaciju pripadaju vama. Dajete nam dopuštenje da te podatke pohranjujemo i obrađujemo isključivo radi pružanja usluga aplikacije, u skladu s našim Pravilima privatnosti.
          </p>
          <p>
            Vi snosite odgovornost za točnost i zakonitost podataka koje unosite. Aplikacija ne pregledava niti potvrđuje točnost financijskih podataka koje korisnici unose ručno ili putem skeniranja računa.
          </p>
        </Section>

        <Section number={5} title="Intelektualno vlasništvo">
          <p>
            Sva prava intelektualnog vlasništva povezana s aplikacijom — uključujući dizajn, kôd, tekstove, logotipe i grafičke elemente — pripadaju vlasniku aplikacije. Nije dopušteno kopirati, modificirati, distribuirati ili koristiti te materijale bez prethodnog pisanog dopuštenja.
          </p>
        </Section>

        <Section number={6} title="Ograničenje odgovornosti">
          <p>
            Aplikacija je pomoćno računalo za praćenje troškova i <strong>ne zamjenjuje financijski, računovodstveni ili pravni savjet</strong>. Vlasnik aplikacije ne odgovara za eventualne pogreške u podacima, gubitke podataka ili štetu nastalu korištenjem aplikacije.
          </p>
          <p>
            Korisnik je sam odgovoran za redovito spremanje i sigurnosno kopiranje vlastitih podataka, ako to želi učiniti izvan aplikacije.
          </p>
        </Section>

        <Section number={7} title="Izmjene uvjeta">
          <p>
            Ove uvjete možemo povremeno ažurirati. O značajnim izmjenama možemo obavijestiti korisnike unutar aplikacije ili putem e-pošte. Nastavak korištenja aplikacije nakon izmjena znači prihvaćanje novih uvjeta.
          </p>
        </Section>

        <Section number={8} title="Prekid korištenja i brisanje računa">
          <p>
            Zadržavamo pravo ograničiti ili onemogućiti pristup aplikaciji korisnicima koji krše ove uvjete. Korisnik u svakom trenutku može izbrisati svoj račun unutar aplikacije, čime se uklanjaju svi povezani podaci.
          </p>
        </Section>

        <Section number={9} title="Kontakt i rješavanje sporova">
          <p>
            Za pitanja, pritužbe ili zahtjeve vezane uz uvjete korištenja kontaktirajte nas na{' '}
            <a href="mailto:rominab24@gmail.com" className="text-primary hover:underline underline-offset-4">
              rominab24@gmail.com
            </a>
            .
          </p>
          <p>
            Ovi uvjeti uređeni su prema zakonodavstvu Republike Hrvatske. Svi sporovi rješavaju se mirnim putem, a u slučaju nemogućnosti dogovora nadležan je sud u Republici Hrvatskoj.
          </p>
        </Section>

        <div className="bg-muted/50 border border-border rounded-2xl p-5 text-sm text-muted-foreground">
          <p>
            Ova stranica je održavana od strane vlasnika aplikacije Kućni Budžet. Ako imate dodatnih pitanja, pišite na{' '}
            <a href="mailto:rominab24@gmail.com" className="text-primary hover:underline underline-offset-4">
              rominab24@gmail.com
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
