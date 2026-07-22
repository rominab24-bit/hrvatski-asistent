import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_CATEGORIES = [
  'Hrana',
  'Kafići i barovi',
  'Restorani',
  'Kućanstvo',
  'Higijena',
  'Prijevoz',
  'Zdravlje',
  'Zabava',
  'Odjeća',
  'Obrazovanje',
  'Računi',
  'Voda',
  'Struja',
  'Grijanje',
  'Stambena pričuva',
  'TV',
  'Smeće',
  'Komunalna naknada',
  'Kućni internet',
  'Kućni ljubimci',
  'Ostalo',
] as const;

type ReceiptItem = {
  name: string;
  quantity?: number;
  price: number;
  category: typeof ALLOWED_CATEGORIES[number];
};

const roundMoney = (value: number) => Math.round(value * 100) / 100;

/**
 * Uklanja osobne podatke iz teksta prije nego što se vrati klijentu ili spremi.
 * Cilj: ime i prezime kupca, kućna adresa, brojevi kartica, IBAN, OIB kupca,
 * email, telefon. Ostavlja naziv trgovine i stavke netaknutima ako ne sadrže
 * te uzorke.
 *
 * Test primjeri:
 *
 * 1) R1 račun s podacima kupca:
 * "R1-2025-0001234
 * Obrt Marko Marić
 * Kupac: Ana Horvat
 * Adresa: Ulica Ante Starčevića 12
 * 091/234-5678
 * Ukupno: 128,34 €"
 * Očekivano: naziv trgovine ("Obrt Marko Marić") ostaje; ime kupca, adresa i
 * telefon se zamjenjuju s [uklonjeno].
 *
 * 2) Običan račun s administrativnim brojevima:
 * "Broj računa: 12/2025/456
 * Kasa: 12345678
 * JIR: 1234567890
 * ZKI: 1234567890
 * Ukupno: 45,60 €"
 * Očekivano: broj računa, kasa, JIR i ZKI ostaju netaknuti — nijedan nema
 * hrvatski telefonski prefiks, pa ga telefonska pravila ne uklanjaju.
 */
const PII_PLACEHOLDER = '[uklonjeno]';

/**
 * Detektira sadrži li tekst osobne podatke (kupac, adresa, kartica, IBAN, OIB,
 * email, HR telefonski broj). Koristi iste uzorke kao redactPII.
 * Vraća true ako je pronađen bilo koji PII trag.
 */
export type PIIType =
  | 'ime_kupca'
  | 'adresa'
  | 'postanski_broj'
  | 'iban'
  | 'kartica'
  | 'oib'
  | 'email'
  | 'telefon';

export const PII_LABELS: Record<PIIType, string> = {
  ime_kupca: 'ime i prezime kupca',
  adresa: 'kućna adresa',
  postanski_broj: 'poštanski broj i grad',
  iban: 'IBAN',
  kartica: 'broj kartice',
  oib: 'OIB / dugi brojčani niz',
  email: 'email adresa',
  telefon: 'telefonski broj',
};

const PII_PATTERNS: { type: PIIType; re: RegExp }[] = [
  { type: 'iban', re: /\b[A-Z]{2}\d{2}[\s-]?(?:\d[\s-]?){11,30}\b/ },
  { type: 'kartica', re: /\b(?:\d[\s-]?){13,19}\b/ },
  { type: 'oib', re: /\b\d{11,}\b/ },
  { type: 'email', re: /[\w.+-]+@[\w-]+\.[\w.-]+/i },
  { type: 'telefon', re: /(?<!\d)(?:\+385|00385|091|092|095|097|098|099|01|0[2-5]\d)(?:[\s\/-]*)(?:\d[\s\/-]?){5,8}\d/ },
  { type: 'adresa', re: /\b(?:Ulica|Ul\.?|Trg|Cesta|Put|Avenija|Aleja|Šetalište|Obala|Prilaz|Naselje)\s+[^\n,;]{2,60}?\s+\d+[a-zA-Z]?\b/i },
  { type: 'postanski_broj', re: /\b\d{5}\s+[A-ZŠĐČĆŽ][a-zšđčćž]+(?:\s+[A-ZŠĐČĆŽ][a-zšđčćž]+)?\b/ },
  { type: 'ime_kupca', re: /\b(Kupac|Naru[čc]itelj|Ime\s+i\s+prezime|Ime\/prezime|Platitelj|Korisnik|Primatelj|Klijent)\s*[:\-]\s*\S+/i },
];

