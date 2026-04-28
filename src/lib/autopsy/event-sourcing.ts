import type { InflectionPoint, ExternalEvent } from "./types";

const GEMINI_AI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

interface MarketContext {
  title: string;
  category: string;
  description: string;
}

export async function fetchExternalEvent(
  inflection: InflectionPoint,
  market: MarketContext
): Promise<ExternalEvent> {
  const apiKey = process.env.GEMINI_AI_API_KEY;
  if (!apiKey) {
    return {
      headline: "AI unavailable",
      summary: "GEMINI_AI_API_KEY is not configured.",
      sources: [],
      confidence: 0,
      eventType: "other",
    };
  }

  const prompt = `You are analyzing a prediction market: "${market.title}"
Category: ${market.category}. Description: ${market.description}

At ${inflection.timestamp}, the price moved from ${Math.round(inflection.priceBefore * 100)}% to ${Math.round(inflection.priceAfter * 100)}% (${inflection.direction}, ${inflection.priceChangePercent}% change).

Use Google Search to find the specific real-world event that caused this price movement. Focus on news, data releases, speeches, or rulings from around that date.

Return JSON only, no markdown:
{
  "headline": "short headline",
  "summary": "2-3 sentence explanation of what happened and why it moved the market",
  "sources": [{"title": "...", "url": "...", "publishedAt": "..."}],
  "confidence": 0.0-1.0,
  "eventType": "news" | "data_release" | "speech" | "ruling" | "other"
}

If you cannot determine the cause, return {"confidence": 0, "headline": "Unknown catalyst", "summary": "", "sources": [], "eventType": "other"}.`;

  try {
    const res = await fetch(`${GEMINI_AI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini AI error:", res.status, errText);
      return fallbackEvent("AI request failed");
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Extract JSON from response (may have markdown fences)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallbackEvent("Could not parse AI response");

    const parsed = JSON.parse(jsonMatch[0]);

    // Extract grounding sources if available
    const groundingMetadata = data.candidates?.[0]?.groundingMetadata;
    const groundingSources = groundingMetadata?.groundingChunks?.map(
      (chunk: { web?: { uri?: string; title?: string } }) => ({
        title: chunk.web?.title || "Source",
        url: chunk.web?.uri || "",
        publishedAt: "",
      })
    ) || [];

    return {
      headline: parsed.headline || "Unknown catalyst",
      summary: parsed.summary || "",
      sources: groundingSources.length > 0 ? groundingSources : (parsed.sources || []),
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0,
      eventType: parsed.eventType || "other",
    };
  } catch (err) {
    console.error("Gemini AI call failed:", err);
    return fallbackEvent("AI request failed");
  }
}

function fallbackEvent(reason: string): ExternalEvent {
  return {
    headline: "Unknown catalyst",
    summary: reason,
    sources: [],
    confidence: 0,
    eventType: "other",
  };
}
