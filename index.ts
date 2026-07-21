import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Zadane kategorije (fallback ako dohvat iz baze ne uspije)
const DEFAULT_CATEGORIES = [
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
  'Ostalo',
];

type ReceiptItem = {
  name: string;
  quantity?: number;
  price: number;
  category: string;
};

const roundMoney = (value: number) => Math.round(value * 100) / 100;

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const normalized = value.replace(',', '.').replace(/[^0-9.-]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

// "Kafići" i "kafici" i "KAFIC I BAR" trebaju se poklopiti
const slug = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '');

// Sinonimi -> kanonski naziv kategorije (ako on postoji u bazi)
const CATEGORY_SYNONYMS: Record<string, string[]> = {
  'Kafići i barovi': ['kafic', 'kafici', 'kaficibarovi', 'bar', 'barovi', 'kafeteria', 'cafe', 'kavana', 'izlasci'],
  'Restorani': ['restoran', 'restorani', 'gastro', 'jelo', 'objedi', 'restoranihrana'],
  'Hrana': ['namirnice', 'trgovina', 'grocery', 'hranaipice'],
};

/** Dohvat kategorija iz baze da AI nikad ne "izmisli" kategoriju koja ne postoji. */
const fetchCategories = async (): Promise<string[]> => {
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY');
    if (!url || !key) return DEFAULT_CATEGORIES;

    const res = await fetch(`${url}/rest/v1/expense_categories?select=name`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return DEFAULT_CATEGORIES;

    const rows = await res.json();
    const names = Array.isArray(rows)
      ? rows.map((r: any) => String(r?.name || '').trim()).filter(Boolean)
      : [];
    return names.length ? names : DEFAULT_CATEGORIES;
  } catch (_e) {
    return DEFAULT_CATEGORIES;
  }
};

const makeNormalizer = (categories: string[]) => {
  const bySlug = new Map<string, string>();
  for (const c of categories) bySlug.set(slug(c), c);

  // sinonimi vode na postojeću kategoriju, ako ona postoji
  for (const [canonical, aliases] of Object.entries(CATEGORY_SYNONYMS)) {
    const target = bySlug.get(slug(canonical));
    if (!target) continue;
    for (const alias of aliases) if (!bySlug.has(alias)) bySlug.set(alias, target);
  }

  const fallback = bySlug.get('ostalo') ?? categories[categories.length - 1] ?? 'Ostalo';

  return (category: unknown): string => {
    const s = slug(String(category || ''));
    return bySlug.get(s) ?? fallback;
  };
};

/** Kategorija za cijeli račun, ovisno o vrsti objekta (ugostiteljstvo vs trgovina). */
const venueCategory = (venueType: unknown, categories: string[]): string | null => {
  const has = (name: string) => categories.find((c) => slug(c) === slug(name));
  const v = slug(String(venueType || ''));
  if (v === 'kaficbar' || v === 'kafic' || v === 'bar') {
    return has('Kafići i barovi') ?? has('Kafic i bar') ?? has('Kafići') ?? null;
  }
  if (v === 'restoran' || v === 'fastfood' || v === 'dostavahrane') {
    return has('Restorani') ?? has('Restoran') ?? null;
  }
  return null;
};

const normalizeReceiptData = (receiptData: any, categories: string[]) => {
  const normalizeCategory = makeNormalizer(categories);
  const forced = venueCategory(receiptData?.venue_type, categories);

  const items: ReceiptItem[] = Array.isArray(receiptData?.items)
    ? receiptData.items
        .map((item: any) => ({
          name: String(item?.name || 'Nepoznata stavka').trim(),
          quantity: item?.quantity === undefined ? undefined : toNumber(item.quantity),
          price: roundMoney(toNumber(item?.price)),
          // Ako je račun iz kafića ili restorana, SVE stavke idu u tu kategoriju,
          // bez obzira što je model prvo napisao (npr. "kava" -> Hrana).
          category: forced ?? normalizeCategory(item?.category),
        }))
        .filter((item: ReceiptItem) => item.name && item.price > 0)
    : [];

  const calculatedTotal = roundMoney(items.reduce((sum, item) => sum + item.price, 0));
  const aiTotal = roundMoney(toNumber(receiptData?.total_amount));
  const totalDifference = roundMoney(Math.abs(calculatedTotal - aiTotal));
  const needsReview = totalDifference > 0.05;

  return {
    ...receiptData,
    items,
    venue_type: receiptData?.venue_type ?? 'ostalo',
    applied_venue_category: forced ?? undefined,
    total_amount: aiTotal || calculatedTotal,
    calculated_total: calculatedTotal,
    total_difference: totalDifference,
    needs_review: needsReview,
    review_message: needsReview
      ? `Zbroj stavki (${calculatedTotal.toFixed(2)} €) razlikuje se od ukupnog iznosa računa (${aiTotal.toFixed(2)} €). Provjerite račun prije spremanja.`
      : undefined,
  };
};

