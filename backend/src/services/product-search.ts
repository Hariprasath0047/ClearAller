import pLimit from "p-limit";
import type { ProductResult, SafetyPrediction } from "@clearaller/shared";
import { prisma } from "../lib/db.js";
import { searchCuratedProducts } from "../data/curated-products.js";
import {
  searchOpenBeautyFacts,
  searchOpenFoodFacts,
  searchOpenProductsFacts
} from "../providers/openfoodfacts.js";
import { analyzeIngredients } from "./risk-engine.js";

type RankedProduct = {
  product: ProductResult;
  predictions: SafetyPrediction[];
  safestLabel: string;
  recommendationScore: number;
  recommendationNote: string;
};

type ProfilePreferences = {
  profileId: string;
  gender: string;
  skinType: string;
  hairType: string;
  cosmeticConcerns: string[];
};

type CandidateProduct = {
  product: ProductResult;
  recommendationScore: number;
  recommendationNote: string;
};

type CandidateBuildOptions = {
  requireIngredients: boolean;
  minimumReviewRating: number;
  fallbackNote: string;
};

type ProductGender = "male" | "female" | "unisex" | "unknown";

const SEARCH_CACHE_TTL_MS = 1000 * 60 * 60;
const ANALYSIS_CACHE_TTL_MS = 1000 * 60 * 15;
const MAX_ANALYSIS_CANDIDATES = 8;
const SEARCH_CACHE_VERSION = "v3";
const searchCache = new Map<string, { expiresAt: number; value: ProductResult[] }>();
const analysisCache = new Map<string, { expiresAt: number; value: RankedProduct[] }>();
const analyzeLimit = pLimit(3);

function getCachedValue<T>(store: Map<string, { expiresAt: number; value: T }>, key: string): T | null {
  const entry = store.get(key);
  if (!entry) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }

  return entry.value;
}

function setCachedValue<T>(store: Map<string, { expiresAt: number; value: T }>, key: string, value: T, ttlMs: number) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function isCosmeticSearch(query: string, lens?: "packaged-food" | "cosmetic") {
  if (lens === "cosmetic") {
    return true;
  }

  if (lens === "packaged-food") {
    return false;
  }

  return isCosmeticQuery(query);
}