const detectPIITypes = (input: unknown): PIIType[] => {
  if (input === undefined || input === null) return [];
  const text = String(input);
  const found: PIIType[] = [];
  for (const { type, re } of PII_PATTERNS) {
    if (re.test(text)) found.push(type);
  }
  return found;
};


const redactPII = (input: unknown): string => {
  if (input === undefined || input === null) return '';
  let text = String(input);


  // IBAN (HR + 19 znamenki, s ili bez razmaka)
  text = text.replace(/\b[A-Z]{2}\d{2}[\s-]?(?:\d[\s-]?){11,30}\b/g, PII_PLACEHOLDER);
  // Brojevi kartica (13-19 znamenki, dozvoljeni razmaci/crtice)
  text = text.replace(/\b(?:\d[\s-]?){13,19}\b/g, PII_PLACEHOLDER);
  // OIB / duži nizovi znamenki (11+)
  text = text.replace(/\b\d{11,}\b/g, PII_PLACEHOLDER);
  // Email
  text = text.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/gi, PII_PLACEHOLDER);
  // Telefonski brojevi — SAMO hrvatski formati:
  // +385, 00385, mobilni prefiksi 091/092/095/097/098/099, te fiksni 01/02x/03x/04x/05x
  text = text.replace(/(?<!\d)(?:\+385|00385|091|092|095|097|098|099|01|0[2-5]\d)(?:[\s\/-]*)(?:\d[\s\/-]?){5,8}\d/g, PII_PLACEHOLDER);
  // Kućna adresa: "Ulica/Ul./Trg/Cesta/Put/Avenija ... broj"
  text = text.replace(/\b(?:Ulica|Ul\.?|Trg|Cesta|Put|Avenija|Aleja|Šetalište|Obala|Prilaz|Naselje)\s+[^\n,;]{2,60}?\s+\d+[a-zA-Z]?\b/gi, PII_PLACEHOLDER);
  // Poštanski broj + grad (npr. 10000 Zagreb)
  text = text.replace(/\b\d{5}\s+[A-ZŠĐČĆŽ][a-zšđčćž]+(?:\s+[A-ZŠĐČĆŽ][a-zšđčćž]+)?\b/g, PII_PLACEHOLDER);
  // Ime i prezime kupca nakon oznaka tipa "Kupac:", "Naručitelj:", "Ime i prezime:", "Platitelj:", "Korisnik:", "Primatelj:"
  // Hvata do kraja retka ili sljedećeg separatora (,;|). NE dira naziv trgovine jer traži eksplicitnu oznaku.
  text = text.replace(
    /\b(Kupac|Naru[čc]itelj|Ime\s+i\s+prezime|Ime\/prezime|Platitelj|Korisnik|Primatelj|Klijent)\s*[:\-]\s*[^\n,;|]{2,80}/gi,
    `$1: ${PII_PLACEHOLDER}`,
  );

  return text.trim();
};

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const normalized = value.replace(',', '.').replace(/[^0-9.-]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const normalizeCategory = (category: unknown): typeof ALLOWED_CATEGORIES[number] => {
  const text = String(category || '').trim();
  const found = ALLOWED_CATEGORIES.find((allowed) => allowed.toLowerCase() === text.toLowerCase());
  return found || 'Ostalo';
};

const normalizeReceiptData = (receiptData: any) => {
  // Prije redakcije provjeri jesu li AI izvukli osobne podatke.
  const rawStore = receiptData?.store_name;
  const rawItems: any[] = Array.isArray(receiptData?.items) ? receiptData.items : [];
  const piiSet = new Set<PIIType>();
  for (const t of detectPIITypes(rawStore)) piiSet.add(t);
  for (const it of rawItems) for (const t of detectPIITypes(it?.name)) piiSet.add(t);
  const piiTypes = Array.from(piiSet);
  const containsPII = piiTypes.length > 0;

  const items: ReceiptItem[] = rawItems.map((item: any) => ({
    name: (redactPII(item?.name) || 'Nepoznata stavka'),
    quantity: item?.quantity === undefined ? undefined : toNumber(item.quantity),
    price: roundMoney(toNumber(item?.price)),
    category: normalizeCategory(item?.category),
  })).filter((item: ReceiptItem) => item.name && item.price > 0);

  const calculatedTotal = roundMoney(items.reduce((sum, item) => sum + item.price, 0));
  const aiTotal = roundMoney(toNumber(receiptData?.total_amount));
  const totalDifference = roundMoney(Math.abs(calculatedTotal - aiTotal));
  const needsReview = totalDifference > 0.05;

  const piiLabels = piiTypes.map((t) => PII_LABELS[t]);
  const piiMessage = containsPII
    ? `Na računu su prepoznati osobni podaci (${piiLabels.join(', ')}). Slika računa neće biti pohranjena radi zaštite privatnosti — spremit će se samo iznos, stavke i kategorije.`
    : undefined;

  return {
    ...receiptData,
    store_name: rawStore ? redactPII(rawStore) : rawStore,
    items,
    total_amount: aiTotal || calculatedTotal,
    calculated_total: calculatedTotal,
    total_difference: totalDifference,
    needs_review: needsReview,
    review_message: needsReview
      ? `Zbroj stavki (${calculatedTotal.toFixed(2)} €) razlikuje se od ukupnog iznosa računa (${aiTotal.toFixed(2)} €). Provjerite račun prije spremanja.`
      : undefined,
    contains_pii: containsPII,
    pii_types: piiTypes,
    pii_labels: piiLabels,
    pii_message: piiMessage,
  };

};


type FeedbackRow = {
  store_name: string | null;
  item_name: string;
  original_category: string | null;
  corrected_category: string;
  weight: number | null;
};

async function fetchUserFeedback(req: Request): Promise<FeedbackRow[]> {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return [];
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) return [];

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];

    // Klijent s korisnikovim tokenom — RLS automatski filtrira po auth.uid().
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data, error } = await client
      .from('category_feedback')
      .select('store_name, item_name, original_category, corrected_category, weight')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.warn('Ne mogu dohvatiti feedback:', error.message);
      return [];
    }
    return (data ?? []) as FeedbackRow[];
  } catch (e) {
    console.warn('fetchUserFeedback iznimka:', e);
    return [];
  }
}

