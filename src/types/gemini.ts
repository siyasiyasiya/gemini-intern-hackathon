export interface GeminiPosition {
  symbol: string;
  quantity: string;
  avgPrice: string;
  realizedPl: string;
  outcome: string;
  prices: {
    buy?: { yes?: string; no?: string };
    sell?: { yes?: string; no?: string };
    lastTradePrice?: string;
  };
}

export interface GeminiSettledPosition {
  symbol: string;
  quantity: string;
  costBasis: string;
  netProfit: string;
  payout: string;
  resolutionSide: string;
}

export interface GeminiOrder {
  orderId: string;
  symbol: string;
  side: string;
  outcome: string;
  quantity: string;
  price: string;
  status: string;
  filledQuantity: string;
  createdAt: string;
  updatedAt: string;
}