async function fetchProducts(query: string, lens?: "packaged-food" | "cosmetic"): Promise<ProductResult[]> {
  const normalizedQuery = normalizeSearchQuery(query);
  const cacheKey = `${SEARCH_CACHE_VERSION}::${normalizedQuery}::${lens ?? "auto"}`;
  const cached = getCachedValue(searchCache, cacheKey);
  if (cached) {
    return cached;
  }

  if (isWrongLensQuery(normalizedQuery, lens)) {
    setCachedValue(searchCache, cacheKey, [], SEARCH_CACHE_TTL_MS);
    return [];
  }

  const curated = searchCuratedProducts(normalizedQuery, lens);
  if (curated.length >= 3) {
    setCachedValue(searchCache, cacheKey, curated, SEARCH_CACHE_TTL_MS);
    return curated;
  }

  const queryVariants = Array.from(
    new Set(
      [
        normalizedQuery,
        normalizedQuery.replace(/\s+/g, " ").trim(),
        normalizedQuery.includes("face wash") ? normalizedQuery.replace("face wash", "facewash") : "",
        normalizedQuery.includes("body wash") ? normalizedQuery.replace("body wash", "bodywash") : ""
      ].filter(Boolean)
    )
  );

  const providerCalls = queryVariants.flatMap((searchTerm) =>
    isCosmeticSearch(searchTerm, lens)
      ? [searchOpenBeautyFacts(searchTerm)]
      : [searchOpenFoodFacts(searchTerm), searchOpenProductsFacts(searchTerm)]
  );

  const productGroups = await Promise.all(providerCalls);
  const merged = new Map<string, ProductResult>();

  for (const group of productGroups) {
    for (const product of group) {
      const mergeKey = `${normalizeValue(product.name)}|${normalizeValue(product.brand)}`;
      const existing = merged.get(mergeKey);
      if (!existing) {
        merged.set(mergeKey, product);
        continue;
      }

      merged.set(mergeKey, {
        ...existing,
        imageUrl: existing.imageUrl ?? product.imageUrl,
        ingredientsText: existing.ingredientsText ?? product.ingredientsText,
        purchaseUrl: existing.purchaseUrl ?? product.purchaseUrl,
        reviewRating: Math.max(existing.reviewRating ?? 0, product.reviewRating ?? 0) || undefined,
        reviewCount: Math.max(existing.reviewCount ?? 0, product.reviewCount ?? 0) || undefined,
        popularityScore: Math.max(existing.popularityScore ?? 0, product.popularityScore ?? 0) || undefined,
        source: existing.source === product.source ? existing.source : `${existing.source}, ${product.source}`,
        sourceSite: existing.sourceSite ?? product.sourceSite
      });
    }
  }

  let products = Array.from(merged.values());

  if (products.length === 0 && lens) {
    const fallbackCalls =
      lens === "packaged-food"
        ? [searchOpenBeautyFacts(normalizedQuery)]
        : [searchOpenFoodFacts(normalizedQuery), searchOpenProductsFacts(normalizedQuery)];

    const fallbackGroups = await Promise.all(fallbackCalls);
    for (const group of fallbackGroups) {
      for (const product of group) {
        const mergeKey = `${normalizeValue(product.name)}|${normalizeValue(product.brand)}`;
        if (!merged.has(mergeKey)) {
          merged.set(mergeKey, product);
        }
      }
    }

    products = Array.from(merged.values());
  }

  const combined = Array.from(
    new Map(
      [...curated, ...products].map((product) => [`${normalizeValue(product.name)}|${normalizeValue(product.brand)}`, product])
    ).values()
  );

  setCachedValue(searchCache, cacheKey, combined, SEARCH_CACHE_TTL_MS);
  return combined;
}

