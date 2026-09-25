import type { DeckCard, DeckFormat } from "../types";
import { isBasicLand } from "./scryfall";

export type DeckValidation = {
  valid: boolean;
  errors: string[];
};

function totalCount(cards: DeckCard[]): number {
  return cards.reduce((sum, card) => sum + card.quantity, 0);
}

function validateStandard(cards: DeckCard[]): string[] {
  const errors: string[] = [];
  const total = totalCount(cards);

  if (total < 60) {
    errors.push(`Standard decks need at least 60 cards (currently ${total}).`);
  }

  for (const card of cards) {
    if (!isBasicLand(card.name) && card.quantity > 4) {
      errors.push(`"${card.name}" has ${card.quantity} copies — max 4 allowed outside of basic lands.`);
    }
  }

  return errors;
}

function validateCommander(cards: DeckCard[]): string[] {
  const errors: string[] = [];
  const total = totalCount(cards);
  const commanders = cards.filter((card) => card.isCommander);

  if (total !== 100) {
    errors.push(`Commander decks must have exactly 100 cards, including the commander (currently ${total}).`);
  }

  if (commanders.length !== 1) {
    errors.push("Choose exactly one commander.");
  }

  for (const card of cards) {
    if (!isBasicLand(card.name) && card.quantity > 1) {
      errors.push(`"${card.name}" has ${card.quantity} copies — Commander is singleton (basic lands excepted).`);
    }
  }

  const commander = commanders[0];
  if (commander) {
    const isLegendaryCreature = /legendary/i.test(commander.typeLine ?? "") && /creature/i.test(commander.typeLine ?? "");
    const canBeCommander = /can be your commander/i.test(commander.oracleText ?? "");
    if (!isLegendaryCreature && !canBeCommander) {
      errors.push(`"${commander.name}" cannot be a commander — must be a legendary creature (or say "can be your commander").`);
    }

    const commanderColors = new Set(commander.colorIdentity);
    for (const card of cards) {
      if (card.isCommander) continue;
      const outOfIdentity = card.colorIdentity.filter((color) => !commanderColors.has(color));
      if (outOfIdentity.length > 0) {
        errors.push(`"${card.name}" is outside the commander's color identity (${outOfIdentity.join(", ")}).`);
      }
    }
  }

  return errors;
}

function validateLimited(cards: DeckCard[]): string[] {
  const errors: string[] = [];
  const total = totalCount(cards);

  if (total < 40) {
    errors.push(`Limited decks need at least 40 cards (currently ${total}).`);
  }

  return errors;
}

export function validateDeck(format: DeckFormat, cards: DeckCard[]): DeckValidation {
  let errors: string[] = [];

  switch (format) {
    case "house":
      errors = [];
      break;
    case "standard":
      errors = validateStandard(cards);
      break;
    case "commander":
      errors = validateCommander(cards);
      break;
    case "limited":
      errors = validateLimited(cards);
      break;
  }

  return { valid: errors.length === 0, errors };
}
