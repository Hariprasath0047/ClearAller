import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import type { SafetyPrediction } from "@clearaller/shared";

type SafetyPredictionView = SafetyPrediction & {
  unknownIngredients: string[];
  mlSignals?: Array<{
    ingredient: string;
    categories: string[];
    confidence: number;
  }>;
};

type RiskHitView = SafetyPredictionView["matchedAllergens"][number] & {
  detectedBy?: "rules" | "ml" | "hybrid";
};

const ratingStyles = {
  Safe: {
    icon: <CheckCircle2 size={18} />,
    ring: "#0f766e",
    badge: "bg-sea/10 text-sea border border-sea/20"
  },
  "Moderate Risk": {
    icon: <AlertTriangle size={18} />,
    ring: "#2563eb",
    badge: "bg-blue-50 text-blue-700 border border-blue-100"
  },
  "High Risk": {
    icon: <ShieldAlert size={18} />,
    ring: "#dc2626",
    badge: "bg-red-50 text-red-600 border border-red-100"
  }
} as const;

function detectionLabel(value?: "rules" | "ml" | "hybrid") {
  if (value === "hybrid") {
    return "Rules + classifier";
  }

  if (value === "ml") {
    return "Classifier";
  }

  return "Direct ingredient match";
}

function buildShortSummary(prediction: SafetyPredictionView) {
  if (prediction.rating === "Safe") {
    return prediction.unknownIngredients.length
      ? `No strong allergen match found. ${prediction.unknownIngredients.length} ingredient${prediction.unknownIngredients.length > 1 ? "s" : ""} may still need manual review.`
      : "No strong allergen match found for this profile.";
  }

  if (prediction.matchedAllergens.length) {
    const topHit = prediction.matchedAllergens[0];
    return `${prediction.rating} because of ${topHit.matchedName} (${topHit.categories.join(", ")}).`;
  }

  return `${prediction.rating} result based on the current ingredient evidence.`;
}

export function AnalysisResults({ predictions, loading }: { predictions: SafetyPrediction[]; loading: boolean }) {
  if (loading) {
    return <div className="mt-5 rounded-[28px] border border-ink/8 bg-white/80 p-6 text-sm text-ink/60 panel-outline">Running OCR-normalized ingredient analysis and risk scoring...</div>;
  }

  if (!predictions.length) {
    return <div className="mt-5 rounded-[28px] border border-ink/8 bg-white/80 p-6 text-sm text-ink/60 panel-outline">No analysis yet. Scan an ingredient label and choose whether to compare one profile or all profiles.</div>;
  }

  return (
    <div className="mt-5 grid gap-4">
      {(predictions as SafetyPredictionView[]).map((prediction) => {
        const style = ratingStyles[prediction.rating];
        return (
          <article key={prediction.profileId} className="spotlight-card rounded-[30px] border border-ink/8 p-5 shadow-sm shadow-ink/5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="section-title text-sm font-semibold uppercase text-ink/45">Profile result</p>
                <h3 className="mt-2 font-display text-2xl font-semibold">{prediction.profileName}</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${style.badge}`}>
                  {style.icon}
                  {prediction.rating}
                </div>
              </div>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-[180px_1fr]">
              <div className="flex items-center justify-center">
                <div
                  className="metric-ring grid h-32 w-32 place-items-center rounded-full"
                  style={{ ["--value" as string]: `${Math.round(prediction.confidence * 100)}%`, background: `conic-gradient(${style.ring} ${Math.round(prediction.confidence * 100)}%, rgba(15,23,42,0.08) 0)` }}
                >
                  <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center shadow-sm">
                    <span className="text-3xl font-semibold">{Math.round(prediction.confidence * 100)}%</span>
                    <span className="text-xs uppercase tracking-[0.2em] text-ink/45">Confidence</span>
                  </div>
                </div>
              </div>
              <div className="grid gap-3">
                <div className="rounded-[22px] border border-ink/10 bg-white/80 p-4 text-sm text-ink/65 panel-outline">
                  <p className="font-medium text-ink">Short summary</p>
                  <p className="mt-2 leading-6">{buildShortSummary(prediction)}</p>
                </div>
                {prediction.matchedAllergens.length ? (
                  <details className="rounded-[22px] border border-ink/10 bg-white/80 p-4 panel-outline">
                    <summary className="cursor-pointer list-none font-medium text-ink">
                      View matched ingredients ({prediction.matchedAllergens.length})
                    </summary>
                    <div className="mt-3 grid gap-3">
                      {prediction.matchedAllergens.slice(0, 4).map((rawHit) => {
                        const hit = rawHit as RiskHitView;
                        return (
                          <div key={`${prediction.profileId}-${hit.ingredient}`} className="rounded-[22px] bg-white/90 p-4 panel-outline">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="font-semibold">{hit.matchedName}</p>
                                <p className="text-sm text-ink/60">Categories: {hit.categories.join(", ")}</p>
                              </div>
                              <div className="rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-600">
                                {Math.round(hit.probability * 100)}% risk probability
                              </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs">
                              <span className="rounded-full bg-[#edf4f8] px-3 py-1 text-ink/60">{detectionLabel(hit.detectedBy)}</span>
                              <span className="rounded-full bg-[#edf4f8] px-3 py-1 text-ink/60">Severity: {hit.severity}</span>
                            </div>
                          </div>
                        );
                      })}
                      {prediction.matchedAllergens.length > 4 ? (
                        <p className="text-xs text-ink/50">Showing the top 4 strongest matched ingredients.</p>
                      ) : null}
                    </div>
                  </details>
                ) : (
                  <div className="rounded-[22px] bg-mint/20 p-4 text-sm text-ink/65">No direct allergen matches were detected for this profile in the current ingredient set.</div>
                )}
                {prediction.mlSignals?.length ? (
                  <details className="rounded-[22px] border border-ink/10 bg-white/80 p-4 text-sm text-ink/65 panel-outline">
                    <summary className="cursor-pointer list-none font-medium text-ink">
                      View classifier signals ({prediction.mlSignals.length})
                    </summary>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {prediction.mlSignals.slice(0, 4).map((signal) => (
                        <span key={`${prediction.profileId}-${signal.ingredient}`} className="rounded-full bg-[#edf4f8] px-3 py-2 text-xs text-ink/70">
                          {signal.ingredient}: {signal.categories.join(", ")} ({Math.round(signal.confidence * 100)}%)
                        </span>
                      ))}
                    </div>
                  </details>
                ) : null}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
