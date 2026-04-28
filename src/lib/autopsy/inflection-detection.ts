import type { PricePoint } from "@/types/market";
import type { InflectionPoint } from "./types";

const WINDOW = 20;
const SCORE_THRESHOLD = 2.0;

function rollingStats(values: number[], idx: number): { mean: number; std: number } {
  const start = Math.max(0, idx - WINDOW);
  const window = values.slice(start, idx);
  if (window.length < 2) return { mean: 0, std: 1 };
  const mean = window.reduce((a, b) => a + b, 0) / window.length;
  const variance = window.reduce((a, v) => a + (v - mean) ** 2, 0) / window.length;
  return { mean, std: Math.sqrt(variance) || 1 };
}

function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    result.push(values[i] * k + result[i - 1] * (1 - k));
  }
  return result;
}

export function detectInflectionPoints(candles: PricePoint[]): InflectionPoint[] {
  if (candles.length < WINDOW + 2) return [];

  const prices = candles.map((c) => c.yesPrice);
  const volumes = candles.map((c) => c.volume);

  // Price velocity (first derivative)
  const velocity: number[] = [0];
  for (let i = 1; i < prices.length; i++) {
    velocity.push(prices[i] - prices[i - 1]);
  }

  // EMAs for reversal detection
  const ema5 = ema(prices, 5);
  const ema20 = ema(prices, 20);

  // Score each candle
  const scores: number[] = candles.map((_, i) => {
    if (i < WINDOW) return 0;

    // Price velocity z-score
    const velStats = rollingStats(velocity, i);
    const priceZ = Math.abs((velocity[i] - velStats.mean) / velStats.std);

    // Volume z-score
    const volStats = rollingStats(volumes, i);
    const volumeZ = volumes[i] > 0
      ? Math.max(0, (volumes[i] - volStats.mean) / volStats.std)
      : 0;

    // Reversal signal: EMA-5 crossing EMA-20
    const prevDiff = ema5[i - 1] - ema20[i - 1];
    const currDiff = ema5[i] - ema20[i];
    const reversalSignal = (prevDiff * currDiff < 0) ? Math.abs(currDiff - prevDiff) * 100 : 0;

    return 0.4 * priceZ + 0.3 * volumeZ + 0.3 * reversalSignal;
  });

  // Find candidates above threshold
  const candidates: number[] = [];
  for (let i = WINDOW; i < scores.length; i++) {
    if (scores[i] > SCORE_THRESHOLD) candidates.push(i);
  }

  // Merge adjacent candidates into event windows
  const windows: { start: number; end: number; peakIdx: number }[] = [];
  let windowStart = -1;
  let peakIdx = -1;
  let peakScore = -1;

  for (const idx of candidates) {
    if (windowStart === -1) {
      windowStart = idx;
      peakIdx = idx;
      peakScore = scores[idx];
    } else if (idx - (windows.length > 0 ? windows[windows.length - 1].end : windowStart) <= 3) {
      // Adjacent — extend window
      if (scores[idx] > peakScore) {
        peakIdx = idx;
        peakScore = scores[idx];
      }
    } else {
      windows.push({ start: windowStart, end: peakIdx, peakIdx });
      windowStart = idx;
      peakIdx = idx;
      peakScore = scores[idx];
    }
  }
  if (windowStart !== -1) {
    windows.push({ start: windowStart, end: peakIdx, peakIdx });
  }

  return windows.map((w) => {
    const i = w.peakIdx;
    const lookback = Math.max(0, w.start - 3);
    const lookforward = Math.min(candles.length - 1, w.end + 3);
    const priceBefore = prices[lookback];
    const priceAfter = prices[lookforward];
    const volStats = rollingStats(volumes, i);

    return {
      id: `ip-${candles[i].timestamp}`,
      timestamp: candles[i].timestamp,
      windowStart: candles[w.start].timestamp,
      windowEnd: candles[w.end].timestamp,
      priceAtPoint: prices[i],
      priceBefore,
      priceAfter,
      priceChangePercent: priceBefore > 0
        ? Math.round(((priceAfter - priceBefore) / priceBefore) * 1000) / 10
        : 0,
      volumeSpike: volStats.mean > 0
        ? Math.round((volumes[i] / volStats.mean) * 10) / 10
        : 0,
      compositeScore: Math.round(scores[i] * 100) / 100,
      direction: priceAfter >= priceBefore ? "up" : "down",
    };
  });
}
