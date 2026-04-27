import { createHmac } from "crypto";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "@/lib/crypto";
import type { GeminiPosition, GeminiSettledPosition, GeminiOrder } from "@/types/gemini";

const BASE_URL = "https://api.gemini.com";

function createGeminiHeaders(
  apiKey: string,
  apiSecret: string,
  endpoint: string,
  payload: Record<string, unknown> = {}
): Record<string, string> {
  const nonce = Date.now().toString();
  const body = {
    request: endpoint,
    nonce,
    ...payload,
  };
  const encodedPayload = Buffer.from(JSON.stringify(body)).toString("base64");
  const signature = createHmac("sha384", apiSecret)
    .update(encodedPayload)
    .digest("hex");

  return {
    "Content-Type": "text/plain",
    "X-GEMINI-APIKEY": apiKey,
    "X-GEMINI-PAYLOAD": encodedPayload,
    "X-GEMINI-SIGNATURE": signature,
    "Cache-Control": "no-cache",
  };
}

export async function fetchPositions(
  apiKey: string,
  apiSecret: string
): Promise<GeminiPosition[]> {
  const endpoint = "/v1/prediction-markets/positions";
  const headers = createGeminiHeaders(apiKey, apiSecret, endpoint);
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers,
  });
  if (!res.ok) throw new Error(`Gemini positions error: ${res.status}`);
  return res.json();
}

export async function fetchSettledPositions(
  apiKey: string,
  apiSecret: string
): Promise<GeminiSettledPosition[]> {
  const endpoint = "/v1/prediction-markets/positions/settled";
  const headers = createGeminiHeaders(apiKey, apiSecret, endpoint);
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers,
  });
  if (!res.ok) throw new Error(`Gemini settled positions error: ${res.status}`);
  return res.json();
}

export async function fetchOrderHistory(
  apiKey: string,
  apiSecret: string
): Promise<GeminiOrder[]> {
  const endpoint = "/v1/prediction-markets/orders/history";
  const headers = createGeminiHeaders(apiKey, apiSecret, endpoint);
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers,
  });
  if (!res.ok) throw new Error(`Gemini order history error: ${res.status}`);
  return res.json();
}

export async function getUserGeminiCredentials(
  userId: string
): Promise<{ apiKey: string; apiSecret: string } | null> {
  const [user] = await db
    .select({
      geminiApiKeyEnc: users.geminiApiKeyEnc,
      geminiApiSecretEnc: users.geminiApiSecretEnc,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.geminiApiKeyEnc || !user?.geminiApiSecretEnc) return null;

  return {
    apiKey: decrypt(user.geminiApiKeyEnc),
    apiSecret: decrypt(user.geminiApiSecretEnc),
  };
}
