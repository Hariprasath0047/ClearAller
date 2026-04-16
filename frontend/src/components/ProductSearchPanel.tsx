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
    <div className="glass-card border border-[#d7e2eb] bg-white/95 p-6 md:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="section-title text-sm font-semibold uppercase text-ink/45">Product safety search</p>
          <h2 className="mt-3 max-w-3xl font-display text-3xl font-semibold">
            {lens === "cosmetic" ? "Search cosmetics and get the top 3 safe picks matched to saved beauty preferences." : "Search packaged foods and get the top 3 safe picks for the selected allergy profiles."}
          </h2>
          <p className="mt-2 text-sm text-ink/55">Choose product type, select profile, then search the curated product catalog.</p>
        </div>
        <div className="w-full max-w-2xl space-y-3">
          <div className="rounded-[24px] bg-white/75 p-3 panel-outline">
            <p className="text-sm font-medium text-ink/60">Run product search for</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {productLensOptions.map((option) => {
                const active = lens === option;
                const title = option === "cosmetic" ? "Cosmetic" : "Packaged food";
                const description =
                  option === "cosmetic" ? "Search skin care, hair care, and personal care products." : "Search snacks, pantry items, and packaged food products.";

                return (
                  <button
                    key={option}
                    onClick={() => setLens(option)}
                    className={`rounded-[20px] px-4 py-3 text-left ${active ? "bg-[#0f172a] text-white" : "bg-[#edf4f8] text-[#334155]"}`}
                  >
                    <p className="font-semibold">{title}</p>
                    <p className={`mt-1 text-sm ${active ? "text-white/75" : "text-ink/55"}`}>{description}</p>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 rounded-2xl bg-[#f1f7fb] px-4 py-3 text-sm text-ink/60">
              <p className="font-medium text-ink/65">Choose one or more profiles for this search</p>
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
                        className={`rounded-full px-4 py-2 text-sm font-medium ${active ? "bg-[#0f172a] text-white" : "bg-white text-[#334155]"}`}
                      >
                        {profile.name}
                      </button>
                    );
                  })
                ) : (
                  <span className="rounded-full bg-white px-4 py-2 text-sm text-ink/60">No profiles available yet.</span>
                )}
              </div>
              <p className="mt-3 text-sm text-ink/55">
                {selectedSearchProfileIds.length
                  ? `Using ${selectedSearchProfileIds.length} chosen profile${selectedSearchProfileIds.length > 1 ? "s" : ""} for this search.`
                  : "Select at least one profile before searching."}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={lens === "cosmetic" ? "Try cleanser, face wash, serum, shampoo, or sunscreen" : "Try biscuits, cereal, noodles, chocolates, or snacks"}
            className="panel-outline rounded-2xl bg-white px-4 py-3"
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
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0f172a] px-5 py-3 text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Search size={18} />
            Search
          </button>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        {searchQuery.data?.map((entry) => {
          const placeholder = buildPlaceholderVisual(entry);
          const PlaceholderIcon = placeholder.icon;

          return (
          <article key={entry.product.id} className="spotlight-card rounded-[28px] border border-ink/8 p-4 shadow-sm shadow-ink/5">
            {entry.product.imageUrl ? (
              <img src={entry.product.imageUrl} alt={entry.product.name} className="h-44 w-full rounded-[20px] object-cover" />
            ) : (
              <div className={`relative flex h-44 flex-col justify-between overflow-hidden rounded-[20px] bg-gradient-to-br ${placeholder.gradient} p-5 text-ink/55`}>
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
                  <h3 className="mt-3 font-display text-xl font-semibold">{entry.product.name}</h3>
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
              <div className="mt-4 rounded-[20px] bg-white/85 px-4 py-3 text-sm text-ink/65 panel-outline">
                {entry.recommendationNote}
              </div>
              {entry.product.reviewRating ? (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#dbeafe] px-3 py-2 text-xs font-semibold text-[#1d4ed8]">
                  <Star size={12} />
                  {entry.product.reviewRating.toFixed(1)}/5 review signal
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                {entry.predictions.map((prediction) => (
                  <span key={`${entry.product.id}-${prediction.profileId}`} className="rounded-full bg-white px-3 py-2 text-xs text-ink/65 shadow-sm">
                    {prediction.profileName}: approved
                  </span>
                ))}
              </div>
              <div className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-ink/40">Recommendation score {Math.round(entry.recommendationScore)}</div>
              {entry.product.purchaseUrl ? (
                <a href={entry.product.purchaseUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-sea">
                  Open source listing
                  <ArrowUpRight size={16} />
                </a>
              ) : null}
            </div>
          </article>
        )})}
      </div>
      {searchQuery.isFetching ? <div className="mt-4 text-sm text-ink/60">Finding matching products for your profiles...</div> : null}
      {!searchQuery.isLoading && submittedSearch?.query.trim().length && searchQuery.data?.length === 0 ? (
        <div className="mt-4 rounded-2xl bg-[#edf4f8] px-4 py-3 text-sm text-ink/60">No safe matches found for this search yet. Try a broader product type or another profile mode.</div>
      ) : null}
    </div>
  );
}
