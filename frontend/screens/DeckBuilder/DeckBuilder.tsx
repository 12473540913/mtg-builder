import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ScreenShell } from "../../components/ScreenShell";
import { CardTile } from "../../components/CardTile";
import { Input } from "../../primitives/Input";
import { Button } from "../../primitives/Button";
import { decksApi, searchCards, validateDeck } from "../../lib";
import { DECK_FORMAT_DESCRIPTIONS, DECK_FORMAT_LABELS } from "../../types";
import type { DeckCard, DeckFormat, MtgCard } from "../../types";
import styles from "./DeckBuilder.module.css";

const FORMATS: DeckFormat[] = ["house", "standard", "commander", "limited"];

export function DeckBuilder() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id) && id !== "new";

  const [name, setName] = useState("");
  const [format, setFormat] = useState<DeckFormat>("house");
  const [description, setDescription] = useState("");
  const [cards, setCards] = useState<DeckCard[]>([]);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MtgCard[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditing || !id) return;

    decksApi
      .get(id)
      .then((deck) => {
        setName(deck.name);
        setFormat(deck.format);
        setDescription(deck.description ?? "");
        setCards(deck.cards);
      })
      .catch((err) => setErrorMessage(err.message ?? "Could not load deck."))
      .finally(() => setLoading(false));
  }, [id, isEditing]);

  // Debounce card search against Scryfall so we don't fire a request per keystroke.
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(() => {
      setSearching(true);
      setSearchError(null);
      searchCards(query)
        .then((result) => setResults(result.cards))
        .catch((err) => setSearchError(err.message ?? "Search failed."))
        .finally(() => setSearching(false));
    }, 350);

    return () => clearTimeout(timeout);
  }, [query]);

  const validation = useMemo(() => validateDeck(format, cards), [format, cards]);

  function addCard(card: MtgCard) {
    setCards((prev) => {
      const existing = prev.find((c) => c.scryfallId === card.scryfallId);
      if (existing) {
        return prev.map((c) => (c.scryfallId === card.scryfallId ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, { ...card, quantity: 1, isCommander: false }];
    });
  }

  function removeCard(scryfallId: string) {
    setCards((prev) => {
      const existing = prev.find((c) => c.scryfallId === scryfallId);
      if (!existing) return prev;
      if (existing.quantity <= 1) return prev.filter((c) => c.scryfallId !== scryfallId);
      return prev.map((c) => (c.scryfallId === scryfallId ? { ...c, quantity: c.quantity - 1 } : c));
    });
  }

  function setCommander(scryfallId: string) {
    setCards((prev) => prev.map((c) => ({ ...c, isCommander: c.scryfallId === scryfallId })));
  }

  async function handleSave() {
    if (!name.trim() || cards.length === 0) return;

    try {
      setSaving(true);
      setErrorMessage(null);

      const input = { name: name.trim(), format, description: description.trim() || null, cards };
      const saved = isEditing && id ? await decksApi.update(id, input) : await decksApi.create(input);

      navigate(`/decks/${saved.id}`);
    } catch (err: any) {
      setErrorMessage(err.message ?? "Could not save deck.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <ScreenShell headerVariant="user">
        <div className={styles.page}>Loading deck...</div>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell headerVariant="user">
      <div className={styles.page}>
        <div className={styles.metaRow}>
          <div className={styles.metaField}>
            <label className={styles.metaLabel}>Deck name</label>
            <Input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className={styles.metaField}>
            <label className={styles.metaLabel}>Format</label>
            <select className={styles.select} value={format} onChange={(e) => setFormat(e.target.value as DeckFormat)}>
              {FORMATS.map((f) => (
                <option key={f} value={f}>
                  {DECK_FORMAT_LABELS[f]}
                </option>
              ))}
            </select>
            <p className={styles.formatHint}>{DECK_FORMAT_DESCRIPTIONS[format]}</p>
          </div>
        </div>

        <div className={styles.metaField}>
          <label className={styles.metaLabel}>Description (optional)</label>
          <Input type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        {!validation.valid && (
          <ul className={styles.validationErrors}>
            {validation.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}

        {errorMessage && <p className={styles.error}>{errorMessage}</p>}

        <div className={styles.saveRow}>
          <Button
            text={saving ? "Saving..." : "Save Deck"}
            onClick={handleSave}
            disabled={saving || !name.trim() || cards.length === 0}
          />
        </div>

        <div className={styles.columns}>
          <section className={styles.column}>
            <h2 className={styles.columnTitle}>Deck ({cards.reduce((sum, c) => sum + c.quantity, 0)} cards)</h2>
            <div className={styles.grid}>
              {cards.map((card) => (
                <CardTile
                  key={card.scryfallId}
                  card={card}
                  quantity={card.quantity}
                  isCommander={card.isCommander}
                  onAdd={() => addCard(card)}
                  onRemove={() => removeCard(card.scryfallId)}
                  onSetCommander={format === "commander" ? () => setCommander(card.scryfallId) : undefined}
                />
              ))}
              {cards.length === 0 && <p className={styles.empty}>Search for cards on the right to add them here.</p>}
            </div>
          </section>

          <section className={styles.column}>
            <h2 className={styles.columnTitle}>Browse every Magic card</h2>
            <Input type="search" value={query} placeholder="Search by name, type, or text..." onChange={(e) => setQuery(e.target.value)} />
            {searching && <p className={styles.empty}>Searching...</p>}
            {searchError && <p className={styles.error}>{searchError}</p>}
            <div className={styles.grid}>
              {results.map((card) => (
                <CardTile key={card.scryfallId} card={card} onAdd={() => addCard(card)} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </ScreenShell>
  );
}
