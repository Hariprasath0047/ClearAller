import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Droplets, Package2, Search, ShieldCheck, Sparkles, Star, SunMedium, Waves } from "lucide-react";
import { api } from "../lib/api";
import { productLensOptions } from "../lib/constants";

type ProductCard = {
  product: {
    id: string;
    name: string;
    brand?: string;
    category: string;
    source: string;
    sourceSite?: string;
    imageUrl?: string;
    purchaseUrl?: string;
    reviewRating?: number;
    reviewCount?: number;
  };
  predictions: Array<{ profileId: string; profileName: string; rating: string }>;
  safestLabel: string;
  recommendationScore: number;
  recommendationNote: string;
};

type SearchProfile = {
  id: string;
  name: string;
};

type SubmittedSearch = {
  query: string;
  lens: "packaged-food" | "cosmetic";
  profileIds: string[];
};

function buildPlaceholderVisual(entry: ProductCard) {
  const category = entry.product.category.toLowerCase();

  if (category.includes("serum") || category.includes("hydration")) {
    return {
      icon: Droplets,
      badge: "Hydration care",
      gradient: "from-[#dbeafe] via-[#f8fbfd] to-[#e0f2fe]",
      iconBg: "bg-[#dbeafe]",
      iconColor: "text-[#1d4ed8]"
    };
  }

  if (category.includes("sunscreen") || category.includes("spf")) {
    return {
      icon: SunMedium,
      badge: "Sun shield",
      gradient: "from-[#dbeafe] via-[#f8fbfd] to-[#ccfbf1]",
      iconBg: "bg-[#dbeafe]",
      iconColor: "text-[#1d4ed8]"
    };
  }

  if (category.includes("shampoo") || category.includes("hair")) {
    return {
      icon: Waves,
      badge: "Hair care",
      gradient: "from-[#dbeafe] via-[#f8fbfd] to-[#e0f2fe]",
      iconBg: "bg-[#dbeafe]",
      iconColor: "text-[#1d4ed8]"
    };
  }

  if (category.includes("face wash") || category.includes("cleanser") || category.includes("moisturizer")) {
    return {
      icon: Sparkles,
      badge: "Skin care",
      gradient: "from-[#ecfeff] via-[#f8fbfd] to-[#dbeafe]",
      iconBg: "bg-[#ccfbf1]",
      iconColor: "text-[#0f766e]"
    };
  }

  return {
    icon: Package2,
    badge: "Packaged pick",
    gradient: "from-[#edf4f8] via-[#f8fbfd] to-[#dbeafe]",
    iconBg: "bg-[#dbeafe]",
    iconColor: "text-[#334155]"
  };
}

