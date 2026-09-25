export type DeckFormat = "house" | "standard" | "commander" | "limited";

export const DECK_FORMAT_LABELS: Record<DeckFormat, string> = {
  house: "House Rules",
  standard: "Standard Constructed",
  commander: "Commander (EDH)",
  limited: "Limited (Draft & Sealed)",
};

export const DECK_FORMAT_DESCRIPTIONS: Record<DeckFormat, string> = {
  house: "No rules — build with whatever cards you like.",
  standard: "60-card minimum, singleton exception for basic lands, max 4 copies of any other card.",
  commander: "Exactly 100 cards including one legendary commander, singleton, commander's color identity binds the deck.",
  limited: "40-card minimum built from a draft or sealed card pool.",
};

// Card fields we care about, sourced from the Scryfall API and/or persisted with a deck.
export type MtgCard = {
  scryfallId: string;
  name: string;
  manaCost: string | null;
  cmc: number | null;
  typeLine: string | null;
  oracleText: string | null;
  colorIdentity: string[];
  imageUrl: string | null;
  setName?: string | null;
};

export type DeckCard = MtgCard & {
  quantity: number;
  isCommander: boolean;
};

export type DeckSummary = {
  id: string;
  name: string;
  format: DeckFormat;
  description: string | null;
  created_at: string;
  updated_at: string;
  card_count: number;
  total_cards: number;
};

export type Deck = {
  id: string;
  name: string;
  format: DeckFormat;
  description: string | null;
  created_at: string;
  updated_at: string;
  cards: DeckCard[];
};
