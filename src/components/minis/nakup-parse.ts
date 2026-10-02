/** the aisles the miniature files things into, in the order a shop walks them */
export type Aisle = "fruit and veg" | "bakery" | "dairy and eggs" | "pantry" | "other";

export const AISLES: Aisle[] = ["fruit and veg", "bakery", "dairy and eggs", "pantry", "other"];

/** a pocket version of the app's aisle dictionary: enough words to feel like it knows */
const WORDS: Record<string, Aisle> = {
    apple: "fruit and veg", apples: "fruit and veg", banana: "fruit and veg", bananas: "fruit and veg",
    lime: "fruit and veg", limes: "fruit and veg", onion: "fruit and veg", onions: "fruit and veg",
    garlic: "fruit and veg", potatoes: "fruit and veg", carrots: "fruit and veg", avocado: "fruit and veg",
    spinach: "fruit and veg", cucumber: "fruit and veg", pepper: "fruit and veg", peppers: "fruit and veg",
    bread: "bakery", rolls: "bakery", baguette: "bakery", croissants: "bakery", bagels: "bakery",
    eggs: "dairy and eggs", yogurt: "dairy and eggs", yoghurt: "dairy and eggs", cheese: "dairy and eggs",
    cream: "dairy and eggs", "oat milk": "dairy and eggs", feta: "dairy and eggs", milk: "dairy and eggs",
    pasta: "pantry", rice: "pantry", flour: "pantry", coffee: "pantry", tea: "pantry", oats: "pantry",
    lentils: "pantry", sugar: "pantry", "olive oil": "pantry", chickpeas: "pantry", honey: "pantry",
};

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "2× eggs", "eggs 2x", "flour 1 kg": a quantity, if there is one, and the thing */
export function parse(raw: string): { name: string; qty?: string; aisle: Aisle } | null {
    let text = raw.trim().replace(/\s+/g, " ");
    if (!text) return null;
    let qty: string | undefined;
    const lead = text.match(/^(\d+)\s*[x×]\s*(.+)$/i);
    const trail = text.match(/^(.+?)\s+(\d+)\s*[x×]$/i);
    const unit = text.match(/^(.+?)\s+(\d+(?:[.,]\d+)?\s*(?:g|kg|l|ml))$/i);
    if (lead) {
        qty = `${lead[1]}×`;
        text = lead[2];
    } else if (trail) {
        text = trail[1];
        qty = `${trail[2]}×`;
    } else if (unit) {
        text = unit[1];
        qty = unit[2].replace(/(\d)\s*([a-z])/i, "$1 $2");
    }
    const key = text.toLowerCase();
    return { name: capital(text).slice(0, 28), qty, aisle: WORDS[key] ?? "other" };
}
