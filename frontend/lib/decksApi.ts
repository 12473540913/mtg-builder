import type { Deck, DeckCard, DeckFormat, DeckSummary } from "../types";
import { apiUrl } from "./api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    throw new Error(payload?.error ?? "Request failed.");
  }

  return payload.data as T;
}

export type SaveDeckInput = {
  name: string;
  format: DeckFormat;
  description?: string | null;
  cards: DeckCard[];
};

function toApiCards(cards: DeckCard[]) {
  return cards.map((card) => ({
    scryfallId: card.scryfallId,
    name: card.name,
    quantity: card.quantity,
    manaCost: card.manaCost,
    cmc: card.cmc,
    typeLine: card.typeLine,
    oracleText: card.oracleText,
    colorIdentity: card.colorIdentity,
    imageUrl: card.imageUrl,
    isCommander: card.isCommander,
  }));
}

export const decksApi = {
  list(): Promise<DeckSummary[]> {
    return request<DeckSummary[]>("/api/decks");
  },

  get(id: string): Promise<Deck> {
    return request<Deck>(`/api/decks/${id}`);
  },

  create(input: SaveDeckInput): Promise<Deck> {
    return request<Deck>("/api/decks", {
      method: "POST",
      body: JSON.stringify({ ...input, cards: toApiCards(input.cards) }),
    });
  },

  update(id: string, input: SaveDeckInput): Promise<Deck> {
    return request<Deck>(`/api/decks/${id}`, {
      method: "PUT",
      body: JSON.stringify({ ...input, cards: toApiCards(input.cards) }),
    });
  },

  remove(id: string): Promise<void> {
    return request<void>(`/api/decks/${id}`, { method: "DELETE" });
  },
};
