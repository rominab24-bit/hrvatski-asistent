import { SEO } from '@/components/SEO';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, FileDown, FileText as FileTextIcon } from 'lucide-react';
import { exportToPdf, exportToDocx } from '@/lib/documentExport';
import { toast } from 'sonner';

export default function Privacy() {
  const navigate = useNavigate();
  const contentRef = useRef<HTMLElement>(null);
  const [downloading, setDownloading] = useState<null | 'pdf' | 'docx'>(null);

  useEffect(() => {
    document.title = 'Pravila privatnosti — Kućni Budžet';
  }, []);

  const handleDownload = async (kind: 'pdf' | 'docx') => {
    if (!contentRef.current) return;
    try {
      setDownloading(kind);
      const title = 'Pravila privatnosti — Kućni Budžet';
      if (kind === 'pdf') await exportToPdf(contentRef.current, title, 'pravila-privatnosti.pdf');
      else await exportToDocx(contentRef.current, title, 'pravila-privatnosti.docx');
    } catch (e) {
      console.error(e);
      toast.error('Preuzimanje nije uspjelo');
    } finally {
      setDownloading(null);
    }
  };

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
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Shield className="w-5 h-5 text-primary shrink-0" />
            <h1 className="font-display text-xl font-medium truncate">Pravila privatnosti</h1>
          </div>
        </div>
      </header>

      <main ref={contentRef} className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <div className="text-center mb-6">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary border border-primary/20 rounded-full px-4 py-1 mb-4">
            Kućni Budžet
          </span>
          <p className="text-sm text-muted-foreground">Zadnja izmjena: 23. srpnja 2026.</p>
          <div className="flex items-center justify-center gap-2 mt-4 print:hidden">
            <Button variant="outline" size="sm" onClick={() => handleDownload('pdf')} disabled={downloading !== null}>
              <FileDown className="w-4 h-4 mr-2" />
              {downloading === 'pdf' ? 'Preuzimanje…' : 'Preuzmi PDF'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleDownload('docx')} disabled={downloading !== null}>
              <FileTextIcon className="w-4 h-4 mr-2" />
              {downloading === 'docx' ? 'Preuzimanje…' : 'Preuzmi DOCX'}
            </Button>
          </div>
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
              <strong>Financijski unosi:</strong> iznosi troškova, kategorije, datumi i nazivi trgovina koje sami unesete ili koji se očitaju sa skeniranog računa.
            </li>
            <li>
              <strong>Ocjene kategorizacije (opcionalno):</strong> ako ocijenite je li AI točno prepoznao kategoriju, sprema se povratna informacija koja pomaže poboljšati buduće prepoznavanje.
            </li>
            <li>
              <strong>Statistika korištenja:</strong> broj skeniranih računa u tekućem mjesecu (radi mjesečnog limita od 250 skeniranja).
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
            <strong>Svrha obrade:</strong> umjetna inteligencija koristi se isključivo za analizu i kategorizaciju unesenih troškova te za automatsko prepoznavanje podataka s fotografija računa (naziv trgovine, iznos, datum, stavke i kategorija). AI se ne koristi u nikakve druge svrhe.
          </p>
          <p>
            <strong>Treća strana (sub-processor):</strong> za tu obradu koristimo Google Cloud API uslugu (Google Gemini AI servis). Fotografija računa šalje se sigurnom vezom (HTTPS) na Googleovu infrastrukturu, obrađuje se putem plaćenog API sučelja, a rezultati se vraćaju u aplikaciju.
          </p>
          <p>
            <strong>Isključenje iz treniranja:</strong> vaši financijski podaci i unosi obrađuju se putem plaćenog API sučelja te se ne koriste za treniranje, razvoj ili poboljšanje AI modela od strane Googlea ili bilo koje treće strane. Prema Googleovim uvjetima korištenja, Google ne koristi sadržaj poslan putem Gemini API-ja (uključujući fotografije računa) za treniranje svojih modela, osim ako izričito ne dopustite.
          </p>
          <p>
            <strong>Zadržavanje podataka:</strong> fotografija računa obrađuje se samo privremeno tijekom skeniranja i <strong>ne pohranjuje</strong> — nakon što se očitani podaci vrate u aplikaciju, slika se odbacuje. U vašem budžetu spremaju se isključivo strukturirani podaci koje sami potvrdite (iznos, datum, kategorija, stavke), a ti se podaci čuvaju dok imate korisnički račun.
          </p>
          <p>
            <strong>Automatsko uklanjanje osobnih podataka:</strong> ako AI na računu prepozna osjetljive podatke (ime, prezime, adresa, brojevi kartica i sl.), oni se automatski uklanjaju prije nego što se rezultat spremi u vaš budžet.
          </p>
          <p>
            <strong>Ocjenjivanje kategorizacije:</strong> vaša ocjena kategorije palac gore/dolje dozvoljena je prema Googleovim uvjetima korištenja i pohranjuje se isključivo u našoj bazi radi poboljšanja kategorizacije unutar aplikacije; ti se podaci ne šalju Googleu.
          </p>
        </Section>

        <Section number={5} title="Gdje se podaci pohranjuju">
          <p>
            Podaci se pohranjuju na sigurnoj cloud infrastrukturi (hosting unutar EU/EEA u skladu s GDPR-om), zaštićeni pravilima pristupa na razini retka (Row Level Security) — svaki korisnik ima pristup isključivo vlastitim podacima.
          </p>
          <p>Prijenos podataka između aplikacije i poslužitelja uvijek je šifriran (HTTPS/TLS).</p>
        </Section>

        <Section number={6} title="Dijeljenje podataka">
          <p>
            Vaše podatke <strong>ne prodajemo i ne dijelimo</strong> s trećim stranama u marketinške svrhe. Podaci se obrađuju samo kroz servise nužne za rad aplikacije (backend infrastruktura i Google Gemini AI servis za očitavanje računa), koji djeluju kao izvršitelji obrade.
          </p>
        </Section>

        <Section number={7} title="Pristup vlasnika aplikacije (administracija)">
          <p>
            Vlasnica aplikacije ima administracijski pregled isključivo u svrhu održavanja usluge. Taj pregled uključuje <strong>samo</strong>:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>ukupan broj registriranih i aktivnih korisnika,</li>
            <li>broj AI skeniranja po korisniku (radi mjesečnog limita),</li>
            <li>status računa (aktivan, blokiran, potvrđen e-mail).</li>
          </ul>
          <p>
            Vlasnica <strong>nema uvid</strong> u vaše financijske podatke — iznose troškova, kategorije, nazive trgovina, stavke računa niti bilo koji drugi sadržaj koji unesete u aplikaciju. Ti podaci su privatni i vidljivi isključivo vama.
          </p>
        </Section>

        <Section number={8} title="Koliko dugo čuvamo podatke">
          <p>Podaci se čuvaju dok god imate korisnički račun. Brisanjem računa trajno se brišu svi vaši podaci.</p>
        </Section>

        <Section number={9} title="Vaša prava (GDPR)">
          <p>U skladu s Općom uredbom o zaštiti podataka (GDPR) imate pravo na:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>pristup svojim podacima i njihovu kopiju (izvoz u CSV/PDF dostupan je u Postavkama),</li>
            <li>ispravak netočnih podataka,</li>
            <li>brisanje podataka („pravo na zaborav") — dostupno unutar Postavki,</li>
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

        <Section number={10} title="Djeca">
          <p>Aplikacija nije namijenjena djeci mlađoj od 13 godina i svjesno ne prikuplja njihove podatke.</p>
        </Section>

        <Section number={11} title="Izmjene pravila">
          <p>Ova pravila možemo povremeno ažurirati. Nova verzija bit će objavljena na ovoj stranici s naznačenim datumom zadnje izmjene.</p>
        </Section>

        <Section number={12} title="Brisanje računa">
          <p>
            Korisnički račun možete izbrisati izravno unutar aplikacije (Postavke → Opasna zona). Brisanjem računa trajno se uklanjaju svi osobni podaci, financijski unosi i sve povezane evidencije iz baze podataka. Podaci se nakon brisanja ne zadržavaju niti ih možemo obnoviti.
          </p>
          <p>
            Za pomoć pri brisanju računa ili za kopiju vlastitih podataka kontaktirajte nas na{' '}
            <a href="mailto:rominab24@gmail.com" className="text-primary hover:underline underline-offset-4">
              rominab24@gmail.com
            </a>
            .
          </p>
        </Section>

        <Section number={13} title="Kolačići (cookies)">
          <p>
            Kolačići su male tekstualne datoteke koje preglednik može pohraniti na vaš uređaj radi pravilnog rada određenih funkcija aplikacije.
          </p>
          <p>
            <strong>Kolačići koje koristimo:</strong>
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Funkcionalni kolačić:</strong> koristimo jedan kolačić (<code>sidebar:state</code>) koji pamti je li bočna traka otvorena ili zatvorena. Traje 7 dana i ne sadrži nikakve osobne ili financijske podatke.
            </li>
          </ul>
          <p>
            <strong>Kolačići koje ne koristimo:</strong> aplikacija ne postavlja kolačiće za analitiku, oglašavanje, praćenje ponašanja, profiliranje ni bilo kakvu svrhu trećih strana. Ne koristimo alate poput Google Analytics, Facebook Pixel, Hotjar i sl.
          </p>
          <p>
            <strong>Prijavna sesija:</strong> podaci o vašoj prijavi čuvaju se u sigurnom lokalnom spremištu preglednika (localStorage), a ne kao kolačić.
          </p>
          <p>
            Kolačiće možete u bilo kojem trenutku obrisati ili onemogućiti u postavkama svog preglednika. Uklanjanjem kolačića možete resetirati neka UI-pamćenja (npr. stanje bočne trake), ali nećete utjecati na sigurnost svojih financijskih podataka.
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
