import type { ProductResult } from "@clearaller/shared";

type CuratedProduct = ProductResult & {
  lens: "packaged-food" | "cosmetic";
  keywords: string[];
};

type Marketplace = "google" | "amazon" | "flipkart" | "nykaa" | "bigbasket";

function marketplaceSearchUrl(platform: Marketplace, query: string) {
  switch (platform) {
    case "amazon":
      return `https://www.amazon.in/s?k=${encodeURIComponent(query)}`;
    case "flipkart":
      return `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`;
    case "nykaa":
      return `https://www.nykaa.com/search/result/?q=${encodeURIComponent(query)}`;
    case "bigbasket":
      return `https://www.bigbasket.com/ps/?q=${encodeURIComponent(query)}`;
    default:
      return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  }
}

function googleSearchUrl(query: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function buildProduct(
  entry: Omit<CuratedProduct, "availabilityCountries" | "source" | "sourceSite" | "purchaseUrl"> & {
    searchQuery?: string;
    marketplace?: Marketplace;
    purchaseUrl?: string;
  }
): CuratedProduct {
  return {
    ...entry,
    source: "India curated catalog",
    sourceSite: "https://www.google.com",
    availabilityCountries: ["India"],
    purchaseUrl:
      entry.purchaseUrl ??
      marketplaceSearchUrl(entry.marketplace ?? "google", entry.searchQuery ?? `${entry.brand ?? ""} ${entry.name} India reviews`.trim())
  };
}

export const curatedProducts: CuratedProduct[] = [
  buildProduct({
    id: "food-amul-taaza-milk",
    lens: "packaged-food",
    name: "Amul Taaza Toned Milk",
    brand: "Amul",
    category: "dairy milk packaged food",
    reviewRating: 4.3,
    reviewCount: 1800,
    popularityScore: 90,
    ingredientsText: "milk, vitamin a, vitamin d",
    keywords: ["milk", "dairy", "toned milk", "amul milk", "packaged milk"]
  }),
  buildProduct({
    id: "food-amul-gold-milk",
    lens: "packaged-food",
    name: "Amul Gold Full Cream Milk",
    brand: "Amul",
    category: "dairy milk packaged food",
    reviewRating: 4.4,
    reviewCount: 1500,
    popularityScore: 88,
    ingredientsText: "milk, vitamin a, vitamin d",
    keywords: ["milk", "full cream milk", "amul gold", "dairy"]
  }),
  buildProduct({
    id: "food-id-curd",
    lens: "packaged-food",
    name: "iD Creamy Thick Curd",
    brand: "iD",
    category: "curd dairy probiotic packaged food",
    reviewRating: 4.1,
    reviewCount: 7000,
    popularityScore: 92,
    ingredientsText: "milk solids, live cultures",
    keywords: ["curd", "dahi", "yogurt", "id curd", "dairy"]
  }),
  buildProduct({
    id: "food-amul-masti-dahi",
    lens: "packaged-food",
    name: "Amul Masti Dahi",
    brand: "Amul",
    category: "curd dairy packaged food",
    reviewRating: 4.2,
    reviewCount: 2200,
    popularityScore: 84,
    ingredientsText: "milk solids, cultures",
    keywords: ["curd", "dahi", "amul dahi", "dairy"]
  }),
  buildProduct({
    id: "food-epigamia-greek-yogurt",
    lens: "packaged-food",
    name: "Epigamia Greek Yogurt Blueberry",
    brand: "Epigamia",
    category: "greek yogurt dairy packaged food",
    reviewRating: 4.3,
    reviewCount: 950,
    popularityScore: 76,
    ingredientsText: "skimmed milk, fruit preparation, cultures",
    keywords: ["greek yogurt", "yogurt", "epigamia", "dairy"]
  }),
  buildProduct({
    id: "food-yakult",
    lens: "packaged-food",
    name: "Yakult Probiotic Drink",
    brand: "Yakult",
    category: "probiotic dairy beverage packaged food",
    reviewRating: 4.4,
    reviewCount: 1300,
    popularityScore: 81,
    ingredientsText: "water, skimmed milk powder, glucose, sugar, live lactobacillus",
    keywords: ["yakult", "probiotic drink", "dairy drink", "milk drink"]
  }),
  buildProduct({
    id: "food-amul-butter",
    lens: "packaged-food",
    name: "Amul Pasteurised Butter",
    brand: "Amul",
    category: "butter dairy packaged food",
    reviewRating: 4.6,
    reviewCount: 2400,
    popularityScore: 90,
    ingredientsText: "pasteurised cream, salt",
    keywords: ["butter", "amul butter", "dairy spread"]
  }),
  buildProduct({
    id: "food-amul-cheese-slices",
    lens: "packaged-food",
    name: "Amul Cheese Slices",
    brand: "Amul",
    category: "cheese dairy packaged food",
    reviewRating: 4.5,
    reviewCount: 1750,
    popularityScore: 86,
    ingredientsText: "cheese, milk solids, emulsifying salts, common salt",
    keywords: ["cheese", "cheese slices", "amul cheese", "dairy"]
  }),
  buildProduct({
    id: "food-kelloggs-corn-flakes",
    lens: "packaged-food",
    name: "Kellogg's Corn Flakes Original",
    brand: "Kellogg's",
    category: "breakfast cereal packaged food",
    reviewRating: 4.3,
    reviewCount: 2100,
    popularityScore: 85,
    ingredientsText: "milled corn, sugar, iodised salt, barley malt extract, vitamins and minerals",
    keywords: ["corn flakes", "cereal", "breakfast cereal", "kelloggs"]
  }),
  buildProduct({
    id: "food-quaker-oats",
    lens: "packaged-food",
    name: "Quaker Oats",
    brand: "Quaker",
    category: "oats breakfast cereal packaged food",
    reviewRating: 4.5,
    reviewCount: 1900,
    popularityScore: 84,
    ingredientsText: "rolled oats",
    keywords: ["oats", "porridge", "breakfast oats", "quaker"]
  }),
  buildProduct({
    id: "food-saffola-oats",
    lens: "packaged-food",
    name: "Saffola Masala Oats Classic Masala",
    brand: "Saffola",
    category: "masala oats breakfast packaged food",
    reviewRating: 4.2,
    reviewCount: 1600,
    popularityScore: 79,
    ingredientsText: "whole grain oats, dehydrated vegetables, edible vegetable oil, spice mix, iodised salt",
    keywords: ["masala oats", "oats", "instant oats", "saffola"]
  }),
  buildProduct({
    id: "food-maggi-noodles",
    lens: "packaged-food",
    name: "Maggi 2-Minute Noodles Veggie Masala",
    brand: "Maggi",
    category: "instant noodles packaged food",
    reviewRating: 4.1,
    reviewCount: 1783,
    popularityScore: 95,
    ingredientsText: "refined wheat flour, edible vegetable oil, iodised salt, spices and condiments, flavour enhancers",
    keywords: ["maggi", "noodles", "instant noodles", "veggie masala"]
  }),
  buildProduct({
    id: "food-yippee-noodles",
    lens: "packaged-food",
    name: "Sunfeast YiPPee Magic Masala Noodles",
    brand: "Sunfeast",
    category: "instant noodles packaged food",
    reviewRating: 4.2,
    reviewCount: 950,
    popularityScore: 82,
    ingredientsText: "refined wheat flour, palm oil, spices, condiments, iodised salt",
    keywords: ["yippee", "noodles", "instant noodles", "magic masala"]
  }),
  buildProduct({
    id: "food-cadbury-dairy-milk",
    lens: "packaged-food",
    name: "Cadbury Dairy Milk Chocolate",
    brand: "Cadbury",
    category: "chocolate dairy packaged food",
    reviewRating: 4.5,
    reviewCount: 2600,
    popularityScore: 96,
    ingredientsText: "milk solids, sugar, cocoa butter, cocoa solids, emulsifiers, flavouring substances",
    keywords: ["chocolate", "cadbury", "dairy milk", "milk chocolate"]
  }),
  buildProduct({
    id: "food-bournville-dark",
    lens: "packaged-food",
    name: "Cadbury Bournville Rich Cocoa Dark Chocolate",
    brand: "Cadbury",
    category: "dark chocolate packaged food",
    reviewRating: 4.4,
    reviewCount: 1450,
    popularityScore: 82,
    ingredientsText: "cocoa mass, sugar, cocoa butter, emulsifiers, flavouring substances",
    keywords: ["dark chocolate", "bournville", "chocolate"]
  }),
  buildProduct({
    id: "food-oreo",
    lens: "packaged-food",
    name: "Cadbury Oreo Vanilla Sandwich Biscuits",
    brand: "Cadbury Oreo",
    category: "biscuits packaged food",
    reviewRating: 4.0,
    reviewCount: 11646,
    popularityScore: 89,
    ingredientsText: "refined wheat flour, sugar, vegetable oils, cocoa solids, raising agents, milk solids",
    keywords: ["oreo", "biscuits", "cookies", "chocolate biscuits"]
  }),
  buildProduct({
    id: "food-good-day-cashew",
    lens: "packaged-food",
    name: "Britannia Good Day Cashew Cookies",
    brand: "Britannia",
    category: "cookies biscuits packaged food",
    reviewRating: 4.3,
    reviewCount: 2100,
    popularityScore: 87,
    ingredientsText: "refined wheat flour, sugar, vegetable oils, milk solids, cashew nuts, raising agents",
    keywords: ["cookies", "biscuits", "good day", "cashew cookies"]
  }),
  buildProduct({
    id: "food-haldirams-bhujia",
    lens: "packaged-food",
    name: "Haldiram's Aloo Bhujia",
    brand: "Haldiram's",
    category: "snack packaged food",
    reviewRating: 4.3,
    reviewCount: 1800,
    popularityScore: 88,
    ingredientsText: "potato, gram flour, edible vegetable oil, spices, salt",
    keywords: ["snack", "bhujia", "namkeen", "haldirams"]
  }),
  buildProduct({
    id: "food-lays-classic",
    lens: "packaged-food",
    name: "Lay's Classic Salted Chips",
    brand: "Lay's",
    category: "chips snack packaged food",
    reviewRating: 4.3,
    reviewCount: 2300,
    popularityScore: 91,
    ingredientsText: "potatoes, edible vegetable oil, iodised salt",
    keywords: ["chips", "lays", "salted chips", "snack"]
  }),
  buildProduct({
    id: "food-makhana-plain",
    lens: "packaged-food",
    name: "Too Yumm Roasted Makhana Himalayan Salt",
    brand: "Too Yumm",
    category: "healthy snack packaged food",
    reviewRating: 4.1,
    reviewCount: 760,
    popularityScore: 72,
    ingredientsText: "fox nuts, rice bran oil, iodised salt, seasoning",
    keywords: ["makhana", "healthy snack", "fox nuts", "roasted snack"]
  }),
  buildProduct({
    id: "food-pintola-peanut-butter",
    lens: "packaged-food",
    name: "Pintola All Natural Peanut Butter Crunchy",
    brand: "Pintola",
    category: "peanut butter spread packaged food",
    reviewRating: 4.4,
    reviewCount: 1250,
    popularityScore: 80,
    ingredientsText: "roasted peanuts, sugar, salt",
    keywords: ["peanut butter", "pintola", "spread", "peanuts"]
  }),
  buildProduct({
    id: "food-yoga-bar-muesli",
    lens: "packaged-food",
    name: "Yoga Bar Dark Chocolate Muesli",
    brand: "Yoga Bar",
    category: "muesli breakfast cereal packaged food",
    reviewRating: 4.2,
    reviewCount: 680,
    popularityScore: 69,
    ingredientsText: "whole grain oats, nuts, seeds, cocoa solids, dried fruits",
    keywords: ["muesli", "breakfast cereal", "yoga bar", "dark chocolate"]
  }),
  buildProduct({
    id: "food-sofit-soy-milk",
    lens: "packaged-food",
    name: "Sofit Soya Milk Unsweetened",
    brand: "Sofit",
    category: "soy milk dairy alternative packaged food",
    reviewRating: 4.0,
    reviewCount: 540,
    popularityScore: 64,
    ingredientsText: "water, soy protein, stabilizers, minerals, vitamins",
    keywords: ["soy milk", "milk alternative", "dairy free milk", "sofit"]
  }),
  buildProduct({
    id: "food-raw-oat-milk",
    lens: "packaged-food",
    name: "Raw Pressery Oat Milk Unsweetened",
    brand: "Raw Pressery",
    category: "oat milk dairy alternative packaged food",
    reviewRating: 4.1,
    reviewCount: 420,
    popularityScore: 62,
    ingredientsText: "water, oats, sunflower oil, stabilizer, calcium, vitamins",
    keywords: ["oat milk", "dairy free milk", "milk alternative", "raw pressery"]
  }),
  buildProduct({
    id: "food-britannia-marie-gold",
    lens: "packaged-food",
    name: "Britannia Marie Gold Biscuits",
    brand: "Britannia",
    category: "biscuits tea biscuits packaged food",
    reviewRating: 4.3,
    reviewCount: 2100,
    popularityScore: 84,
    ingredientsText: "refined wheat flour, sugar, edible vegetable oil, milk solids, raising agents, salt",
    keywords: ["biscuits", "marie gold", "tea biscuits", "britannia"]
  }),
  buildProduct({
    id: "food-parle-g",
    lens: "packaged-food",
    name: "Parle-G Original Gluco Biscuits",
    brand: "Parle",
    category: "biscuits packaged food",
    reviewRating: 4.5,
    reviewCount: 4200,
    popularityScore: 93,
    ingredientsText: "wheat flour, sugar, invert syrup, vegetable oil, milk solids, raising agents",
    keywords: ["biscuits", "parle g", "gluco biscuits", "cookies"]
  }),
  buildProduct({
    id: "food-hide-seek",
    lens: "packaged-food",
    name: "Parle Hide & Seek Chocolate Chip Cookies",
    brand: "Parle",
    category: "cookies biscuits chocolate packaged food",
    reviewRating: 4.4,
    reviewCount: 1600,
    popularityScore: 85,
    ingredientsText: "wheat flour, sugar, edible vegetable oil, chocolate chips, milk solids, cocoa solids",
    keywords: ["cookies", "chocolate chip cookies", "hide and seek", "biscuits"]
  }),
  buildProduct({
    id: "food-monaco",
    lens: "packaged-food",
    name: "Parle Monaco Classic Salted Crackers",
    brand: "Parle",
    category: "crackers biscuits snack packaged food",
    reviewRating: 4.3,
    reviewCount: 1450,
    popularityScore: 80,
    ingredientsText: "wheat flour, edible vegetable oil, sugar, invert syrup, yeast, salt",
    keywords: ["crackers", "salted biscuits", "monaco", "snack biscuits"]
  }),
  buildProduct({
    id: "food-nestle-koko-krunch",
    lens: "packaged-food",
    name: "Nestle Koko Krunch Breakfast Cereal",
    brand: "Nestle",
    category: "breakfast cereal chocolate packaged food",
    reviewRating: 4.3,
    reviewCount: 980,
    popularityScore: 76,
    ingredientsText: "whole grain wheat, corn semolina, sugar, cocoa powder, iodised salt, vitamins and minerals",
    keywords: ["breakfast cereal", "chocolate cereal", "koko krunch", "cereal"]
  }),
  buildProduct({
    id: "food-kelloggs-muesli-fruit-nut",
    lens: "packaged-food",
    name: "Kellogg's Muesli Fruit Nut and Seeds",
    brand: "Kellogg's",
    category: "muesli breakfast cereal packaged food",
    reviewRating: 4.4,
    reviewCount: 1200,
    popularityScore: 79,
    ingredientsText: "whole grain oats, wheat flakes, dried fruits, almonds, pumpkin seeds, honey",
    keywords: ["muesli", "breakfast cereal", "fruit and nut muesli", "kelloggs"]
  }),
  buildProduct({
    id: "food-yoga-bar-protein-muesli",
    lens: "packaged-food",
    name: "Yoga Bar High Protein Muesli",
    brand: "Yoga Bar",
    category: "muesli breakfast cereal protein packaged food",
    reviewRating: 4.2,
    reviewCount: 610,
    popularityScore: 70,
    ingredientsText: "whole grain oats, soy protein isolate, pumpkin seeds, almonds, cocoa nibs",
    keywords: ["protein muesli", "muesli", "yoga bar", "breakfast cereal"]
  }),
  buildProduct({
    id: "food-kurkure-masala-munch",
    lens: "packaged-food",
    name: "Kurkure Masala Munch",
    brand: "Kurkure",
    category: "snack namkeen packaged food",
    reviewRating: 4.3,
    reviewCount: 1750,
    popularityScore: 88,
    ingredientsText: "corn meal, rice meal, gram meal, edible vegetable oil, spices, salt",
    keywords: ["kurkure", "snack", "namkeen", "masala munch"]
  }),
  buildProduct({
    id: "food-bingo-mad-angles",
    lens: "packaged-food",
    name: "Bingo Mad Angles Achaari Masti",
    brand: "Bingo",
    category: "chips snack packaged food",
    reviewRating: 4.2,
    reviewCount: 930,
    popularityScore: 77,
    ingredientsText: "corn grits, rice meal, vegetable oil, spices, condiments, salt",
    keywords: ["snack", "chips", "bingo", "mad angles"]
  }),
  buildProduct({
    id: "food-cadbury-5-star",
    lens: "packaged-food",
    name: "Cadbury 5 Star Chocolate Bar",
    brand: "Cadbury",
    category: "chocolate caramel packaged food",
    reviewRating: 4.4,
    reviewCount: 1280,
    popularityScore: 82,
    ingredientsText: "glucose syrup, sugar, milk solids, cocoa butter, cocoa solids, vegetable fat",
    keywords: ["chocolate", "5 star", "cadbury", "caramel chocolate"]
  }),
  buildProduct({
    id: "food-kitkat",
    lens: "packaged-food",
    name: "Nestle KitKat Chocolate Coated Wafer",
    brand: "Nestle",
    category: "chocolate wafer packaged food",
    reviewRating: 4.4,
    reviewCount: 1700,
    popularityScore: 84,
    ingredientsText: "sugar, wheat flour, cocoa mass, milk solids, cocoa butter, vegetable fats",
    keywords: ["chocolate", "kitkat", "wafer chocolate", "nestle"]
  }),
  buildProduct({
    id: "food-fuse",
    lens: "packaged-food",
    name: "Cadbury Fuse Chocolate Bar",
    brand: "Cadbury",
    category: "chocolate peanut caramel packaged food",
    reviewRating: 4.3,
    reviewCount: 820,
    popularityScore: 74,
    ingredientsText: "glucose syrup, peanuts, milk solids, sugar, cocoa solids, vegetable fats",
    keywords: ["chocolate", "cadbury fuse", "peanut chocolate", "caramel bar"]
  }),
  buildProduct({
    id: "food-amul-dark-chocolate",
    lens: "packaged-food",
    name: "Amul Dark Chocolate",
    brand: "Amul",
    category: "dark chocolate packaged food",
    reviewRating: 4.3,
    reviewCount: 910,
    popularityScore: 73,
    ingredientsText: "cocoa solids, sugar, cocoa butter, emulsifier",
    keywords: ["dark chocolate", "amul dark chocolate", "chocolate"]
  }),
  buildProduct({
    id: "food-kwality-cheese-spread",
    lens: "packaged-food",
    name: "Britannia Cheese Spread Original",
    brand: "Britannia",
    category: "cheese spread dairy packaged food",
    reviewRating: 4.2,
    reviewCount: 520,
    popularityScore: 67,
    ingredientsText: "cheese, water, milk solids, butter, emulsifying salts, salt",
    keywords: ["cheese spread", "cheese", "britannia", "dairy spread"]
  }),
  buildProduct({
    id: "food-epigamia-strawberry-yogurt",
    lens: "packaged-food",
    name: "Epigamia Strawberry Yogurt",
    brand: "Epigamia",
    category: "fruit yogurt dairy packaged food",
    reviewRating: 4.2,
    reviewCount: 740,
    popularityScore: 71,
    ingredientsText: "milk solids, fruit preparation, sugar, live cultures",
    keywords: ["yogurt", "fruit yogurt", "epigamia", "dairy"]
  }),
  buildProduct({
    id: "food-amul-lassi",
    lens: "packaged-food",
    name: "Amul Kool Kesar Lassi",
    brand: "Amul",
    category: "lassi dairy beverage packaged food",
    reviewRating: 4.3,
    reviewCount: 860,
    popularityScore: 75,
    ingredientsText: "curd, water, sugar, saffron flavour",
    keywords: ["lassi", "dairy drink", "amul kool", "curd drink"]
  }),
  buildProduct({
    id: "food-nourish-seeds-mix",
    lens: "packaged-food",
    name: "True Elements Roasted Seeds Mix",
    brand: "True Elements",
    category: "healthy snack seeds packaged food",
    reviewRating: 4.3,
    reviewCount: 640,
    popularityScore: 68,
    ingredientsText: "pumpkin seeds, sunflower seeds, watermelon seeds, flax seeds",
    keywords: ["healthy snack", "seeds mix", "true elements", "roasted seeds"]
  }),
  buildProduct({
    id: "cos-cetaphil-gentle",
    lens: "cosmetic",
    name: "Cetaphil Gentle Skin Cleanser",
    brand: "Cetaphil",
    category: "face wash all skin types sensitive skin cosmetic women men",
    reviewRating: 4.5,
    reviewCount: 3200,
    popularityScore: 95,
    ingredientsText: "water, cetyl alcohol, propylene glycol, sodium lauryl sulfate, stearyl alcohol, methylparaben, propylparaben",
    keywords: ["face wash", "cleanser", "sensitive skin", "all skin types", "cetaphil"]
  }),
  buildProduct({
    id: "cos-simple-refreshing-face-wash",
    lens: "cosmetic",
    name: "Simple Refreshing Facial Wash",
    brand: "Simple",
    category: "face wash sensitive skin all skin types cosmetic women men",
    reviewRating: 4.4,
    reviewCount: 2100,
    popularityScore: 86,
    ingredientsText: "water, cocamidopropyl betaine, glycerin, panthenol, vitamin e",
    keywords: ["face wash", "cleanser", "simple face wash", "sensitive skin", "all skin"]
  }),
  buildProduct({
    id: "cos-minimalist-salicylic-cleanser",
    lens: "cosmetic",
    name: "Minimalist 2% Salicylic Acid Cleanser",
    brand: "Minimalist",
    category: "face wash oily skin acne prone cosmetic women men",
    reviewRating: 4.4,
    reviewCount: 1800,
    popularityScore: 84,
    ingredientsText: "water, glycerin, salicylic acid, coco glucoside, panthenol",
    keywords: ["face wash", "cleanser", "oily skin", "acne-prone", "salicylic cleanser", "minimalist"]
  }),
  buildProduct({
    id: "cos-neutrogena-oil-free-acne-wash",
    lens: "cosmetic",
    name: "Neutrogena Oil Free Acne Wash",
    brand: "Neutrogena",
    category: "face wash oily skin acne prone cosmetic women men",
    reviewRating: 4.3,
    reviewCount: 1700,
    popularityScore: 83,
    ingredientsText: "water, sodium c14-16 olefin sulfonate, glycerin, salicylic acid, fragrance",
    keywords: ["face wash", "oily skin", "acne wash", "neutrogena", "cleanser"]
  }),
  buildProduct({
    id: "cos-plum-green-tea-face-wash",
    lens: "cosmetic",
    name: "Plum Green Tea Pore Cleansing Face Wash",
    brand: "Plum",
    category: "face wash oily skin acne prone cosmetic women",
    reviewRating: 4.3,
    reviewCount: 1500,
    popularityScore: 80,
    ingredientsText: "water, cocamidopropyl betaine, glycerin, glycolic acid, green tea extract, fragrance",
    keywords: ["face wash", "oily skin", "plum", "green tea", "acne-prone"]
  }),
  buildProduct({
    id: "cos-dot-key-barrier-face-wash",
    lens: "cosmetic",
    name: "Dot & Key Barrier Repair Gentle Face Wash",
    brand: "Dot & Key",
    category: "face wash dry skin sensitive skin cosmetic women men",
    reviewRating: 4.4,
    reviewCount: 1100,
    popularityScore: 76,
    ingredientsText: "water, glycerin, sodium cocoyl isethionate, ceramide complex, panthenol",
    keywords: ["face wash", "dry skin", "sensitive skin", "barrier repair", "dot and key"]
  }),
  buildProduct({
    id: "cos-mamaearth-rice-face-wash",
    lens: "cosmetic",
    name: "Mamaearth Rice Face Wash",
    brand: "Mamaearth",
    category: "face wash dull skin all skin types cosmetic women men",
    reviewRating: 4.2,
    reviewCount: 900,
    popularityScore: 72,
    ingredientsText: "water, glycerin, coco betaine, rice water, niacinamide, fragrance",
    keywords: ["face wash", "all skin types", "mamaearth", "rice face wash"]
  }),
  buildProduct({
    id: "cos-nivea-men-face-wash",
    lens: "cosmetic",
    name: "Nivea Men Sensitive Face Wash",
    brand: "Nivea",
    category: "face wash men male sensitive skin cosmetic",
    reviewRating: 4.2,
    reviewCount: 1300,
    popularityScore: 79,
    ingredientsText: "water, glycerin, cocamidopropyl betaine, panthenol, chamomile extract, fragrance",
    keywords: ["face wash", "men face wash", "male", "sensitive skin", "nivea men"]
  }),
  buildProduct({
    id: "cos-garnier-men-turbo-bright",
    lens: "cosmetic",
    name: "Garnier Men TurboBright Face Wash",
    brand: "Garnier",
    category: "face wash men male oily skin cosmetic",
    reviewRating: 4.1,
    reviewCount: 1500,
    popularityScore: 78,
    ingredientsText: "water, myristic acid, glycerin, salicylic acid, menthol, fragrance",
    keywords: ["face wash", "men face wash", "garnier men", "oily skin", "male"]
  }),
  buildProduct({
    id: "cos-beardo-activated-charcoal-face-wash",
    lens: "cosmetic",
    name: "Beardo Activated Charcoal Face Wash",
    brand: "Beardo",
    category: "face wash men male oily skin cosmetic",
    reviewRating: 4.1,
    reviewCount: 800,
    popularityScore: 70,
    ingredientsText: "water, glycerin, charcoal powder, cocamidopropyl betaine, fragrance",
    keywords: ["face wash", "beardo", "men", "male", "charcoal face wash"]
  }),
  buildProduct({
    id: "cos-tresemme-keratin-smooth",
    lens: "cosmetic",
    name: "Tresemme Keratin Smooth Shampoo",
    brand: "Tresemme",
    category: "shampoo women dry hair frizz control cosmetic",
    reviewRating: 4.4,
    reviewCount: 2600,
    popularityScore: 88,
    ingredientsText: "water, sodium laureth sulfate, dimethiconol, argan oil, fragrance",
    keywords: ["shampoo", "dry hair", "frizz", "tresemme", "keratin smooth"]
  }),
  buildProduct({
    id: "cos-head-shoulders-cool-menthol",
    lens: "cosmetic",
    name: "Head & Shoulders Cool Menthol Shampoo",
    brand: "Head & Shoulders",
    category: "shampoo all hair types dandruff cosmetic women men",
    reviewRating: 4.4,
    reviewCount: 2400,
    popularityScore: 90,
    ingredientsText: "water, sodium laureth sulfate, zinc pyrithione, dimethicone, fragrance",
    keywords: ["shampoo", "dandruff", "head and shoulders", "anti dandruff", "all hair types"]
  }),
  buildProduct({
    id: "cos-dove-intense-repair",
    lens: "cosmetic",
    name: "Dove Intense Repair Shampoo",
    brand: "Dove",
    category: "shampoo damaged hair dry hair cosmetic women men",
    reviewRating: 4.3,
    reviewCount: 1800,
    popularityScore: 82,
    ingredientsText: "water, sodium laureth sulfate, dimethiconol, glycerin, fragrance",
    keywords: ["shampoo", "damaged hair", "dry hair", "dove", "intense repair"]
  }),
  buildProduct({
    id: "cos-loreal-dream-lengths",
    lens: "cosmetic",
    name: "L'Oreal Paris Dream Lengths Shampoo",
    brand: "L'Oreal Paris",
    category: "shampoo damaged hair long hair cosmetic women",
    reviewRating: 4.3,
    reviewCount: 1200,
    popularityScore: 78,
    ingredientsText: "water, sodium laureth sulfate, castor oil, keratin, fragrance",
    keywords: ["shampoo", "damaged hair", "loreal", "dream lengths", "women"]
  }),
  buildProduct({
    id: "cos-mamaearth-onion-shampoo",
    lens: "cosmetic",
    name: "Mamaearth Onion Shampoo",
    brand: "Mamaearth",
    category: "shampoo damaged hair hair fall cosmetic women men",
    reviewRating: 4.1,
    reviewCount: 1700,
    popularityScore: 76,
    ingredientsText: "water, sodium cocoyl glycinate, onion seed oil, plant keratin, fragrance",
    keywords: ["shampoo", "hair fall", "damaged hair", "mamaearth", "onion shampoo"]
  }),
  buildProduct({
    id: "cos-matrix-opti-care",
    lens: "cosmetic",
    name: "Matrix Opti Care Smooth Straight Shampoo",
    brand: "Matrix",
    category: "shampoo straight hair frizz cosmetic women",
    reviewRating: 4.4,
    reviewCount: 900,
    popularityScore: 74,
    ingredientsText: "water, sodium laureth sulfate, shea butter, silk amino acids, fragrance",
    keywords: ["shampoo", "straight hair", "frizz", "matrix", "opti care"]
  }),
  buildProduct({
    id: "cos-bblunt-curly-hair",
    lens: "cosmetic",
    name: "BBlunt Curly Hair Shampoo",
    brand: "BBlunt",
    category: "shampoo curly hair dry hair cosmetic women men",
    reviewRating: 4.2,
    reviewCount: 650,
    popularityScore: 68,
    ingredientsText: "water, sodium cocoyl isethionate, glycerin, jojoba oil, fragrance",
    keywords: ["shampoo", "curly hair", "dry hair", "bblunt", "curly shampoo"]
  }),
  buildProduct({
    id: "cos-loreal-hyaluron-serum",
    lens: "cosmetic",
    name: "L'Oreal Paris Hyaluron Plump Serum",
    brand: "L'Oreal Paris",
    category: "serum dry skin hydration cosmetic women men",
    reviewRating: 4.4,
    reviewCount: 1700,
    popularityScore: 82,
    ingredientsText: "water, glycerin, hyaluronic acid, panthenol, phenoxyethanol",
    keywords: ["serum", "hydration", "dry skin", "hyaluronic serum", "loreal"]
  }),
  buildProduct({
    id: "cos-minimalist-vitamin-c-serum",
    lens: "cosmetic",
    name: "Minimalist 10% Vitamin C Serum",
    brand: "Minimalist",
    category: "serum all skin types hydration cosmetic women men",
    reviewRating: 4.3,
    reviewCount: 1300,
    popularityScore: 80,
    ingredientsText: "water, ethyl ascorbic acid, glycerin, ferulic acid, vitamin e",
    keywords: ["serum", "vitamin c", "all skin types", "minimalist", "hydration"]
  }),
  buildProduct({
    id: "cos-plum-niacinamide-serum",
    lens: "cosmetic",
    name: "Plum 10% Niacinamide Face Serum",
    brand: "Plum",
    category: "serum oily skin acne prone cosmetic women",
    reviewRating: 4.3,
    reviewCount: 1200,
    popularityScore: 77,
    ingredientsText: "water, niacinamide, rice ferment filtrate, panthenol, allantoin",
    keywords: ["serum", "niacinamide", "oily skin", "acne-prone", "plum"]
  }),
  buildProduct({
    id: "cos-dermaco-niacinamide-serum",
    lens: "cosmetic",
    name: "The Derma Co 10% Niacinamide Serum",
    brand: "The Derma Co",
    category: "serum oily skin acne prone cosmetic women men",
    reviewRating: 4.2,
    reviewCount: 1400,
    popularityScore: 79,
    ingredientsText: "water, niacinamide, zinc pca, glycerin, allantoin",
    keywords: ["serum", "niacinamide", "oily skin", "derma co", "acne-prone"]
  }),
  buildProduct({
    id: "cos-neutrogena-ultrasheer",
    lens: "cosmetic",
    name: "Neutrogena Ultra Sheer Dry Touch Sunscreen SPF 50+",
    brand: "Neutrogena",
    category: "sunscreen oily skin all skin types cosmetic women men",
    reviewRating: 4.4,
    reviewCount: 2200,
    popularityScore: 87,
    ingredientsText: "water, octinoxate, avobenzone, oxybenzone, silica, fragrance",
    keywords: ["sunscreen", "spf 50", "oily skin", "neutrogena", "dry touch"]
  }),
  buildProduct({
    id: "cos-fixderma-shadow",
    lens: "cosmetic",
    name: "Fixderma Shadow Sunscreen SPF 50+ Gel",
    brand: "Fixderma",
    category: "sunscreen oily skin sensitive skin cosmetic women men",
    reviewRating: 4.4,
    reviewCount: 1100,
    popularityScore: 78,
    ingredientsText: "water, octinoxate, avobenzone, vitamin e acetate, dimethicone",
    keywords: ["sunscreen", "spf 50", "oily skin", "fixderma", "gel sunscreen"]
  }),
  buildProduct({
    id: "cos-minimalist-spf50",
    lens: "cosmetic",
    name: "Minimalist SPF 50 PA++++ Multi Vitamin Sunscreen",
    brand: "Minimalist",
    category: "sunscreen all skin types cosmetic women men",
    reviewRating: 4.3,
    reviewCount: 950,
    popularityScore: 75,
    ingredientsText: "water, uv filters, glycerin, vitamin a, vitamin b, vitamin e",
    keywords: ["sunscreen", "spf 50", "all skin types", "minimalist"]
  }),
  buildProduct({
    id: "cos-lakme-peach-milk",
    lens: "cosmetic",
    name: "Lakme Peach Milk Moisturizer",
    brand: "Lakme",
    category: "moisturizer dry skin all skin types cosmetic women",
    reviewRating: 4.2,
    reviewCount: 1500,
    popularityScore: 78,
    ingredientsText: "water, glycerin, mineral oil, stearic acid, fragrance",
    keywords: ["moisturizer", "dry skin", "lakme", "peach milk", "women"]
  }),
  buildProduct({
    id: "cos-ponds-super-light-gel",
    lens: "cosmetic",
    name: "Pond's Super Light Gel Moisturizer",
    brand: "Pond's",
    category: "moisturizer oily skin hydration cosmetic women men",
    reviewRating: 4.5,
    reviewCount: 2600,
    popularityScore: 89,
    ingredientsText: "water, glycerin, dimethicone, sodium hyaluronate, fragrance",
    keywords: ["moisturizer", "gel moisturizer", "oily skin", "ponds", "hydration"]
  }),
  buildProduct({
    id: "cos-nivea-soft",
    lens: "cosmetic",
    name: "Nivea Soft Light Moisturizer",
    brand: "Nivea",
    category: "moisturizer all skin types hydration cosmetic women men",
    reviewRating: 4.4,
    reviewCount: 2100,
    popularityScore: 84,
    ingredientsText: "water, glycerin, jojoba oil, vitamin e, fragrance",
    keywords: ["moisturizer", "all skin types", "nivea soft", "hydration"]
  }),
  buildProduct({
    id: "cos-lakme-blush-glow-face-wash",
    lens: "cosmetic",
    name: "Lakme Blush & Glow Strawberry Face Wash",
    brand: "Lakme",
    category: "face wash normal skin all skin types cosmetic women",
    reviewRating: 4.1,
    reviewCount: 1450,
    popularityScore: 76,
    ingredientsText: "water, glycerin, cocamidopropyl betaine, fruit extract, fragrance",
    keywords: ["face wash", "lakme face wash", "normal skin", "all skin types", "women"]
  }),
  buildProduct({
    id: "cos-ponds-bright-beauty-face-wash",
    lens: "cosmetic",
    name: "Pond's Bright Beauty Spot-less Glow Face Wash",
    brand: "Pond's",
    category: "face wash all skin types cosmetic women",
    reviewRating: 4.2,
    reviewCount: 1200,
    popularityScore: 74,
    ingredientsText: "water, myristic acid, glycerin, niacinamide, fragrance",
    keywords: ["face wash", "ponds face wash", "all skin types", "women"]
  }),
  buildProduct({
    id: "cos-wow-apple-cider-shampoo",
    lens: "cosmetic",
    name: "WOW Skin Science Apple Cider Vinegar Shampoo",
    brand: "WOW Skin Science",
    category: "shampoo oily hair dandruff cosmetic women men",
    reviewRating: 4.2,
    reviewCount: 1100,
    popularityScore: 75,
    ingredientsText: "water, cocamidopropyl betaine, apple cider vinegar, argan oil, fragrance",
    keywords: ["shampoo", "oily hair", "dandruff", "wow shampoo", "apple cider vinegar"]
  }),
  buildProduct({
    id: "cos-biotique-bio-kelp",
    lens: "cosmetic",
    name: "Biotique Bio Kelp Protein Shampoo",
    brand: "Biotique",
    category: "shampoo oily hair damaged hair cosmetic women men",
    reviewRating: 4.1,
    reviewCount: 950,
    popularityScore: 72,
    ingredientsText: "water, kelp extract, natural proteins, bhringraj, peppermint oil",
    keywords: ["shampoo", "biotique", "oily hair", "protein shampoo"]
  }),
  buildProduct({
    id: "cos-loreal-total-repair-5",
    lens: "cosmetic",
    name: "L'Oreal Paris Total Repair 5 Shampoo",
    brand: "L'Oreal Paris",
    category: "shampoo damaged hair dry hair cosmetic women",
    reviewRating: 4.3,
    reviewCount: 1350,
    popularityScore: 79,
    ingredientsText: "water, sodium laureth sulfate, ceramide, protein, fragrance",
    keywords: ["shampoo", "damaged hair", "loreal", "total repair 5", "women"]
  }),
  buildProduct({
    id: "cos-indulekha-bringha",
    lens: "cosmetic",
    name: "Indulekha Bringha Shampoo",
    brand: "Indulekha",
    category: "shampoo hair fall damaged hair cosmetic women men",
    reviewRating: 4.2,
    reviewCount: 1250,
    popularityScore: 78,
    ingredientsText: "water, natural extracts, aloe vera, bhringraj, fragrance",
    keywords: ["shampoo", "hair fall", "indulekha", "bringha shampoo"]
  }),
  buildProduct({
    id: "cos-beardo-godfather-shampoo",
    lens: "cosmetic",
    name: "Beardo Godfather Beard and Hair Shampoo",
    brand: "Beardo",
    category: "shampoo men male oily hair cosmetic",
    reviewRating: 4.1,
    reviewCount: 620,
    popularityScore: 66,
    ingredientsText: "water, cocamidopropyl betaine, argan oil, glycerin, fragrance",
    keywords: ["shampoo", "men shampoo", "male", "beardo", "hair shampoo"]
  }),
  buildProduct({
    id: "cos-ustraa-anti-dandruff-shampoo",
    lens: "cosmetic",
    name: "Ustraa Anti Dandruff Shampoo",
    brand: "Ustraa",
    category: "shampoo men male dandruff cosmetic",
    reviewRating: 4.2,
    reviewCount: 540,
    popularityScore: 64,
    ingredientsText: "water, piroctone olamine, tea tree oil, glycerin, fragrance",
    keywords: ["shampoo", "anti dandruff", "men shampoo", "male", "ustraa"]
  }),
  buildProduct({
    id: "cos-deconstruct-vitamin-c-serum",
    lens: "cosmetic",
    name: "Deconstruct 10% Vitamin C Serum",
    brand: "Deconstruct",
    category: "serum all skin types hydration cosmetic women men",
    reviewRating: 4.2,
    reviewCount: 760,
    popularityScore: 69,
    ingredientsText: "water, vitamin c derivative, ferulic acid, glycerin, centella extract",
    keywords: ["serum", "vitamin c serum", "all skin types", "deconstruct"]
  }),
  buildProduct({
    id: "cos-foxtale-hydrating-serum",
    lens: "cosmetic",
    name: "Foxtale Hydrating Serum",
    brand: "Foxtale",
    category: "serum dry skin hydration cosmetic women men",
    reviewRating: 4.3,
    reviewCount: 680,
    popularityScore: 68,
    ingredientsText: "water, sodium hyaluronate, panthenol, glycerin, allantoin",
    keywords: ["serum", "hydrating serum", "dry skin", "foxtale", "hydration"]
  }),
  buildProduct({
    id: "cos-mamaearth-vitamin-c-serum",
    lens: "cosmetic",
    name: "Mamaearth Skin Illuminate Vitamin C Serum",
    brand: "Mamaearth",
    category: "serum all skin types hydration cosmetic women men",
    reviewRating: 4.1,
    reviewCount: 910,
    popularityScore: 71,
    ingredientsText: "water, vitamin c, turmeric extract, glycerin, squalane",
    keywords: ["serum", "vitamin c", "mamaearth serum", "all skin types"]
  }),
  buildProduct({
    id: "cos-aqualogica-dewy-sunscreen",
    lens: "cosmetic",
    name: "Aqualogica Glow+ Dewy Sunscreen SPF 50",
    brand: "Aqualogica",
    category: "sunscreen dry skin hydration cosmetic women men",
    reviewRating: 4.3,
    reviewCount: 1040,
    popularityScore: 74,
    ingredientsText: "water, uv filters, glycerin, papaya extract, vitamin c",
    keywords: ["sunscreen", "dry skin", "dewy sunscreen", "aqualogica", "spf 50"]
  }),
  buildProduct({
    id: "cos-requil-ultra-matte-sunscreen",
    lens: "cosmetic",
    name: "Re'equil Ultra Matte Dry Touch Sunscreen Gel SPF 50",
    brand: "Re'equil",
    category: "sunscreen oily skin matte cosmetic women men",
    reviewRating: 4.5,
    reviewCount: 980,
    popularityScore: 78,
    ingredientsText: "silicone base, uv filters, dimethicone crosspolymer, tocopherol",
    keywords: ["sunscreen", "oily skin", "matte sunscreen", "reequil", "spf 50"]
  }),
  buildProduct({
    id: "cos-biotique-morning-nectar",
    lens: "cosmetic",
    name: "Biotique Morning Nectar Moisturizer",
    brand: "Biotique",
    category: "moisturizer dry skin cosmetic women men",
    reviewRating: 4.2,
    reviewCount: 830,
    popularityScore: 69,
    ingredientsText: "water, honey, wheat germ oil, seaweed, fragrance",
    keywords: ["moisturizer", "dry skin", "biotique", "morning nectar"]
  }),
  buildProduct({
    id: "cos-cetaphil-moisturizing-lotion",
    lens: "cosmetic",
    name: "Cetaphil Moisturising Lotion",
    brand: "Cetaphil",
    category: "moisturizer sensitive skin dry skin cosmetic women men",
    reviewRating: 4.5,
    reviewCount: 1500,
    popularityScore: 83,
    ingredientsText: "water, glycerin, macadamia oil, dimethicone, panthenol",
    keywords: ["moisturizer", "cetaphil lotion", "sensitive skin", "dry skin"]
  }),
  buildProduct({
    id: "cos-ponds-light-moisturizer",
    lens: "cosmetic",
    name: "Pond's Light Moisturizer",
    brand: "Pond's",
    category: "moisturizer normal skin all skin types cosmetic women men",
    reviewRating: 4.2,
    reviewCount: 980,
    popularityScore: 71,
    ingredientsText: "water, glycerin, mineral oil, stearic acid, fragrance",
    keywords: ["moisturizer", "ponds moisturizer", "all skin types", "normal skin"]
  }),
  buildProduct({
    id: "food-real-mixed-fruit-juice",
    lens: "packaged-food",
    name: "Real Activ Mixed Fruit Juice",
    brand: "Real",
    category: "juice beverage packaged food",
    reviewRating: 4.2,
    reviewCount: 980,
    popularityScore: 74,
    ingredientsText: "water, fruit juice concentrate, sugar, acidity regulator, vitamins",
    keywords: ["juice", "mixed fruit juice", "real juice", "beverage"],
    marketplace: "bigbasket"
  }),
  buildProduct({
    id: "food-tropicana-orange-juice",
    lens: "packaged-food",
    name: "Tropicana 100% Orange Juice",
    brand: "Tropicana",
    category: "juice beverage packaged food",
    reviewRating: 4.3,
    reviewCount: 760,
    popularityScore: 70,
    ingredientsText: "orange juice from concentrate",
    keywords: ["juice", "orange juice", "tropicana", "beverage"],
    marketplace: "bigbasket"
  }),
  buildProduct({
    id: "food-lindt-excellence-dark",
    lens: "packaged-food",
    name: "Lindt Excellence 70% Cocoa Dark Chocolate",
    brand: "Lindt",
    category: "dark chocolate packaged food",
    reviewRating: 4.6,
    reviewCount: 980,
    popularityScore: 79,
    ingredientsText: "cocoa mass, sugar, cocoa butter, vanilla",
    keywords: ["dark chocolate", "lindt", "vegan chocolate", "chocolate"],
    marketplace: "amazon"
  }),
  buildProduct({
    id: "food-paul-mike-dark",
    lens: "packaged-food",
    name: "Paul And Mike 64% Dark Chocolate",
    brand: "Paul And Mike",
    category: "dark chocolate packaged food",
    reviewRating: 4.5,
    reviewCount: 430,
    popularityScore: 63,
    ingredientsText: "cocoa beans, sugar, cocoa butter",
    keywords: ["dark chocolate", "paul and mike", "vegan chocolate", "chocolate"],
    marketplace: "amazon"
  }),
  buildProduct({
    id: "food-mason-and-co-dark",
    lens: "packaged-food",
    name: "Mason & Co Vegan Dark Chocolate",
    brand: "Mason & Co",
    category: "vegan dark chocolate packaged food",
    reviewRating: 4.4,
    reviewCount: 260,
    popularityScore: 55,
    ingredientsText: "cacao beans, coconut sugar, cacao butter",
    keywords: ["vegan chocolate", "dark chocolate", "mason and co", "chocolate"],
    marketplace: "amazon"
  }),
  buildProduct({
    id: "food-nutrichoice-digestive",
    lens: "packaged-food",
    name: "Britannia NutriChoice Digestive Biscuits",
    brand: "Britannia",
    category: "digestive biscuits packaged food",
    reviewRating: 4.3,
    reviewCount: 920,
    popularityScore: 70,
    ingredientsText: "whole wheat flour, edible vegetable oil, sugar, oatmeal, raising agents",
    keywords: ["biscuits", "digestive biscuits", "nutrichoice", "cookies"],
    marketplace: "bigbasket"
  }),
  buildProduct({
    id: "food-farmlite-oats",
    lens: "packaged-food",
    name: "Sunfeast Farmlite Oats and Almond Biscuits",
    brand: "Sunfeast",
    category: "biscuits oats packaged food",
    reviewRating: 4.2,
    reviewCount: 690,
    popularityScore: 65,
    ingredientsText: "wheat flour, oats, almonds, vegetable oil, sugar, raising agents",
    keywords: ["biscuits", "oats biscuits", "farmlite", "sunfeast"],
    marketplace: "bigbasket"
  }),
  buildProduct({
    id: "food-slurrp-farm-millet",
    lens: "packaged-food",
    name: "Slurrp Farm Millet Cookies",
    brand: "Slurrp Farm",
    category: "millet cookies biscuits packaged food",
    reviewRating: 4.1,
    reviewCount: 380,
    popularityScore: 58,
    ingredientsText: "jowar flour, oats, jaggery, coconut oil, cocoa",
    keywords: ["biscuits", "cookies", "millet cookies", "slurrp farm"],
    marketplace: "amazon"
  }),
  buildProduct({
    id: "cos-dove-dryness-care-shampoo",
    lens: "cosmetic",
    name: "Dove Dryness Care Shampoo",
    brand: "Dove",
    category: "shampoo women dry hair cosmetic",
    reviewRating: 4.3,
    reviewCount: 1400,
    popularityScore: 77,
    ingredientsText: "water, sodium laureth sulfate, glycerin, dimethiconol, fragrance",
    keywords: ["shampoo", "dry hair", "dove shampoo", "women"],
    marketplace: "nykaa"
  }),
  buildProduct({
    id: "cos-pantene-hair-fall-shampoo",
    lens: "cosmetic",
    name: "Pantene Advanced Hair Fall Solution Shampoo",
    brand: "Pantene",
    category: "shampoo women damaged hair hair fall cosmetic",
    reviewRating: 4.2,
    reviewCount: 1320,
    popularityScore: 75,
    ingredientsText: "water, sodium laureth sulfate, panthenol, rice bran oil, fragrance",
    keywords: ["shampoo", "hair fall", "pantene", "women", "damaged hair"],
    marketplace: "amazon"
  }),
  buildProduct({
    id: "cos-herbal-essences-argan-shampoo",
    lens: "cosmetic",
    name: "Herbal Essences Argan Oil Shampoo",
    brand: "Herbal Essences",
    category: "shampoo women dry hair frizz cosmetic",
    reviewRating: 4.4,
    reviewCount: 540,
    popularityScore: 67,
    ingredientsText: "water, sodium laureth sulfate, argan oil, aloe, fragrance",
    keywords: ["shampoo", "dry hair", "frizz", "herbal essences", "argan oil"],
    marketplace: "amazon"
  }),
  buildProduct({
    id: "cos-livon-hair-serum",
    lens: "cosmetic",
    name: "Livon Anti Frizz Hair Serum",
    brand: "Livon",
    category: "hair serum frizz dry hair cosmetic women men",
    reviewRating: 4.4,
    reviewCount: 2100,
    popularityScore: 84,
    ingredientsText: "cyclopentasiloxane, dimethiconol, argan oil, fragrance",
    keywords: ["hair serum", "frizz", "dry hair", "livon", "serum"],
    marketplace: "nykaa"
  }),
  buildProduct({
    id: "cos-streax-hair-serum",
    lens: "cosmetic",
    name: "Streax Walnut Hair Serum",
    brand: "Streax",
    category: "hair serum frizz dry hair cosmetic women men",
    reviewRating: 4.2,
    reviewCount: 1300,
    popularityScore: 73,
    ingredientsText: "cyclopentasiloxane, dimethiconol, walnut oil, vitamin e, fragrance",
    keywords: ["hair serum", "frizz", "streax", "dry hair", "serum"],
    marketplace: "flipkart"
  }),
  buildProduct({
    id: "cos-loreal-extraordinary-oil-serum",
    lens: "cosmetic",
    name: "L'Oreal Paris Extraordinary Oil Serum",
    brand: "L'Oreal Paris",
    category: "hair serum dry hair damaged hair cosmetic women",
    reviewRating: 4.5,
    reviewCount: 980,
    popularityScore: 76,
    ingredientsText: "cyclopentasiloxane, dimethiconol, camellia oil, fragrance",
    keywords: ["hair serum", "dry hair", "damaged hair", "loreal serum"],
    marketplace: "nykaa"
  }),
  buildProduct({
    id: "cos-vaseline-cocoa-body-lotion",
    lens: "cosmetic",
    name: "Vaseline Intensive Care Cocoa Glow Body Lotion",
    brand: "Vaseline",
    category: "body lotion dry skin hydration cosmetic women men",
    reviewRating: 4.5,
    reviewCount: 2200,
    popularityScore: 85,
    ingredientsText: "water, glycerin, mineral oil, cocoa butter, dimethicone, fragrance",
    keywords: ["body lotion", "dry skin", "vaseline", "cocoa glow"],
    marketplace: "amazon"
  }),
  buildProduct({
    id: "cos-nivea-body-milk",
    lens: "cosmetic",
    name: "Nivea Nourishing Body Milk",
    brand: "Nivea",
    category: "body lotion dry skin hydration cosmetic women men",
    reviewRating: 4.4,
    reviewCount: 1600,
    popularityScore: 79,
    ingredientsText: "water, glycerin, almond oil, mineral oil, fragrance",
    keywords: ["body lotion", "dry skin", "nivea body milk", "hydration"],
    marketplace: "flipkart"
  }),
  buildProduct({
    id: "cos-foxtale-vitamin-c-serum",
    lens: "cosmetic",
    name: "Foxtale Vitamin C Serum",
    brand: "Foxtale",
    category: "face serum all skin types hydration cosmetic women men",
    reviewRating: 4.2,
    reviewCount: 540,
    popularityScore: 64,
    ingredientsText: "water, vitamin c derivative, glycerin, centella extract, ferulic acid",
    keywords: ["face serum", "vitamin c serum", "all skin types", "foxtale"],
    marketplace: "nykaa"
  }),
  buildProduct({
    id: "cos-pilgrim-squalane-serum",
    lens: "cosmetic",
    name: "Pilgrim Squalane Glow Serum",
    brand: "Pilgrim",
    category: "face serum dry skin hydration cosmetic women men",
    reviewRating: 4.2,
    reviewCount: 610,
    popularityScore: 66,
    ingredientsText: "squalane, vitamin c, hyaluronic acid, glycerin",
    keywords: ["face serum", "dry skin", "hydration", "pilgrim serum"],
    marketplace: "amazon"
  }),
  buildProduct({
    id: "cos-lakme-sunscreen-lotion",
    lens: "cosmetic",
    name: "Lakme Sun Expert SPF 50 PA+++ Lotion",
    brand: "Lakme",
    category: "sunscreen all skin types cosmetic women men",
    reviewRating: 4.3,
    reviewCount: 1450,
    popularityScore: 77,
    ingredientsText: "water, octinoxate, avobenzone, glycerin, vitamin b3",
    keywords: ["sunscreen", "spf 50", "lakme", "all skin types"],
    marketplace: "nykaa"
  }),
  buildProduct({
    id: "cos-aqualogica-body-lotion",
    lens: "cosmetic",
    name: "Aqualogica Radiance+ Body Lotion",
    brand: "Aqualogica",
    category: "body lotion normal skin hydration cosmetic women men",
    reviewRating: 4.1,
    reviewCount: 430,
    popularityScore: 58,
    ingredientsText: "water, glycerin, niacinamide, papaya extract, shea butter",
    keywords: ["body lotion", "normal skin", "aqualogica", "hydration"],
    marketplace: "nykaa"
  })
];

export function searchCuratedProducts(query: string, lens?: "packaged-food" | "cosmetic"): ProductResult[] {
  const normalized = query.toLowerCase().trim();
  const tokens = normalized.split(/\s+/).filter((token) => token.length > 1);
  const normalizedWithoutPlural = normalized.endsWith("s") ? normalized.slice(0, -1) : normalized;

  const matches = curatedProducts
    .filter((product) => !lens || product.lens === lens)
    .map((product) => {
      const haystack = [product.name, product.brand, product.category, ...product.keywords].join(" ").toLowerCase();
      let score = 0;

      for (const token of tokens) {
        if (haystack.includes(token)) {
          score += 14;
        }
      }

      if (haystack.includes(normalized)) {
        score += 20;
      }

      if (product.keywords.some((keyword) => keyword.toLowerCase() === normalized || keyword.toLowerCase() === normalizedWithoutPlural)) {
        score += 18;
      }

      if (normalizedWithoutPlural !== normalized && haystack.includes(normalizedWithoutPlural)) {
        score += 10;
      }

      return { product, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return (right.product.reviewRating ?? 0) - (left.product.reviewRating ?? 0);
    });

  return matches.map((entry) => entry.product);
}