const buildSystemPrompt = (categories: string[]) => `Ti si asistent za čitanje i analizu hrvatskih računa. Analiziraj sliku računa i izvuci sve stvarne stavke s računa.

Za svaku stavku pronađi:
- naziv proizvoda/usluge
- količinu (ako postoji)
- konačnu cijenu stavke u eurima

Također pronađi:
- naziv trgovine ili ugostiteljskog objekta
- vrstu objekta (venue_type)
- ukupan iznos računa
- datum računa (ako je vidljiv)

PRVI KORAK — ODREDI VRSTU OBJEKTA (venue_type):
- "kafic_bar" — kafić, caffe bar, bar, kavana, slastičarnica, buffet, konoba koja služi samo piće.
  Znakovi: naziv sadrži "caffe", "cafe", "bar", "kavana", "bistro"; račun ima uglavnom pića
  (kava, espresso, macchiato, cappuccino, čaj, sok, pivo, vino, gemišt, bevanda, rakija, koktel,
  voda 0,25), male količine, cijena po komadu, često samo 1-4 stavke.
- "restoran" — restoran, pizzeria, konoba, gostionica, fast food, dostava hrane
  (Wolt, Glovo, Bolt Food). Znakovi: pripremljena jela — pizza, pašta, juha, salata, odrezak,
  ćevapi, burger, dnevni meni, marenda, gablec, desert, kuvert, napojnica.
- "trgovina" — maloprodaja: Konzum, Lidl, Plodine, Spar, Kaufland, Tommy, Studenac, Eurospin,
  Müller, dm, Bipa, Pevex, Bauhaus, ljekarna, benzinska postaja.
- "ostalo" — sve drugo (usluge, obrt, kino, frizer...).

KLJUČNO PRAVILO ZA KATEGORIJE:
- Ako je venue_type "kafic_bar" → SVE stavke na tom računu dobivaju kategoriju "Kafići i barovi".
  Kava, pivo i sok u kafiću NISU "Hrana" — to je potrošnja u ugostiteljskom objektu.
- Ako je venue_type "restoran" → SVE stavke dobivaju kategoriju "Restorani".
  Pizza pojedena/naručena iz restorana NIJE "Hrana".
- Kategorija "Hrana" koristi se ISKLJUČIVO za namirnice kupljene u trgovini
  (kruh, mlijeko, meso, voće, povrće, tjestenina, konzerve, boca vina iz dućana).
- Isti proizvod ovisi o mjestu: pivo iz Konzuma → "Hrana"; pivo u kafiću → "Kafići i barovi".

Ostale kategorije (za račune iz trgovine):
- "Higijena" — proizvodi koji idu NA TIJELO: šampon, regenerator, gel za tuširanje, sapun,
  dezodorans, pasta i četkica za zube, vodica za usta, ulošci, tamponi, vlažne maramice,
  toaletni papir, papirnati rupčići, britvice, pjena za brijanje, kreme, losion, parfem, šminka,
  vata, štapići za uši, pelene, proizvodi za bebe.
- "Kućanstvo" — SAMO sredstva za čišćenje DOMA i predmeta: deterdžent za rublje, omekšivač,
  deterdžent za posuđe, Cif, Domestos, Bref, spužve, krpe, vreće za smeće, papirnati ručnici
  za kuhinju, folije, svijeće, žarulje, baterije.
- "Prijevoz" — gorivo, parking, javni prijevoz, cestarina.
- "Zdravlje" — lijekovi, vitamini, dodaci prehrani, zavoji, flasteri, toplomjer.
- "Zabava" — igračke, hobi, kino, knjige za zabavu.
- "Odjeća" — odjeća, obuća, modni dodaci, čarape.
- "Obrazovanje" — školski pribor, udžbenici, tečajevi.
- "Računi" — režije, pretplate, internet, telefon.
- "Ostalo" — sve ostalo.

Pravilo tijelo/predmet: proizvod NA TIJELO → "Higijena"; proizvod koji čisti PREDMETE ili
PROSTOR → "Kućanstvo".

Važna pravila za cijene i zbroj:
- Nemoj izmišljati stavke koje nisu jasno vidljive.
- Ako račun ima popust, koristi konačnu cijenu koju kupac plaća za tu stavku.
- Pazi na hrvatski decimalni zarez, npr. 1,29 znači 1.29.
- Ne miješaj količinu, jediničnu cijenu i ukupnu cijenu retka.
- Ako nisi siguran u cijenu, vrati najbolju procjenu, ali nemoj prilagođavati stavke samo
  zato da zbroj izgleda savršeno.

Primjeri:
- Caffe bar Lira: "Espresso 1,50", "Ožujsko 0,5 3,00" → venue_type "kafic_bar", obje stavke "Kafići i barovi"
- Pizzeria Nono: "Capricciosa 9,00", "Coca-Cola 2,50" → venue_type "restoran", obje stavke "Restorani"
- Konzum: "Kruh 1,29", "Mlijeko 0,99", "Ožujsko limenka 1,20" → venue_type "trgovina", sve "Hrana"
- Lidl: "Šampon Nivea 3,49" → "Higijena"; "Persil 8,99" → "Kućanstvo"

Dopuštene kategorije (koristi TOČNO ove nazive): ${categories.map((c) => `"${c}"`).join(', ')}.

Odgovori ISKLJUČIVO u JSON formatu bez dodatnog teksta.`;

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

    const categories = await fetchCategories();
    console.log('Kategorije za kategorizaciju:', categories.join(', '));
    console.log('Analiziram račun s AI...');

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
          { role: 'system', content: buildSystemPrompt(categories) },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analiziraj ovaj račun. Prvo odredi venue_type (kafic_bar, restoran, trgovina ili ostalo), zatim izvuci sve stavke s cijenama i kategorijama. Odgovori u JSON formatu.',
              },
              imageContent,
            ],
          },
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
                  store_name: { type: 'string', description: 'Naziv trgovine ili ugostiteljskog objekta' },
                  venue_type: {
                    type: 'string',
                    enum: ['kafic_bar', 'restoran', 'trgovina', 'ostalo'],
                    description:
                      'Vrsta objekta. kafic_bar = kafić/bar/kavana; restoran = restoran/pizzeria/konoba/fast food/dostava; trgovina = maloprodaja; ostalo = sve drugo',
                  },
                  venue_confidence: {
                    type: 'string',
                    enum: ['high', 'medium', 'low'],
                    description: 'Sigurnost prepoznavanja vrste objekta',
                  },
                  date: { type: 'string', description: 'Datum računa (DD.MM.YYYY format)' },
                  date_confidence: {
                    type: 'string',
                    enum: ['high', 'medium', 'low'],
                    description:
                      'Sigurnost prepoznavanja datuma: high ako je datum jasno vidljiv, medium ako je djelomično vidljiv ili nečitak, low ako nije pronađen ili je nejasan',
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
                          enum: categories,
                          description: 'Kategorija stavke',
                        },
                      },
                      required: ['name', 'price', 'category'],
                    },
                  },
                },
                required: ['items', 'total_amount', 'date_confidence', 'venue_type'],
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'extract_receipt_data' } },
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

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'extract_receipt_data') {
      throw new Error('AI nije vratio očekivani format podataka');
    }

    const receiptData = normalizeReceiptData(JSON.parse(toolCall.function.arguments), categories);
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
