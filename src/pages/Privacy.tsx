import { SEO } from '@/components/SEO';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';

export default function Privacy() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Pravila privatnosti — Kućni Budžet';
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
    <>
      <SEO title="Pravila privatnosti — Kućni Budžet" description="Kako aplikacija Kućni Budžet obrađuje i štiti osobne podatke korisnika." path="/privacy" />
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Natrag">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="font-display text-xl font-medium">Pravila privatnosti</h1>
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
            Aplikacija <strong>Kućni Budžet</strong> („aplikacija") služi za praćenje kućnih troškova i upravljanje osobnim budžetom. Ova pravila objašnjavaju koje podatke aplikacija prikuplja, zašto ih prikuplja, kako se obrađuju i koja su vaša prava.
          </p>
          <p>
            Voditelj obrade podataka: <strong>Romina Nikolić</strong>, kontakt:{' '}
            <a href="mailto:rominab24@gmail.com" className="text-primary hover:underline underline-offset-4">
              rominab24@gmail.com
            </a>
            .
          </p>
        </Section>

        <Section number={2} title="Podaci koje prikupljamo">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Podaci računa (registracija):</strong> adresa e-pošte i lozinka (lozinka se pohranjuje isključivo u šifriranom obliku).
            </li>
            <li>
              <strong>Financijski unosi:</strong> iznosi troškova, kategorije, datumi i nazivi trgovina koje sami unesete ili koji se očitaju s računa.
            </li>
            <li>
              <strong>Fotografije računa:</strong> ako koristite funkciju skeniranja, fotografija računa privremeno se obrađuje radi automatskog očitavanja iznosa, datuma i kategorije.
            </li>
          </ul>
          <div className="bg-primary/10 border-l-4 border-primary rounded-r-xl p-4 text-sm text-foreground/80">
            Aplikacija <strong>ne prikuplja</strong>: lokaciju, kontakte, poruke niti bilo koje druge podatke s vašeg uređaja. Aplikacija ne prikazuje oglase i ne koristi alate za praćenje (trackere) trećih strana.
          </div>
        </Section>

        <Section number={3} title="Kako koristimo kameru">
          <p>
            Pristup kameri koristi se isključivo kada sami pokrenete skeniranje računa. Fotografije se ne snimaju u pozadini i ne koriste se ni u koju drugu svrhu.
          </p>
        </Section>

        <Section number={4} title="Obrada pomoću umjetne inteligencije">
          <p>
            Fotografija računa šalje se sigurnom vezom (HTTPS) na obradu AI servisu radi automatskog prepoznavanja podataka s računa (naziv trgovine, iznos, datum, kategorija). Rezultat se sprema u vaš osobni budžet, a fotografija se ne koristi za druge svrhe.
          </p>
        </Section>

        <Section number={5} title="Gdje se podaci pohranjuju">
          <p>
            Podaci se pohranjuju na backend infrastrukturi koja koristi Supabase tehnologiju (hosting unutar EU/EEA u skladu s GDPR-om), zaštićeni pravilima pristupa na razini retka (Row Level Security) — svaki korisnik ima pristup isključivo vlastitim podacima.
          </p>
          <p>Prijenos podataka između aplikacije i poslužitelja uvijek je šifriran (HTTPS/TLS).</p>
        </Section>

        <Section number={6} title="Dijeljenje podataka">
          <p>
            Vaše podatke <strong>ne prodajemo i ne dijelimo</strong> s trećim stranama u marketinške svrhe. Podaci se obrađuju samo kroz servise nužne za rad aplikacije (backend infrastruktura i AI servis za očitavanje računa), koji djeluju kao izvršitelji obrade.
          </p>
        </Section>

        <Section number={7} title="Koliko dugo čuvamo podatke">
          <p>Podaci se čuvaju dok god imate korisnički račun. Brisanjem računa trajno se brišu svi vaši podaci.</p>
        </Section>

        <Section number={8} title="Vaša prava (GDPR)">
          <p>U skladu s Općom uredbom o zaštiti podataka (GDPR) imate pravo na:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>pristup svojim podacima i njihovu kopiju,</li>
            <li>ispravak netočnih podataka,</li>
            <li>brisanje podataka („pravo na zaborav"),</li>
            <li>ograničenje ili prigovor na obradu,</li>
            <li>prenosivost podataka.</li>
          </ul>
          <p>
            Za ostvarivanje bilo kojeg prava javite se na{' '}
            <a href="mailto:rominab24@gmail.com" className="text-primary hover:underline underline-offset-4">
              rominab24@gmail.com
            </a>
            . Imate pravo i na pritužbu Agenciji za zaštitu osobnih podataka (AZOP),{' '}
            <a href="https://azop.hr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline underline-offset-4">
              azop.hr
            </a>
            .
          </p>
        </Section>

        <Section number={9} title="Djeca">
          <p>Aplikacija nije namijenjena djeci mlađoj od 13 godina i svjesno ne prikuplja njihove podatke.</p>
        </Section>

        <Section number={10} title="Izmjene pravila">
          <p>Ova pravila možemo povremeno ažurirati. Nova verzija bit će objavljena na ovoj stranici s naznačenim datumom zadnje izmjene.</p>
        </Section>

        <Section number={11} title="Brisanje računa">
          <p>
            Korisnički račun možete izbrisati iz aplikacije. Brisanjem računa uklanjaju se svi osobni podaci, financijski unosi i fotografije računa iz baze podataka. Podaci se nakon brisanja ne zadržavaju niti ih možemo obnoviti.
          </p>
          <p>
            Za pomoć pri brisanju računa ili za kopiju vlastitih podataka kontaktirajte nas na{' '}
            <a href="mailto:rominab24@gmail.com" className="text-primary hover:underline underline-offset-4">
              rominab24@gmail.com
            </a>
            .
          </p>
        </Section>

        <div className="bg-muted/50 border border-border rounded-2xl p-5 text-sm text-muted-foreground">
          <p>
            Ova stranica je održavana od strane vlasnika aplikacije Kućni Budžet kako bi odgovorila na uobičajena pitanja o privatnosti. Ako imate dodatnih pitanja, pišite na{' '}
            <a href="mailto:rominab24@gmail.com" className="text-primary hover:underline underline-offset-4">
              rominab24@gmail.com
            </a>
            .
          </p>
        </div>
      </main>
    </div>
    </>
  );
}
