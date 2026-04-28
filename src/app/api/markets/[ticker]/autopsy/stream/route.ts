import { NextRequest } from "next/server";
import { fetchGeminiEvent } from "@/lib/market-data/gemini-api";
import { fetchExternalEvent } from "@/lib/autopsy/event-sourcing";
import type { InflectionPoint } from "@/lib/autopsy/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const { searchParams } = new URL(request.url);
  const inflectionsParam = searchParams.get("inflections") || "";

  // Parse inflection data from query params
  const inflectionData: InflectionPoint[] = (() => {
    try {
      return JSON.parse(decodeURIComponent(searchParams.get("data") || "[]"));
    } catch {
      return [];
    }
  })();

  const inflectionIds = inflectionsParam.split(",").filter(Boolean);

  if (inflectionIds.length === 0 || inflectionData.length === 0) {
    return new Response("event: done\ndata: {}\n\n", {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // Fetch market context for the AI prompt
  const event = await fetchGeminiEvent(ticker);
  const market = event
    ? {
        title: event.title,
        category: event.category,
        description:
          typeof event.description === "string" ? event.description : "",
      }
    : { title: ticker, category: "other", description: "" };

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      for (const inflection of inflectionData) {
        if (!inflectionIds.includes(inflection.id)) continue;

        try {
          const externalEvent = await fetchExternalEvent(inflection, market);

          const eventData = JSON.stringify({
            inflectionId: inflection.id,
            externalEvent,
          });

          controller.enqueue(
            encoder.encode(`event: inflection-update\ndata: ${eventData}\n\n`)
          );
        } catch (err) {
          console.error(`Stream error for ${inflection.id}:`, err);
          const errorData = JSON.stringify({
            inflectionId: inflection.id,
            externalEvent: {
              headline: "Unknown catalyst",
              summary: "Failed to analyze this inflection point.",
              sources: [],
              confidence: 0,
              eventType: "other",
            },
          });
          controller.enqueue(
            encoder.encode(`event: inflection-update\ndata: ${errorData}\n\n`)
          );
        }
      }

      controller.enqueue(encoder.encode("event: done\ndata: {}\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
