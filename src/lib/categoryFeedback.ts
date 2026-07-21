import { supabase } from '@/integrations/supabase/client';

export interface CategoryFeedbackInput {
  storeName?: string | null;
  itemName: string;
  originalCategory?: string | null;
  correctedCategory: string;
}

/**
 * Bilježi korisničku ispravku kategorije nakon skeniranja/uređivanja računa.
 * AI koristi ove podatke pri sljedećem skeniranju sličnih računa (isti izdavatelj,
 * slična stavka) kako bi bolje predložio kategoriju.
 *
 * Best-effort: ne prekida glavni tijek ako spremanje ne uspije.
 */
export async function recordCategoryFeedback(input: CategoryFeedbackInput): Promise<void> {
  const itemName = input.itemName?.trim();
  const correctedCategory = input.correctedCategory?.trim();
  if (!itemName || !correctedCategory) return;

  // Ne bilježi "ispravku" ako se kategorija nije promijenila.
  const original = input.originalCategory?.trim() || null;
  if (original && original.toLowerCase() === correctedCategory.toLowerCase()) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('category_feedback').insert({
      user_id: user.id,
      store_name: input.storeName?.trim() || null,
      item_name: itemName,
      original_category: original,
      corrected_category: correctedCategory,
    });
  } catch (err) {
    // Ne prekidamo korisnički tijek — samo logiramo.
    console.warn('Bilježenje ispravke kategorije nije uspjelo:', err);
  }
}
