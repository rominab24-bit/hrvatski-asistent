import { supabase } from '@/integrations/supabase/client';

export interface CategoryFeedbackInput {
  storeName?: string | null;
  itemName: string;
  originalCategory?: string | null;
  correctedCategory: string;
  /**
   * Težina zapisa u AI aglomeraciji. Standardne ispravke koriste 1.
   * Eksplicitna korisnička potvrda ("točno") koristi npr. 3 da jače utječe
   * na buduće prijedloge.
   */
  weight?: number;
}

/**
 * Bilježi korisničku ispravku ili potvrdu kategorije. AI koristi ove podatke
 * pri sljedećem skeniranju sličnih računa (isti izdavatelj, slična stavka)
 * kako bi bolje predložio kategoriju. Zapisi se sumiraju po težini.
 *
 * Best-effort: ne prekida glavni tijek ako spremanje ne uspije.
 */
export async function recordCategoryFeedback(input: CategoryFeedbackInput): Promise<void> {
  const itemName = input.itemName?.trim();
  const correctedCategory = input.correctedCategory?.trim();
  if (!itemName || !correctedCategory) return;

  const weight = Math.max(1, Math.floor(input.weight ?? 1));
  const original = input.originalCategory?.trim() || null;

  // Ne bilježi "ispravku" (weight=1) ako se kategorija zapravo nije promijenila —
  // ali potvrde ("točno", weight>=2) uvijek bilježimo jer služe kao pojačanje.
  if (
    weight === 1 &&
    original &&
    original.toLowerCase() === correctedCategory.toLowerCase()
  ) {
    return;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('category_feedback').insert({
      user_id: user.id,
      store_name: input.storeName?.trim() || null,
      item_name: itemName,
      original_category: original,
      corrected_category: correctedCategory,
      weight,
    });
  } catch (err) {
    // Ne prekidamo korisnički tijek — samo logiramo.
    console.warn('Bilježenje ispravke kategorije nije uspjelo:', err);
  }
}

const RATING_STORAGE_KEY = 'category_rating_status_v1';

type RatingStatus = 'confirmed' | 'rejected';

function readRatingMap(): Record<string, RatingStatus> {
  try {
    const raw = localStorage.getItem(RATING_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeRatingMap(map: Record<string, RatingStatus>) {
  try {
    localStorage.setItem(RATING_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignoriraj — quota / privatni način.
  }
}

/** Vraća prethodnu ocjenu za dati trošak (ili undefined ako nije ocijenjen). */
export function getExpenseRating(expenseId: string): RatingStatus | undefined {
  return readRatingMap()[expenseId];
}

/** Sprema ocjenu za dati trošak. */
export function setExpenseRating(expenseId: string, status: RatingStatus) {
  const map = readRatingMap();
  map[expenseId] = status;
  writeRatingMap(map);
}

/** Briše lokalni zapis ocjene za dati trošak. */
export function clearExpenseRating(expenseId: string) {
  const map = readRatingMap();
  delete map[expenseId];
  writeRatingMap(map);
}

/**
 * Best-effort brisanje zadnjeg zapisa povratne informacije koji odgovara
 * ovoj stavci (isti korisnik, izdavatelj i naziv stavke). Koristi se kad
 * korisnik poništi svoju ocjenu kako bi se pojačanje/ispravka poništili.
 */
export async function removeLatestCategoryFeedback(params: {
  storeName?: string | null;
  itemName: string;
}): Promise<void> {
  const itemName = params.itemName?.trim();
  if (!itemName) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from('category_feedback')
      .select('id')
      .eq('user_id', user.id)
      .eq('item_name', itemName)
      .order('created_at', { ascending: false })
      .limit(1);

    const store = params.storeName?.trim();
    query = store ? query.eq('store_name', store) : query.is('store_name', null);

    const { data, error } = await query;
    if (error || !data?.length) return;
    await supabase.from('category_feedback').delete().eq('id', data[0].id);
  } catch (err) {
    console.warn('Poništavanje ocjene nije uspjelo:', err);
  }
}
