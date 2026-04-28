import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_CATEGORIES = [
  'Hrana',
  'Kućanstvo',
  'Higijena',
  'Prijevoz',
  'Zdravlje',
  'Zabava',
  'Odjeća',
  'Obrazovanje',
  'Računi',
  'Ostalo',
] as const;

type ReceiptItem = {
  name: string;
  quantity?: number;
  price: number;
  category: typeof ALLOWED_CATEGORIES[number];
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

const normalizeCategory = (category: unknown): typeof ALLOWED_CATEGORIES[number] => {
  const text = String(category || '').trim();
  const found = ALLOWED_CATEGORIES.find((allowed) => allowed.toLowerCase() === text.toLowerCase());
  return found || 'Ostalo';
};

const normalizeReceiptData = (receiptData: any) => {
  const items: ReceiptItem[] = Array.isArray(receiptData?.items)
    ? receiptData.items.map((item: any) => ({
        name: String(item?.name || 'Nepoznata stavka').trim(),
        quantity: item?.quantity === undefined ? undefined : toNumber(item.quantity),
        price: roundMoney(toNumber(item?.price)),
        category: normalizeCategory(item?.category),
      })).filter((item: ReceiptItem) => item.name && item.price > 0)
    : [];

  const calculatedTotal = roundMoney(items.reduce((sum, item) => sum + item.price, 0));
  const aiTotal = roundMoney(toNumber(receiptData?.total_amount));
  const totalDifference = roundMoney(Math.abs(calculatedTotal - aiTotal));
  const needsReview = totalDifference > 0.05;

  return {
    ...receiptData,
    items,
    total_amount: aiTotal || calculatedTotal,
    calculated_total: calculatedTotal,
    total_difference: totalDifference,
    needs_review: needsReview,
    review_message: needsReview
      ? `Zbroj stavki (${calculatedTotal.toFixed(2)} €) razlikuje se od ukupnog iznosa računa (${aiTotal.toFixed(2)} €). Provjerite račun prije spremanja.`
      : undefined,
  };
};

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

    console.log('Analiziram račun s AI...');

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
- "Hrana" - prehrambeni proizvodi, piće, namirnice, slatkiši, kava, čaj, voda, sok, alkohol
- "Higijena" - SVI proizvodi za osobnu njegu i tijelo: šampon, regenerator, balzam za kosu, gel za tuširanje, sapun, tekući sapun, dezodorans, antiperspirant, pasta za zube, četkica za zube, zubni konac, vodica za usta, ulošci, tamponi, higijenski ulošci, vlažne maramice, toaletni papir, papirnati rupčići, britvice, brijač, pjena za brijanje, krema za tijelo, krema za lice, krema za ruke, losion, parfem, šminka, lak za nokte, maska za lice, gel za čišćenje lica, vata, štapići za uši, pelene, proizvodi za bebe (krema, šampon, kupka)
- "Kućanstvo" - SAMO sredstva za čišćenje DOMA i predmeta (NE tijela): deterdžent za rublje, omekšivač, deterdžent za posuđe, sredstvo za čišćenje (Cif, Domestos, Bref), sredstva za WC, spužve, krpe, vreće za smeće, papirnati ručnici za kuhinju, folije, alu-folije, svijeće, žarulje, baterije
- "Prijevoz" - gorivo, parking, javni prijevoz, cestarina
- "Zdravlje" - lijekovi, vitamini, dodaci prehrani, medicinski proizvodi, zavoji, flasteri, toplomjer
- "Zabava" - igračke, hobi, izlasci, kino, knjige za zabavu
- "Odjeća" - odjeća, obuća, modni dodaci, čarape
- "Obrazovanje" - školski pribor, udžbenici, tečajevi
- "Računi" - režije, pretplate, internet, telefon
- "Ostalo" - sve ostalo

KLJUČNO PRAVILO za razlikovanje Higijene i Kućanstva:
- Ako proizvod ide NA TIJELO (kožu, kosu, zube, intimu) → "Higijena"
- Ako proizvod čisti PREDMETE ili PROSTOR (pod, posuđe, rublje, WC) → "Kućanstvo"
- Toaletni papir, vlažni toaletni papir, ulošci, pelene → uvijek "Higijena"
- Papirnati ručnici za kuhinju → "Kućanstvo"

Primjeri ispravne kategorizacije:
- "NIVEA gel za tuširanje" → Higijena
- "Persil deterdžent" → Kućanstvo
- "Šampon Herbal Essences" → Higijena
- "Pasta za zube Colgate" → Higijena
- "Bref WC" → Kućanstvo
- "Toaletni papir Violeta" → Higijena
- "Papirnati ručnici S&S" → Kućanstvo
- "Dezodorans Borotalco" → Higijena
- "Omekšivač Violeta" → Kućanstvo

Odgovori ISKLJUČIVO u JSON formatu bez dodatnog teksta.`
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
                          enum: ['Hrana', 'Kućanstvo', 'Higijena', 'Prijevoz', 'Zdravlje', 'Zabava', 'Odjeća', 'Obrazovanje', 'Računi', 'Ostalo'],
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
