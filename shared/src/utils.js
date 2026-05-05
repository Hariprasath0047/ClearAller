export const severityWeight = {
    low: 0.25,
    medium: 0.5,
    high: 0.75,
    critical: 1
};
const stopPhrases = [
    "contains",
    "may contain",
    "allergen",
    "allergens",
    "warning",
    "distributed by",
    "imported by",
    "nutrition",
    "product description",
    "how to use",
    "description",
    "ingredients",
    "directions",
    "usage",
    "customer care",
    "best before",
    "manufactured by",
    "marketed by",
    "instructions",
    "method",
    "recipe",
    "blend together",
    "mix everything",
    "let the dough",
    "shape into",
    "top",
    "bake in",
    "cool completely",
    "preheated oven"
];
export function normalizeIngredientToken(value) {
    return value
        .toLowerCase()
        .replace(/ingredients?\s*:/g, " ")
        .replace(/[\u2013\u2014]/g, "-")
        .replace(/\((?:e\d+[a-z]?|ci\s*\d+|ins\s*\d+)\)/g, " ")
        .replace(/\[[^\]]*\]/g, " ")
        .replace(/\b\d+\s*-\s*\d+\b/g, " ")
        .replace(/\b\d+\s*\/\s*\d+\b/g, " ")
        .replace(/\b\d+(?:\.\d+)?\s*(%|mg|mcg|g|kg|ml|l|cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|pinch|pcs|pieces)\b/g, " ")
        .replace(/\b\d+(?:\.\d+)?\b/g, " ")
        .replace(/\b(cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|pinch|pcs|pieces)\b/g, " ")
        .replace(/[^a-z0-9\s-]/g, " ")
        .replace(/\s+-\s+/g, " ")
        .replace(/(^-|-$)/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}
function looksLikeIngredient(value) {
    if (!value || value.length < 3 || value.length > 80) {
        return false;
    }
    if (stopPhrases.some((phrase) => value.includes(phrase))) {
        return false;
    }
    if (value.split(" ").length > 8) {
        return false;
    }
    if (/\b(vitamin|mineral|daily value|serving|calorie|product|description|directions|smooth|dough|cookies|enjoy|oven|minutes|golden)\b/.test(value)) {
        return false;
    }
    if (/^[a-z]-?\d{1,4}$/.test(value)) {
        return false;
    }
    return true;
}
export function splitIngredients(text) {
    const preparedText = text
        .replace(/[\u2013\u2014]/g, "-")
        .replace(/\|/g, "\n")
        .replace(/\b(and|with)\b/gi, ",");
    return Array.from(new Set(preparedText
        .split(/[,.;\n]+/g)
        .map((item) => normalizeIngredientToken(item))
        .filter((item) => looksLikeIngredient(item))));
}
