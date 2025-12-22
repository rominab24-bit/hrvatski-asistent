import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
            content: `Ti si asistent za čitanje i analizu računa. Analiziraj sliku računa i izvuci sve stavke.

Za svaku stavku pronađi:
- naziv proizvoda/usluge
- količinu (ako postoji)
- cijenu

Također pronađi:
- naziv trgovine
- ukupan iznos
- datum računa (ako je vidljiv)

Kategoriziraj stavke u ove kategorije:
- Hrana (prehrambeni proizvodi, piće, namirnice)
- Kućanstvo (sredstva za čišćenje, potrepštine za dom)
- Prijevoz (gorivo, parking, javni prijevoz)
- Zdravlje (lijekovi, vitamini, medicinski proizvodi)
- Zabava (igračke, hobi, izlasci)
- Odjeća (odjeća, obuća, dodaci)
- Obrazovanje (knjige, školski pribor)
- Računi (režije, pretplate)
- Ostalo (sve što ne spada u gornje kategorije)

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
                        price: { type: 'number', description: 'Cijena' },
                        category: { 
                          type: 'string', 
                          enum: ['Hrana', 'Kućanstvo', 'Prijevoz', 'Zdravlje', 'Zabava', 'Odjeća', 'Obrazovanje', 'Računi', 'Ostalo'],
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

    const receiptData = JSON.parse(toolCall.function.arguments);
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