/**
 * Težinski vote: za svaki ključ (trgovina|stavka) i (stavka) sumiraj težinu po
 * kategoriji, odaberi kategoriju s najvećom težinom. Zapisi s većom težinom
 * (npr. eksplicitna korisnička potvrda) jače utječu na ishod.
 */
function buildFeedbackHint(rows: FeedbackRow[]): string {
  if (!rows.length) return '';

  // key -> { itemDisplay, storeDisplay?, byCategory: { cat: totalWeight } }
  type Bucket = {
    itemDisplay: string;
    storeDisplay?: string;
    byCategory: Record<string, number>;
  };
  const storeItemBuckets = new Map<string, Bucket>();
  const itemBuckets = new Map<string, Bucket>();

  for (const row of rows) {
    const item = row.item_name?.trim();
    const corrected = row.corrected_category?.trim();
    if (!item || !corrected) continue;
    const weight = Math.max(1, Math.floor(row.weight ?? 1));

    const itemKey = item.toLowerCase();
    if (!itemBuckets.has(itemKey)) {
      itemBuckets.set(itemKey, { itemDisplay: item, byCategory: {} });
    }
    const ib = itemBuckets.get(itemKey)!;
    ib.byCategory[corrected] = (ib.byCategory[corrected] ?? 0) + weight;

    const store = row.store_name?.trim();
    if (store) {
      const key = `${store.toLowerCase()}|${itemKey}`;
      if (!storeItemBuckets.has(key)) {
        storeItemBuckets.set(key, { itemDisplay: item, storeDisplay: store, byCategory: {} });
      }
      const sb = storeItemBuckets.get(key)!;
      sb.byCategory[corrected] = (sb.byCategory[corrected] ?? 0) + weight;
    }
  }

  const pickWinner = (bucket: Bucket): { cat: string; weight: number } | null => {
    let best: { cat: string; weight: number } | null = null;
    for (const [cat, w] of Object.entries(bucket.byCategory)) {
      if (!best || w > best.weight) best = { cat, weight: w };
    }
    return best;
  };

  // Grupiraj po trgovini: [store] -> lista redaka
  const storeGroups = new Map<string, string[]>();
  for (const bucket of storeItemBuckets.values()) {
    const winner = pickWinner(bucket);
    if (!winner) continue;
    const store = bucket.storeDisplay!;
    const line = `"${bucket.itemDisplay}" → ${winner.cat} (težina ${winner.weight})`;
    if (!storeGroups.has(store)) storeGroups.set(store, []);
    storeGroups.get(store)!.push(line);
  }

  const storeBlocks: string[] = [];
  for (const [store, lines] of storeGroups) {
    storeBlocks.push(`- Trgovina/lokal "${store}":\n    ${lines.slice(0, 10).join('\n    ')}`);
  }

  const itemLines: string[] = [];
  for (const bucket of itemBuckets.values()) {
    const winner = pickWinner(bucket);
    if (!winner) continue;
    itemLines.push(`"${bucket.itemDisplay}" → ${winner.cat} (težina ${winner.weight})`);
  }
  // Sortiraj po težini pa uzmi top 25
  itemLines.sort((a, b) => {
    const wa = Number(a.match(/težina (\d+)/)?.[1] ?? 0);
    const wb = Number(b.match(/težina (\d+)/)?.[1] ?? 0);
    return wb - wa;
  });

  return `

VAŽNO — Prethodne korisničke ocjene kategorija (koristi ih kao jaku smjernicu):
Uz svaku smjernicu prikazana je težina — što je veća, to je korisnik čvršće potvrdio ili češće ispravljao tu kategoriju za tu stavku/lokal. Kad prepoznaš isti ili sličan izdavatelj/lokal ili istu/sličnu stavku, slijedi kategoriju s najvećom težinom umjesto svoje početne pretpostavke.

Po lokalima:
${storeBlocks.slice(0, 15).join('\n') || '(nema)'}

Po stavkama (bilo koji lokal):
${itemLines.slice(0, 25).join('; ') || '(nema)'}`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, imageUrl } = await req.json();
    
    if (!imageBase64 && !imageUrl) {
      throw new Error('Potrebna je slika računa (imageBase64 ili imageUrl)');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY nije konfiguriran');
    }

    // Globalni mjesečni limit AI skeniranja (svi korisnici zajedno).
    const MONTHLY_SCAN_LIMIT = 250;
    try {
      const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
      const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (SUPABASE_URL && SERVICE_KEY) {
        const usageRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_scan_usage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SERVICE_KEY,
            Authorization: `Bearer ${SERVICE_KEY}`,
          },
          body: JSON.stringify({ monthly_limit: MONTHLY_SCAN_LIMIT }),
        });
        if (usageRes.ok) {
          const usage = await usageRes.json();
          if (usage && usage.allowed === false) {
            console.warn('Mjesečni limit AI skeniranja dosegnut:', usage);
            return new Response(
              JSON.stringify({
                success: false,
                limit_reached: true,
                count: usage.count,
                limit: usage.limit,
                month: usage.month,
                error: `Dosegnut je mjesečni limit AI skeniranja (${usage.limit}/mjesec). Skeniranje će ponovno biti dostupno 1. u sljedećem mjesecu. Troškove možete i dalje unositi ručno.`,
              }),
              { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            );
          }
        } else {
          console.error('Ne mogu provjeriti limit skeniranja:', usageRes.status, await usageRes.text());
        }
      }
    } catch (limitErr) {
      // Ne blokiraj skeniranje ako sama provjera limita padne — samo logiraj.
      console.error('Greška pri provjeri limita skeniranja:', limitErr);
    }

    console.log('Analiziram račun s AI...');

    // Dohvati korisnikove prethodne ispravke kategorija i pripremi hint.
    const feedbackRows = await fetchUserFeedback(req);
    const feedbackHint = buildFeedbackHint(feedbackRows);
    if (feedbackHint) {
      console.log(`Injektiram ${feedbackRows.length} korisničkih ispravki kao kontekst.`);
    }

    // Prepare the image content for the AI
    const imageContent = imageBase64 
      ? { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
      : { type: "image_url", image_url: { url: imageUrl } };

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Ti si asistent za čitanje i analizu hrvatskih računa. Analiziraj sliku računa i izvuci sve stvarne stavke s računa.

ZAŠTITA PRIVATNOSTI — OBAVEZNO:
- NIKAD ne vraćaj osobne podatke kupca: ime, prezime, kućnu adresu, OIB kupca, broj osobne, broj kartice (kreditne/debitne), IBAN, PIN, CVV, email adresu, broj telefona ili mobitela, potpis, matični broj.
- Ako se takvi podaci pojavljuju na računu (npr. u zaglavlju "Kupac:", u dnu kod potpisa, ili u informacijama o plaćanju karticom), potpuno ih izostavi iz odgovora — ne stavljaj ih ni u naziv trgovine ni u nazive stavki ni bilo gdje drugdje.
- Ako naziv stavke slučajno sadrži takav podatak, zamijeni taj dio s "[uklonjeno]".
- Podaci o trgovini (naziv, adresa poslovnice, OIB tvrtke izdavatelja) NISU osobni podaci kupca i mogu se vratiti kao dio naziva trgovine.



Za svaku stavku pronađi:
- naziv proizvoda/usluge
- količinu (ako postoji)
- konačnu cijenu stavke u eurima

Također pronađi:
- naziv trgovine
- ukupan iznos računa
- datum računa (ako je vidljiv)

Važna pravila za cijene i zbroj:
- Nemoj izmišljati stavke koje nisu jasno vidljive.
- Ako račun ima popust, koristi konačnu cijenu koju kupac plaća za tu stavku.
- Pazi na hrvatski decimalni zarez, npr. 1,29 znači 1.29.
- Ne miješaj količinu, jediničnu cijenu i ukupnu cijenu retka.
- Ako nisi siguran u cijenu stavke, ipak vrati najbolju procjenu, ali nemoj prilagođavati stavke samo zato da zbroj izgleda savršeno.

Kategoriziraj stavke STROGO u jednu od ovih kategorija (koristi TOČNO ovaj naziv):
- "Hrana" - SAMO namirnice kupljene u trgovini/supermarketu (Konzum, Lidl, Plodine, Kaufland, Spar, Tommy, Studenac itd.): prehrambeni proizvodi, sirovo/pakirano meso, kruh, mlijeko, jaja, voće, povrće, tjestenina, riža, začini, slatkiši iz trgovine, pakirano piće, boca vode, boca soka, alkohol iz trgovine
- "Kafići i barovi" - konzumacija u kafiću, caffe baru, slastičarni, pubu, birtiji, disco baru: espresso, kava s mlijekom, macchiato, cappuccino, čaj, pivo (točeno ili u boci u kafiću), vino na čaši, koktel, sok/gazirano piće posluženo u kafiću, sladoled u kugli, kolač u slastičarni. Tipični izdavatelji: caffe bar, bar, pub, slastičarna, buffet.
- "Restorani" - jelo i piće posluženo u restoranu, konobi, pizzeriji, fast foodu, dostavi hrane: predjelo, glavno jelo, juha, salata, pizza, burger, ćevapi, riba, pomfrit, desert u restoranu, uz to i piće naručeno tijekom obroka. Tipični izdavatelji: restoran, konoba, pizzeria, gostionica, McDonald's, KFC, Submarine, Wolt/Glovo dostava.
- "Higijena" - SVI proizvodi za osobnu njegu i tijelo: šampon, regenerator, balzam za kosu, gel za tuširanje, sapun, tekući sapun, dezodorans, antiperspirant, pasta za zube, četkica za zube, zubni konac, vodica za usta, ulošci, tamponi, higijenski ulošci, vlažne maramice, toaletni papir, papirnati rupčići, britvice, brijač, pjena za brijanje, krema za tijelo, krema za lice, krema za ruke, losion, parfem, šminka, lak za nokte, maska za lice, gel za čišćenje lica, vata, štapići za uši, pelene, proizvodi za bebe (krema, šampon, kupka)
- "Kućanstvo" - SAMO sredstva za čišćenje DOMA i predmeta (NE tijela): deterdžent za rublje, omekšivač, deterdžent za posuđe, sredstvo za čišćenje (Cif, Domestos, Bref), sredstva za WC, spužve, krpe, vreće za smeće, papirnati ručnici za kuhinju, folije, alu-folije, svijeće, žarulje, baterije
- "Prijevoz" - gorivo, parking, javni prijevoz, cestarina
- "Zdravlje" - lijekovi, vitamini, dodaci prehrani, medicinski proizvodi, zavoji, flasteri, toplomjer
- "Zabava" - igračke, hobi, izlasci (ulaznice), kino, knjige za zabavu
- "Odjeća" - odjeća, obuća, modni dodaci, čarape
- "Obrazovanje" - školski pribor, udžbenici, tečajevi
- "Računi" - opće/obračunske rate, pretplate i troškovi koje ne možeš preciznije razvrstati u jednu od kategorija kućnih režija (npr. telefon, mobilna tarifa)
- "Voda" - račun za vodu, vodovod, kanalizacija, trošak vode
- "Struja" - račun za električnu energiju, struja, HEP, ELectro distribucija
- "Grijanje" - račun za grijanje, plin, toplana, centralno grijanje, pelete, drva za grijanje
- "Stambena pričuva" - mjesečna stambena pričuva/pričuva zgrade, upravitelj zgrade, održavanje zajedničkih dijelova
- "TV" - TV pretplata, kabelska/satelitska televizija, RTL/HRT pristojba, streaming TV paketi
- "Smeće" - naknada za odvoz smeća, odvoz otpada, komunalno smeće
- "Komunalna naknada" - opća komunalna naknada (nekretnina/stan), naknada za čišćenje javnih površina, komunalni doprinos
- "Kućni internet" - račun za fiksni/kućni internet (ne mobilni), Wi-Fi, širokopojasni pristup
- "Kućni ljubimci" - SVE za pse, mačke i druge kućne ljubimce: hrana za mačke (Whiskas, Felix, Sheba, Gourmet, Purina One/Cat Chow, Friskies, Kitekat, Perfect Fit, Royal Canin, Hill's, mokra/suha hrana, konzerve, vrećice, pounches, "mačja hrana", "cat food"), hrana za pse (Pedigree, Chappi, Frolic, Bakers, Cesar, Rocco, Royal Canin, Hill's, "pseća hrana", "dog food"), poslastice/priboljšci za ljubimce, mačji pijesak/podloga (Catsan, Ever Clean), grickalice za pse, konzerve za ljubimce, oprema (uzice, ogrlice, zdjelice, kućice, transporteri, igračke za ljubimce), antiparaziti (Frontline, Advantix, Bravecto), veterinarski proizvodi. Trgovine specijalizirane za ljubimce: Pet Centar, Fressnapf, Zoo Plus, Zoomania.
- "Ostalo" - sve ostalo

KLJUČNO PRAVILO za razlikovanje "Hrana" vs "Kafići i barovi" vs "Restorani":
- Ako je račun iz TRGOVINE/SUPERMARKETA (Konzum, Lidl, Plodine, Kaufland, Spar, Tommy, Studenac, Metro, Interspar, Ribola, KTC, DM, Bipa, Müller) → hrana i piće idu u "Hrana"
- Ako je račun iz KAFIĆA/CAFFE BARA/SLASTIČARNE/PUBA → sve stavke (kava, pića, kolači, sladoled) idu u "Kafići i barovi", čak i ako se pojedinačno zovu "kava" ili "sok"
- Ako je račun iz RESTORANA/KONOBE/PIZZERIJE/FAST FOODA/DOSTAVE HRANE → sve stavke (hrana i piće posluženo uz obrok) idu u "Restorani"
- Prepoznaj tip lokala iz naziva izdavatelja na vrhu računa (npr. "Caffe bar Zagreb" → Kafići i barovi; "Restoran Dubrovnik" → Restorani; "Konzum d.d." → Hrana)
- Ako naziv trgovine nije jasan, koristi kontekst stavki: mali broj stavki tipa espresso/pivo/kava → kafić; jela s prilogom, pizza, burger → restoran; velik popis raznih namirnica → trgovina/Hrana

KLJUČNO PRAVILO za razlikovanje Higijene i Kućanstva:
- Ako proizvod ide NA TIJELO (kožu, kosu, zube, intimu) → "Higijena"
- Ako proizvod čisti PREDMETE ili PROSTOR (pod, posuđe, rublje, WC) → "Kućanstvo"
- Toaletni papir, vlažni toaletni papir, ulošci, pelene → uvijek "Higijena"
- Papirnati ručnici za kuhinju → "Kućanstvo"

Odgovori ISKLJUČIVO u JSON formatu bez dodatnog teksta.${feedbackHint}`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analiziraj ovaj račun i izvuci sve stavke s cijenama. Odgovori u JSON formatu.' },
              imageContent
            ]
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_receipt_data',
              description: 'Izvlači podatke s računa',
              parameters: {
                type: 'object',
                properties: {
                  store_name: { type: 'string', description: 'Naziv trgovine' },
                  date: { type: 'string', description: 'Datum računa (DD.MM.YYYY format)' },
                  date_confidence: { 
                    type: 'string', 
                    enum: ['high', 'medium', 'low'],
                    description: 'Sigurnost prepoznavanja datuma: high ako je datum jasno vidljiv, medium ako je djelomično vidljiv ili nečitak, low ako nije pronađen ili je nejasan'
                  },
                  total_amount: { type: 'number', description: 'Ukupan iznos računa' },
                  currency: { type: 'string', description: 'Valuta (EUR, HRK, itd.)' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string', description: 'Naziv proizvoda' },
                        quantity: { type: 'number', description: 'Količina' },
                        price: { type: 'number', description: 'Konačna cijena stavke u eurima' },
                        category: { 
                          type: 'string', 
                          enum: ['Hrana', 'Kafići i barovi', 'Restorani', 'Kućanstvo', 'Higijena', 'Prijevoz', 'Zdravlje', 'Zabava', 'Odjeća', 'Obrazovanje', 'Računi', 'Voda', 'Struja', 'Grijanje', 'Stambena pričuva', 'TV', 'Smeće', 'Komunalna naknada', 'Kućni internet', 'Kućni ljubimci', 'Ostalo'],
                          description: 'Kategorija proizvoda'
                        }
                      },
                      required: ['name', 'price', 'category']
                    }
                  }
                },
                required: ['items', 'total_amount', 'date_confidence']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_receipt_data' } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Prekoračeno ograničenje zahtjeva. Pokušajte ponovno za nekoliko sekundi.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Potrebno je dodati kredite. Posjetite postavke za više informacija.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI greška: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI odgovor primljen');

    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'extract_receipt_data') {
      throw new Error('AI nije vratio očekivani format podataka');
    }

    const receiptData = normalizeReceiptData(JSON.parse(toolCall.function.arguments));
    console.log('Uspješno izvučeni podaci s računa:', receiptData);

    return new Response(
      JSON.stringify({ success: true, data: receiptData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Greška pri skeniranju računa:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Nepoznata greška' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
