import type { AreaRecord, PriceType } from "@/types/index";

// AreaIntelligenceProps shape (mirrors AreaIntelligence component)
export interface AreaIntelligenceProps {
  data: {
    commuteScore: number;
    commuteTime: string;
    waterReliability: number;
    securityLevel: number;
    lifestyleScore: {
      nightlife: number;
      restaurants: number;
      parks: number;
    };
  };
}

/**
 * Formats a KES price value into a human-readable string.
 * Examples: "KES 45,000/mo", "KES 12.5M", "KES 850,000"
 */
export function formatPrice(price: number, priceType: PriceType): string {
  const suffix = priceType === "rent" ? "/mo" : "";

  if (price >= 1_000_000) {
    const millions = price / 1_000_000;
    // Show one decimal place only when it adds information
    const formatted =
      millions % 1 === 0 ? `${millions}M` : `${millions.toFixed(1)}M`;
    return `KES ${formatted}${suffix}`;
  }

  const formatted = price.toLocaleString("en-KE");
  return `KES ${formatted}${suffix}`;
}

/**
 * Derives a human-readable commute label from a 0–10 score.
 */
function commuteLabel(score: number): string {
  if (score >= 7) return "Good commute";
  if (score >= 4) return "Moderate commute";
  return "Difficult commute";
}

/**
 * Converts a DB AreaRecord (scores 0–10) to the AreaIntelligenceProps shape
 * expected by the AreaIntelligence component (scores 0–100).
 *
 * Mapping:
 *   commuteScore    ← commute_score  * 10
 *   waterReliability← water_score    * 10
 *   securityLevel   ← safety_score   * 10
 *   parks           ← (10 - flooding_score) * 10  (low flooding = good parks/green)
 *   nightlife       ← internet_score * 10  (placeholder — not in MVP schema)
 *   restaurants     ← internet_score * 10  (placeholder — not in MVP schema)
 */
export function mapAreaToIntelligenceProps(
  area: AreaRecord,
): AreaIntelligenceProps {
  const commuteScore = Math.round(area.commute_score * 10);
  const waterReliability = Math.round(area.water_score * 10);
  const securityLevel = Math.round(area.safety_score * 10);
  // Invert flooding score: low flooding risk → high parks/green score
  const parks = Math.round((10 - area.flooding_score) * 10);
  // Internet score used as a proxy for lifestyle amenities (nightlife, restaurants)
  const lifestyle = Math.round(area.internet_score * 10);

  return {
    data: {
      commuteScore,
      commuteTime: commuteLabel(area.commute_score),
      waterReliability,
      securityLevel,
      lifestyleScore: {
        nightlife: lifestyle,
        restaurants: lifestyle,
        parks,
      },
    },
  };
}

/**
 * Mirrors the SQL composite best-match score for client-side sorting.
 *
 * SQL equivalent:
 *   (COALESCE(avg_rating, 0) * 20)
 *   + (COALESCE(safety_score, 5) * 4)
 *   + (COALESCE(commute_score, 5) * 4)
 *   + EXTRACT(EPOCH FROM (NOW() - created_at)) / -86400
 */
export function computeBestMatchScore(
  rating: number,
  safetyScore: number,
  commuteScore: number,
  createdAt: string | Date,
): number {
  const ratingComponent = (rating ?? 0) * 20;
  const safetyComponent = (safetyScore ?? 5) * 4;
  const commuteComponent = (commuteScore ?? 5) * 4;

  const createdAtMs =
    typeof createdAt === "string"
      ? new Date(createdAt).getTime()
      : createdAt.getTime();
  const ageInDays = (Date.now() - createdAtMs) / 86_400_000;
  // Recency bonus: newer listings score higher (negative age penalty)
  const recencyComponent = -ageInDays;

  return (
    ratingComponent + safetyComponent + commuteComponent + recencyComponent
  );
}

/**
 * Returns a Tailwind text colour class for a community score on the 0–10 scale.
 * green ≥ 7, amber ≥ 4, red < 4  (Requirement 5.9)
 */
export function getScoreColor(score: number): string {
  if (score >= 7) return "text-emerald-500";
  if (score >= 4) return "text-amber-500";
  return "text-rose-500";
}
