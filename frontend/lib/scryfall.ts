import type { MtgCard } from "../types";

// Scryfall's public API explicitly allows direct browser use (CORS-enabled), so the
// frontend talks to it straight — no backend proxy needed for "every available card".
const SCRYFALL_BASE = "https://api.scryfall.com";

type ScryfallCardResponse = {
  id: string;
  name: string;
  mana_cost?: string;
  cmc?: number;
  type_line?: string;
  oracle_text?: string;
  color_identity?: string[];
  set_name?: string;
  image_uris?: { normal?: string; small?: string; large?: string };
  card_faces?: Array<{
    name?: string;
    mana_cost?: string;
    oracle_text?: string;
    image_uris?: { normal?: string; small?: string; large?: string };
  }>;
};

function mapCard(card: ScryfallCardResponse): MtgCard {
  const face = card.image_uris ? card : card.card_faces?.[0];

  return {
    scryfallId: card.id,
    name: card.name,
    manaCost: card.mana_cost ?? card.card_faces?.[0]?.mana_cost ?? null,
    cmc: typeof card.cmc === "number" ? card.cmc : null,
    typeLine: card.type_line ?? null,
    oracleText: card.oracle_text ?? card.card_faces?.[0]?.oracle_text ?? null,
    colorIdentity: card.color_identity ?? [],
    imageUrl: face?.image_uris?.normal ?? face?.image_uris?.large ?? face?.image_uris?.small ?? null,
    setName: card.set_name ?? null,
  };
}

export type ScryfallSearchResult = {
  cards: MtgCard[];
  hasMore: boolean;
  totalCards: number;
  nextPage: string | null;
};

// Searches the full Scryfall card database ("every available card"), one page at a time.
export async function searchCards(query: string, page = 1): Promise<ScryfallSearchResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { cards: [], hasMore: false, totalCards: 0, nextPage: null };
  }

  const url = `${SCRYFALL_BASE}/cards/search?q=${encodeURIComponent(trimmed)}&order=name&page=${page}`;
  const response = await fetch(url);

  if (response.status === 404) {
    return { cards: [], hasMore: false, totalCards: 0, nextPage: null };
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.details ?? "Could not search cards.");
  }

  const payload = await response.json();

  return {
    cards: (payload.data as ScryfallCardResponse[]).map(mapCard),
    hasMore: Boolean(payload.has_more),
    totalCards: Number(payload.total_cards ?? 0),
    nextPage: payload.has_more ? String(page + 1) : null,
  };
}

export async function getCardById(scryfallId: string): Promise<MtgCard | null> {
  const response = await fetch(`${SCRYFALL_BASE}/cards/${scryfallId}`);
  if (!response.ok) return null;

  const payload = (await response.json()) as ScryfallCardResponse;
  return mapCard(payload);
}

const BASIC_LAND_NAMES = new Set(["Plains", "Island", "Swamp", "Mountain", "Forest", "Wastes"]);

export function isBasicLand(name: string): boolean {
  return BASIC_LAND_NAMES.has(name);
}