export function ProductSearchPanel({
  userId,
  profileIds,
  profiles,
  initialQuery,
  lens,
  setLens
}: {
  userId?: string;
  profileIds: string[];
  profiles: SearchProfile[];
  initialQuery: string;
  lens: "packaged-food" | "cosmetic";
  setLens: (value: "packaged-food" | "cosmetic") => void;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [submittedSearch, setSubmittedSearch] = useState<SubmittedSearch | null>(null);
  const [selectedSearchProfileIds, setSelectedSearchProfileIds] = useState<string[]>(profileIds);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setSelectedSearchProfileIds((current) => (current.length ? current : profileIds));
  }, [profileIds]);

  const searchQuery = useQuery({
    queryKey: [
      "product-search",
      submittedSearch?.query ?? "",
      userId,
      submittedSearch?.lens ?? "",
      submittedSearch?.profileIds.join(",") ?? ""
    ],
    enabled: Boolean(userId && submittedSearch && submittedSearch.query.trim().length >= 2 && submittedSearch.profileIds.length > 0),
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      const response = await api.get<ProductCard[]>("/api/search/products", {
        params: {
          userId,
          q: submittedSearch?.query,
          lens: submittedSearch?.lens,
          scope: "selected",
          profileIds: submittedSearch?.profileIds.join(",")
        }
      });
      return response.data;
    }
  });

  return (
    <div className="rounded-[24px] border border-[#d7e2eb] bg-white p-4 shadow-[0_14px_28px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6d8399]">Product safety search</p>
          <h2 className="mt-2 font-display text-2xl font-semibold leading-tight text-[#173251]">
            {lens === "cosmetic" ? "Search cosmetics and get the top 3 safe picks matched to saved beauty preferences." : "Search packaged foods and get the top 3 safe picks for the selected allergy profiles."}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#607992]">Choose product type, select profile, then search the curated product catalog.</p>
        </div>
        <div className="space-y-3">
          <div className="rounded-[20px] bg-[#f5f8fd] p-3">
            <p className="text-sm font-medium text-[#607992]">Run product search for</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {productLensOptions.map((option) => {
                const active = lens === option;
                const title = option === "cosmetic" ? "Cosmetic" : "Packaged food";
                const description =
                  option === "cosmetic" ? "Search skin care, hair care, and personal care products." : "Search snacks, pantry items, and packaged food products.";

                return (
                  <button
                    key={option}
                    onClick={() => setLens(option)}
                    className={`rounded-[16px] px-3 py-3 text-left ${active ? "bg-[#0d53a9] text-white" : "bg-white text-[#334155]"}`}
                  >
                    <p className="font-semibold">{title}</p>
                    <p className={`mt-1 text-xs leading-5 ${active ? "text-white/75" : "text-[#607992]"}`}>{description}</p>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 rounded-[18px] bg-white px-4 py-3 text-sm text-[#607992]">
              <p className="font-medium text-[#173251]">Choose one or more profiles for this search</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {profiles.length ? (
                  profiles.map((profile) => {
                    const active = selectedSearchProfileIds.includes(profile.id);
                    return (
                      <button
                        key={`search-profile-${profile.id}`}
                        onClick={() =>
                          setSelectedSearchProfileIds((current) =>
                            active ? current.filter((item) => item !== profile.id) : [...current, profile.id]
                          )
                        }
                        className={`rounded-full px-4 py-2 text-sm font-medium ${active ? "bg-[#0d53a9] text-white" : "bg-[#edf3fb] text-[#334155]"}`}
                      >
                        {profile.name}
                      </button>
                    );
                  })
                ) : (
                  <span className="rounded-full bg-[#edf3fb] px-4 py-2 text-sm text-[#607992]">No profiles available yet.</span>
                )}
              </div>
              <p className="mt-3 text-sm text-[#607992]">
                {selectedSearchProfileIds.length
                  ? `Using ${selectedSearchProfileIds.length} chosen profile${selectedSearchProfileIds.length > 1 ? "s" : ""} for this search.`
                  : "Select at least one profile before searching."}
              </p>
            </div>
          </div>

          <div className="grid gap-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={lens === "cosmetic" ? "Try cleanser, face wash, serum, shampoo, or sunscreen" : "Try biscuits, cereal, noodles, chocolates, or snacks"}
            className="h-12 rounded-[16px] border border-[#d8e3f0] bg-[#f8fbff] px-4 text-sm outline-none"
          />
          <button
            onClick={() =>
              setSubmittedSearch({
                query: query.trim(),
                lens,
                profileIds: [...selectedSearchProfileIds]
              })
            }
            disabled={!query.trim() || selectedSearchProfileIds.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-[16px] bg-[#0d53a9] px-5 py-3 text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Search size={18} />
            Search
          </button>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {searchQuery.data?.map((entry) => {
          const placeholder = buildPlaceholderVisual(entry);
          const PlaceholderIcon = placeholder.icon;

          return (
          <article key={entry.product.id} className="rounded-[22px] border border-[#d8e3f0] bg-[#fbfdff] p-3 shadow-[0_10px_22px_rgba(15,23,42,0.05)]">
            {entry.product.imageUrl ? (
              <img src={entry.product.imageUrl} alt={entry.product.name} className="h-36 w-full rounded-[18px] object-cover" />
            ) : (
              <div className={`relative flex h-36 flex-col justify-between overflow-hidden rounded-[18px] bg-gradient-to-br ${placeholder.gradient} p-4 text-ink/55`}>
                <div className="absolute right-[-1.25rem] top-[-1.25rem] h-24 w-24 rounded-full bg-white/45 blur-xl" />
                <div className={`grid h-12 w-12 place-items-center rounded-2xl ${placeholder.iconBg} ${placeholder.iconColor}`}>
                  <PlaceholderIcon size={22} />
                </div>
                <div>
                  <div className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">
                    {placeholder.badge}
                  </div>
                  <p className="mt-3 max-w-[18ch] text-lg font-semibold leading-6 text-ink/75">{entry.product.brand ?? entry.product.name}</p>
                </div>
              </div>
            )}
            <div className="mt-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-ink/45">
                    <ShieldCheck size={12} />
                    {entry.product.category}
                  </div>
                  <h3 className="mt-2 font-display text-lg font-semibold leading-6 text-[#173251]">{entry.product.name}</h3>
                  <p className="text-sm text-ink/55">{entry.product.brand ?? entry.product.source}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-ink/40">{entry.product.source}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    entry.safestLabel === "Safe" ? "bg-sea/10 text-sea" : "bg-[#dbeafe] text-[#1d4ed8]"
                  }`}
                >
                  {entry.safestLabel === "Safe" ? "Safe pick" : "Safest available"}
                </span>
              </div>
              <div className="mt-3 rounded-[16px] bg-[#f5f8fd] px-4 py-3 text-sm leading-6 text-[#607992]">
                {entry.recommendationNote}
              </div>
              {entry.product.reviewRating ? (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#dbeafe] px-3 py-2 text-xs font-semibold text-[#1d4ed8]">
                  <Star size={12} />
                  {entry.product.reviewRating.toFixed(1)}/5 review signal
                </div>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {entry.predictions.map((prediction) => (
                  <span key={`${entry.product.id}-${prediction.profileId}`} className="rounded-full bg-white px-3 py-2 text-xs text-[#607992] shadow-sm">
                    {prediction.profileName}: {prediction.rating === "Safe" ? "approved" : prediction.rating}
                  </span>
                ))}
              </div>
              <div className="mt-3 text-[11px] font-medium uppercase tracking-[0.16em] text-[#6d8399]">Recommendation score {Math.round(entry.recommendationScore)}</div>
              {entry.product.purchaseUrl ? (
                <a href={entry.product.purchaseUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-sea">
                  Open source listing
                  <ArrowUpRight size={16} />
                </a>
              ) : null}
            </div>
          </article>
        )})}
      </div>
      {searchQuery.isFetching ? <div className="mt-4 text-sm text-[#607992]">Finding matching products for your profiles...</div> : null}
      {!searchQuery.isLoading && submittedSearch?.query.trim().length && searchQuery.data?.length === 0 ? (
        <div className="mt-4 rounded-[18px] bg-[#edf4f8] px-4 py-3 text-sm text-[#607992]">No safe matches found for this search yet. Try a broader product type or another profile mode.</div>
      ) : null}
    </div>
  );
}