function normalizeValue(value: string | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function normalizeSearchQuery(query: string) {
  return normalizeValue(query)
    .replace(/\bfacewash\b/g, "face wash")
    .replace(/\bbodywash\b/g, "body wash")
    .replace(/\bhaircare\b/g, "hair care")
    .replace(/\bskincare\b/g, "skin care")
    .replace(/\bchocolates\b/g, "chocolate")
    .replace(/\bbiscuits\b/g, "biscuit")
    .replace(/\bnoodles\b/g, "noodle")
    .replace(/\bcookies\b/g, "cookie");
}

function readPreference(medicalConditions: unknown, tag: string) {
  if (!Array.isArray(medicalConditions)) {
    return "";
  }

  const found = medicalConditions.find(
    (item): item is { name?: string; note?: string } =>
      typeof item === "object" && item !== null && "note" in item && (item as { note?: string }).note === tag
  );

  return normalizeValue(found?.name);
}

function readPreferences(medicalConditions: unknown, tag: string) {
  if (!Array.isArray(medicalConditions)) {
    return [];
  }

  return medicalConditions
    .filter(
      (item): item is { name?: string; note?: string } =>
        typeof item === "object" && item !== null && "note" in item && (item as { note?: string }).note === tag
    )
    .map((item) => normalizeValue(item.name))
    .filter(Boolean);
}

function isCosmeticQuery(query: string) {
  const normalized = query.toLowerCase();
  return ["shampoo", "conditioner", "serum", "lotion", "cleanser", "face wash", "body wash", "facewash", "sunscreen", "moisturizer", "soap", "cream", "toner", "skincare"].some((token) =>
    normalized.includes(token)
  );
}

function isWrongLensQuery(query: string, lens?: "packaged-food" | "cosmetic") {
  if (!lens) {
    return false;
  }

  const cosmeticLike = isCosmeticQuery(query);
  if (lens === "packaged-food" && cosmeticLike) {
    return true;
  }

  const packagedFoodSignals = ["milk", "curd", "yogurt", "chocolate", "biscuit", "cookie", "cereal", "oats", "noodle", "snack", "chips", "cheese", "butter", "lassi", "muesli"];
  const isFoodLike = packagedFoodSignals.some((token) => query.includes(token));

  return lens === "cosmetic" && isFoodLike;
}

function isBabyProduct(query: string, product: ProductResult) {
  const normalizedQuery = query.toLowerCase();
  if (normalizedQuery.includes("baby")) {
    return false;
  }

  const haystack = `${product.name} ${product.brand ?? ""} ${product.category}`.toLowerCase();
  return /\bbaby\b|\bchildren\b|\bkids\b|\bnewborn\b/.test(haystack);
}

function isAnimalUseProduct(query: string, product: ProductResult) {
  const normalizedQuery = query.toLowerCase();
  if (/\bpet\b|\bpets\b|\bdog\b|\bdogs\b|\bcat\b|\bcats\b|\banimal\b|\banimals\b|\bpuppy\b|\bpuppies\b|\bkitten\b|\bkittens\b|\bveterinary\b|\bgato\b|\bgatos\b|\bperro\b|\bperros\b/.test(normalizedQuery)) {
    return false;
  }

  const haystack = `${product.name} ${product.brand ?? ""} ${product.category}`.toLowerCase();
  return /\bpet\b|\bpets\b|\bdog\b|\bdogs\b|\bcat\b|\bcats\b|\banimal\b|\banimals\b|\bpuppy\b|\bpuppies\b|\bkitten\b|\bkittens\b|\bveterinary\b|\bpaw\b|\bfur\b|\bcanine\b|\bfeline\b|\bgato\b|\bgatos\b|\bperro\b|\bperros\b/.test(haystack);
}

function isIndiaAvailable(product: ProductResult) {
  const availability = ((product as ProductResult & { availabilityCountries?: string[] }).availabilityCountries ?? []) as string[];
  const normalized = availability.map((entry: string) => entry.toLowerCase());

  if (normalized.some((entry: string) => entry.includes("india") || entry.includes("en:india") || entry.includes("in:india"))) {
    return true;
  }

  const purchaseUrl = product.purchaseUrl?.toLowerCase() ?? "";
  return purchaseUrl.includes(".in/") || purchaseUrl.includes(".co.in/");
}

function queryMatchBoost(query: string, product: ProductResult) {
  const normalizedQuery = query.toLowerCase().trim();
  const haystack = `${product.name} ${product.brand ?? ""} ${product.category}`.toLowerCase();
  let score = 0;

  for (const token of normalizedQuery.split(/\s+/).filter((entry) => entry.length > 2)) {
    if (haystack.includes(token)) {
      score += 14;
    }
  }

  if (haystack.includes(normalizedQuery)) {
    score += 18;
  }

  return score;
}

function detectProductGender(product: ProductResult): ProductGender {
  const haystack = `${product.name} ${product.brand ?? ""} ${product.category}`.toLowerCase();

  if (/\bmen\b|\bmale\b|\bfor him\b/.test(haystack)) {
    return "male";
  }

  if (/\bwomen\b|\bfemale\b|\bfor her\b/.test(haystack)) {
    return "female";
  }

  if (/\bunisex\b/.test(haystack)) {
    return "unisex";
  }

  return "unknown";
}

function isGenderCompatible(product: ProductResult, preferences: ProfilePreferences[], query: string) {
  if (!isCosmeticQuery(query) || preferences.length === 0) {
    return true;
  }

  const productGender = detectProductGender(product);
  if (productGender === "unknown" || productGender === "unisex") {
    return true;
  }

  const selectedGenders = new Set(preferences.map((preference) => preference.gender).filter(Boolean));
  if (selectedGenders.size === 0) {
    return true;
  }

  return selectedGenders.size === 1 && selectedGenders.has(productGender);
}

function cosmeticPreferenceBoost(product: ProductResult, query: string, preferences: ProfilePreferences[]) {
  const haystack = `${product.name} ${product.category} ${query}`.toLowerCase();
  let score = 0;
  const reasons: string[] = [];

  for (const preference of preferences) {
    if (preference.gender === "female" && /\bwomen\b|\bfemale\b|\bfor her\b/.test(haystack)) {
      score += 12;
      reasons.push("female fit");
    }

    if (preference.gender === "male" && /\bmen\b|\bmale\b|\bfor him\b/.test(haystack)) {
      score += 12;
      reasons.push("male fit");
    }

    if (preference.skinType && haystack.includes(preference.skinType)) {
      score += 18;
      reasons.push(`${preference.skinType} skin`);
    }

    if (preference.hairType && haystack.includes(preference.hairType)) {
      score += 18;
      reasons.push(`${preference.hairType} hair`);
    }

    for (const concern of preference.cosmeticConcerns) {
      const normalizedConcern = concern.replace(/-/g, " ");
      if (normalizedConcern && normalizedConcern !== "none" && haystack.includes(normalizedConcern)) {
        score += 12;
        reasons.push(normalizedConcern);
      }
    }
  }

  return {
    score,
    note: reasons.length ? `Best fit for ${Array.from(new Set(reasons)).join(", ")}.` : "Safe match based on saved allergy profiles."
  };
}

function reviewBoost(product: ProductResult) {
  const rating = product.reviewRating ?? 0;
  const count = product.reviewCount ?? 0;
  return rating > 0 ? rating * 14 + Math.min(count, 250) / 20 : 0;
}

function reviewNote(product: ProductResult) {
  if (product.reviewRating && product.reviewRating >= 4) {
    return `Highly rated (${product.reviewRating.toFixed(1)}/5) and screened for your saved profiles.`;
  }

  if (product.reviewRating && product.reviewRating >= 3.5) {
    return `Good rating signal (${product.reviewRating.toFixed(1)}/5) with profile-safe ingredient screening.`;
  }

  return "";
}

function riskPriority(label: string) {
  if (label === "Safe") {
    return 0;
  }

  if (label === "Moderate Risk") {
    return 1;
  }

  return 2;
}

function completenessScore(product: ProductResult) {
  return (
    (product.imageUrl ? 10 : 0) +
    (product.brand ? 8 : 0) +
    (product.purchaseUrl ? 6 : 0) +
    Math.min((product.popularityScore ?? 0) / 25, 10) +
    Math.min((product.ingredientsText?.length ?? 0) / 20, 12)
  );
}

function buildCandidateProducts(
  products: ProductResult[],
  query: string,
  preferences: ProfilePreferences[],
  options: CandidateBuildOptions
) {
  const ranked = products
    .filter((product) => !isBabyProduct(query, product))
    .filter((product) => !isAnimalUseProduct(query, product))
    .filter((product) => isGenderCompatible(product, preferences, query))
    .filter((product) => !options.requireIngredients || (product.ingredientsText ?? "").trim().length > 0)
    .filter((product) => !isCosmeticQuery(query) || !product.reviewRating || product.reviewRating >= options.minimumReviewRating)
    .map((product) => {
      const cosmeticBoost = isCosmeticQuery(query)
        ? cosmeticPreferenceBoost(product, query, preferences)
        : { score: 0, note: options.fallbackNote };

      const reviewDrivenNote = reviewNote(product);
      const recommendationScore = completenessScore(product) + cosmeticBoost.score + queryMatchBoost(query, product) + reviewBoost(product);

      return {
        product,
        recommendationScore,
        recommendationNote: reviewDrivenNote || cosmeticBoost.note
      } satisfies CandidateProduct;
    })
    .sort((left, right) => right.recommendationScore - left.recommendationScore);

  const indiaAvailable = ranked.filter((entry) => isIndiaAvailable(entry.product));
  const pool = indiaAvailable.length > 0 ? indiaAvailable : ranked;
  return pool.slice(0, MAX_ANALYSIS_CANDIDATES);
}

export async function searchAndEvaluateProducts(params: {
  userId: string;
  query: string;
  lens?: "packaged-food" | "cosmetic";
  scope: "selected" | "all";
  profileIds?: string[];
}) {
  const profiles = await prisma.allergyProfile.findMany({
    where: {
      userId: params.userId,
      ...(params.scope === "selected" && params.profileIds?.length ? { id: { in: params.profileIds } } : {})
    },
    select: {
      id: true,
      medicalConditions: true
    }
  });

  const preferences = profiles.map((profile) => ({
    profileId: profile.id,
    gender: readPreference(profile.medicalConditions, "gender"),
    skinType: readPreference(profile.medicalConditions, "skinType"),
    hairType: readPreference(profile.medicalConditions, "hairType"),
    cosmeticConcerns: readPreferences(profile.medicalConditions, "cosmeticConcern")
  }));

  const cacheKey = JSON.stringify({
    version: SEARCH_CACHE_VERSION,
    userId: params.userId,
    query: params.query.trim().toLowerCase(),
    lens: params.lens ?? "auto",
    scope: params.scope,
    profileIds: params.profileIds ?? [],
    preferences: preferences.map((preference) => ({
      profileId: preference.profileId,
      gender: preference.gender,
      skinType: preference.skinType,
      hairType: preference.hairType,
      cosmeticConcerns: preference.cosmeticConcerns
    }))
  });
  const cached = getCachedValue(analysisCache, cacheKey);
  if (cached) {
    return cached;
  }

  const normalizedQuery = normalizeSearchQuery(params.query);
  const products = await fetchProducts(normalizedQuery, params.lens);

  const strictCandidates = buildCandidateProducts(products, normalizedQuery, preferences, {
    requireIngredients: true,
    minimumReviewRating: 3.5,
    fallbackNote: "Safe choice based on saved allergy profiles."
  });

  const relaxedCandidates = buildCandidateProducts(products, normalizedQuery, preferences, {
    requireIngredients: false,
    minimumReviewRating: 2.8,
    fallbackNote: "Medium-review fallback match based on product fit and availability in India."
  });

  const candidates = strictCandidates.length > 0 ? strictCandidates : relaxedCandidates;

  const ranked = (
    await Promise.all(
        candidates.map((candidate) =>
          analyzeLimit(async () => {
            const extractedText =
              candidate.product.ingredientsText?.trim() ||
              [candidate.product.name, candidate.product.brand, candidate.product.category].filter(Boolean).join(", ");

            const analysis = await analyzeIngredients({
              userId: params.userId,
              extractedText,
              productQuery: candidate.product.name,
              profileIds: params.profileIds,
              scope: params.scope,
            persistHistory: false
          });

          const highestRisk = analysis.predictions.some((prediction) => prediction.rating === "High Risk")
            ? "High Risk"
            : analysis.predictions.some((prediction) => prediction.rating === "Moderate Risk")
              ? "Moderate Risk"
              : "Safe";

            return {
              product: candidate.product,
              predictions: analysis.predictions,
              safestLabel: highestRisk,
              recommendationScore: candidate.recommendationScore,
              recommendationNote:
                !candidate.product.ingredientsText?.trim() && (candidate.product.reviewRating ?? 0) >= 2.8
                  ? "Medium-review fallback match shown because a full ingredient listing was not available."
                  : candidate.recommendationNote
            } satisfies RankedProduct;
          })
        )
    )
  ).filter((item): item is RankedProduct => Boolean(item));

  const safeOnly = ranked
    .filter((item) => item.safestLabel === "Safe")
    .sort((left, right) => right.recommendationScore - left.recommendationScore);

  const fallback = ranked
    .filter((item) => item.safestLabel !== "High Risk")
    .sort((left, right) => {
      const priorityGap = riskPriority(left.safestLabel) - riskPriority(right.safestLabel);
      if (priorityGap !== 0) {
        return priorityGap;
      }

      return right.recommendationScore - left.recommendationScore;
    });

  const ordered = (safeOnly.length >= 3 ? safeOnly : fallback).slice(0, 3);

  setCachedValue(analysisCache, cacheKey, ordered, ANALYSIS_CACHE_TTL_MS);
  return ordered;
}
