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
  "Low Risk": {
    icon: <AlertTriangle size={18} />,
    ring: "#38bdf8",
    badge: "bg-sky-50 text-sky-700 border border-sky-100"
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
  },
  "Critical Risk": {
    icon: <ShieldAlert size={18} />,
    ring: "#991b1b",
    badge: "bg-red-100 text-red-800 border border-red-200"
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
    return "Safe";
  }

  if (prediction.matchedAllergens.length) {
    const topHit = prediction.matchedAllergens[0];
    return `${prediction.rating} because of ${topHit.matchedName}.`;
  }

  return `${prediction.rating} result based on the current ingredient evidence.`;
}

export function AnalysisResults({ predictions, loading }: { predictions: SafetyPrediction[]; loading: boolean }) {
  if (loading) {
    return <div className="rounded-[22px] border border-[#d8e3f0] bg-white p-4 text-sm text-[#607992] shadow-[0_14px_28px_rgba(15,23,42,0.08)]">Running OCR-normalized ingredient analysis and risk scoring...</div>;
  }

  if (!predictions.length) {
    return <div className="rounded-[22px] border border-[#d8e3f0] bg-white p-4 text-sm text-[#607992] shadow-[0_14px_28px_rgba(15,23,42,0.08)]">No analysis yet. Scan an ingredient label and choose whether to compare one profile or all profiles.</div>;
  }

  return (
    <div className="grid gap-3">
      {(predictions as SafetyPredictionView[]).map((prediction) => {
        const style = ratingStyles[prediction.rating];
        const topRiskProbability = prediction.matchedAllergens[0]?.probability ?? 0;
        const riskPercent = Math.round(topRiskProbability * 100);
        const isSafe = prediction.rating === "Safe";

        return (
          <article key={prediction.profileId} className="rounded-[22px] border border-[#d8e3f0] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6d8399]">Profile result</p>
                <h3 className="mt-2 font-display text-xl font-semibold text-[#173251]">{prediction.profileName}</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${style.badge}`}>
                  {style.icon}
                  {prediction.rating}
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-4">
              <div className="flex items-center justify-center rounded-[18px] bg-[#f5f8fd] py-4">
                <div
                  className="metric-ring grid h-28 w-28 place-items-center rounded-full"
                  style={{
                    ["--value" as string]: isSafe ? "100%" : `${riskPercent}%`,
                    background: isSafe
                      ? `conic-gradient(${style.ring} 100%, rgba(15,23,42,0.08) 0)`
                      : `conic-gradient(${style.ring} ${riskPercent}%, rgba(15,23,42,0.08) 0)`
                  }}
                >
                  <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-center shadow-sm">
                    <span className={isSafe ? "text-xl font-semibold text-sea" : "text-2xl font-semibold"}>
                      {isSafe ? "Safe" : `${riskPercent}%`}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-ink/45">
                      {isSafe ? "Result" : "Risk"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid gap-3">
                <div className="rounded-[18px] bg-[#f5f8fd] p-4 text-sm text-[#607992]">
                  <p className="font-medium text-[#173251]">Short summary</p>
                  <p className="mt-2 leading-6">{buildShortSummary(prediction)}</p>
                </div>
                {prediction.matchedAllergens.length ? (
                  <details className="rounded-[18px] bg-[#f5f8fd] p-4">
                    <summary className="cursor-pointer list-none font-medium text-ink">
                      View matched ingredients ({prediction.matchedAllergens.length})
                    </summary>
                    <div className="mt-3 grid gap-3">
                      {prediction.matchedAllergens.slice(0, 4).map((rawHit) => {
                        const hit = rawHit as RiskHitView;
                        return (
                          <div key={`${prediction.profileId}-${hit.ingredient}`} className="rounded-[16px] bg-white p-4 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="font-semibold">{hit.matchedName}</p>
                                <p className="text-sm leading-6 text-ink/60">Categories: {hit.categories.join(", ")}</p>
                              </div>
                              <div className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600">
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
                  <div className="rounded-[18px] bg-mint/20 p-4 text-sm text-ink/65">No direct allergen matches were detected for this profile in the current ingredient set.</div>
                )}
                {prediction.mlSignals?.length ? (
                  <details className="rounded-[18px] bg-[#f5f8fd] p-4 text-sm text-ink/65">
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
