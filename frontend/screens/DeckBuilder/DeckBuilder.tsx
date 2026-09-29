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

const SAVE_LABELS = {
  idle: "Save Deck",
  saving: "Saving...",
  saved: "Saved",
  failed: "Failed",
};

const DELETE_LABELS = {
  idle: "Delete Deck",
  deleting: "Deleting...",
  deleted: "Deleted",
  failed: "Failed",
};

export function DeckBuilder() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id) && id !== "new";

  const [name, setName] = useState("");
  const [format, setFormat] = useState<DeckFormat>("house");
  const [description, setDescription] = useState("");
  const [cards, setCards] = useState<DeckCard[]>([]);
  const [coverCardId, setCoverCardId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"browse" | "deck" | "cover">("browse");
  const [isSelectingCover, setIsSelectingCover] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MtgCard[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [loading, setLoading] = useState(isEditing);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "deleting" | "deleted" | "failed">("idle");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (saveStatus !== "saved") return;
    const timeout = setTimeout(() => setSaveStatus("idle"), 2000);
    return () => clearTimeout(timeout);
  }, [saveStatus]);

  useEffect(() => {
    if (deleteStatus !== "deleted") return;
    const timeout = setTimeout(() => navigate("/decks"), 2000);
    return () => clearTimeout(timeout);
  }, [deleteStatus, navigate]);

  useEffect(() => {
    if (!isEditing || !id) return;

    decksApi
      .get(id)
      .then((deck) => {
        setName(deck.name);
        setFormat(deck.format);
        setDescription(deck.description ?? "");
        setCards(deck.cards);
        setCoverCardId(deck.coverCardId ?? null);
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

  const totalCards = cards.reduce((sum, c) => sum + c.quantity, 0);
  const coverCard = cards.find((card) => card.scryfallId === coverCardId);

  function openDeckTab(tab: "browse" | "deck") {
    setIsSelectingCover(false);
    setActiveTab(tab);
  }

  function selectCoverCard(scryfallId: string) {
    setCoverCardId(scryfallId);
    setIsSelectingCover(false);
    setActiveTab("cover");
  }

  function addCard(card: MtgCard, amount: number) {
    setCards((prev) => {
      const existing = prev.find((c) => c.scryfallId === card.scryfallId);
      if (existing) {
        return prev.map((c) => (c.scryfallId === card.scryfallId ? { ...c, quantity: c.quantity + amount } : c));
      }
      return [...prev, { ...card, quantity: amount, isCommander: false }];
    });
  }

  function removeCard(scryfallId: string, amount: number) {
    const existing = cards.find((c) => c.scryfallId === scryfallId);
    if (coverCardId === scryfallId && existing && existing.quantity <= amount) {
      setCoverCardId(null);
      setIsSelectingCover(true);
      setActiveTab("cover");
    }

    setCards((prev) => {
      const existing = prev.find((c) => c.scryfallId === scryfallId);
      if (!existing) return prev;
      if (existing.quantity <= amount) return prev.filter((c) => c.scryfallId !== scryfallId);
      return prev.map((c) => (c.scryfallId === scryfallId ? { ...c, quantity: c.quantity - amount } : c));
    });
  }

  function setCommander(scryfallId: string) {
    setCards((prev) => prev.map((c) => ({ ...c, isCommander: c.scryfallId === scryfallId })));
  }

  async function handleSave() {
    if (!name.trim() || cards.length === 0 || !coverCard) return;

    try {
      setSaveStatus("saving");
      setSaveError(null);

      const input = { name: name.trim(), format, description: description.trim() || null, cards, coverCardId };
      const saved = isEditing && id ? await decksApi.update(id, input) : await decksApi.create(input);

      setSaveStatus("saved");
      // New decks move to their own URL so later saves update instead of creating duplicates.
      if (!isEditing) navigate(`/decks/${saved.id}`, { replace: true });
    } catch (err: any) {
      setSaveError(err.message ?? "Could not save deck.");
      setSaveStatus("failed");
    }
  }

  async function handleDelete() {
    if (!id || !window.confirm("Delete this deck? This cannot be undone.")) return;

    try {
      setDeleteStatus("deleting");
      setDeleteError(null);
      await decksApi.remove(id);
      setDeleteStatus("deleted");
    } catch (err: any) {
      setDeleteError(err.message ?? "Could not delete deck.");
      setDeleteStatus("failed");
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
          <label className={styles.metaLabel}>Description</label>
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
          {isEditing && (
            <div className={styles.deleteSlot}>
              <Button
                text={DELETE_LABELS[deleteStatus]}
                variant={deleteStatus === "deleted" ? "success" : deleteStatus === "failed" ? "failure" : "danger"}
                onClick={handleDelete}
                disabled={deleteStatus === "deleting" || deleteStatus === "deleted" || saveStatus === "saving"}
              />
            </div>
          )}
          <div className={styles.tabs} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "cover"}
              className={`${styles.tab} ${activeTab === "cover" ? styles.tabActive : ""} ${isSelectingCover ? styles.tabGhosted : ""}`}
              onClick={() => {
                setActiveTab("cover");
                setIsSelectingCover(!coverCard);
              }}
            >
              Cover Card
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "browse"}
              className={`${styles.tab} ${activeTab === "browse" ? styles.tabActive : ""}`}
              onClick={() => openDeckTab("browse")}
            >
              Browse
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "deck"}
              className={`${styles.tab} ${activeTab === "deck" ? styles.tabActive : ""}`}
              onClick={() => openDeckTab("deck")}
            >
              Edit Deck ({totalCards})
            </button>
          </div>
          <Button
            text={SAVE_LABELS[saveStatus]}
            variant={saveStatus === "saved" ? "success" : saveStatus === "failed" ? "failure" : "primary"}
            onClick={handleSave}
            disabled={saveStatus === "saving" || deleteStatus === "deleting" || deleteStatus === "deleted" || !name.trim() || cards.length === 0 || !coverCard}
          />
        </div>

        {(deleteError || saveError) && (
          <div className={styles.errorRow}>
            {deleteError && <p className={styles.deleteError}>{deleteError}</p>}
            {saveError && <p className={styles.saveError}>{saveError}</p>}
          </div>
        )}

        {activeTab === "cover" && isSelectingCover ? (
          <section className={styles.column}>
            <h2 className={styles.columnTitle}>Select a cover card</h2>
            <div className={styles.grid}>
              {cards.map((card) => (
                <CardTile
                  key={card.scryfallId}
                  card={card}
                  quantity={card.quantity}
                  isCommander={card.isCommander}
                  onAdd={(amount) => addCard(card, amount)}
                  onRemove={(amount) => removeCard(card.scryfallId, amount)}
                  onSetCommander={format === "commander" ? () => setCommander(card.scryfallId) : undefined}
                  onSelectCover={() => selectCoverCard(card.scryfallId)}
                />
              ))}
            </div>
            {cards.length === 0 && <p className={styles.empty}>Add cards in Browse before selecting a cover card.</p>}
          </section>
        ) : activeTab === "cover" ? (
          <section className={styles.column}>
            <div className={styles.coverHeader}>
              <h2 className={styles.columnTitle}>Cover Card</h2>
              <button type="button" className={styles.changeCoverButton} onClick={() => setIsSelectingCover(true)}>
                Change Cover
              </button>
            </div>
            {coverCard ? (
              <div className={styles.grid}>
                <CardTile
                  card={coverCard}
                  quantity={coverCard.quantity}
                  isCommander={coverCard.isCommander}
                  isCoverCard
                  onAdd={(amount) => addCard(coverCard, amount)}
                  onRemove={(amount) => removeCard(coverCard.scryfallId, amount)}
                  onSetCommander={format === "commander" ? () => setCommander(coverCard.scryfallId) : undefined}
                />
              </div>
            ) : (
              <p className={styles.empty}>Select a cover card from the deck.</p>
            )}
          </section>
        ) : activeTab === "deck" ? (
          <section className={styles.column}>
            <h2 className={styles.columnTitle}>Deck ({totalCards} cards)</h2>
            <div className={styles.grid}>
              {cards.map((card) => (
                <CardTile
                  key={card.scryfallId}
                  card={card}
                  quantity={card.quantity}
                  isCommander={card.isCommander}
                  isCoverCard={card.scryfallId === coverCardId}
                  onAdd={(amount) => addCard(card, amount)}
                  onRemove={(amount) => removeCard(card.scryfallId, amount)}
                  onSetCommander={format === "commander" ? () => setCommander(card.scryfallId) : undefined}
                />
              ))}
            </div>
            {cards.length === 0 && <p className={styles.empty}>Use the Browse tab to add cards to this deck.</p>}
          </section>
        ) : (
          <section className={styles.column}>
            <h2 className={styles.columnTitle}>Browse every Magic card</h2>
            <Input type="search" value={query} placeholder="Search by card name..." onChange={(e) => setQuery(e.target.value)} />
            {searching && <p className={styles.empty}>Searching...</p>}
            {searchError && <p className={styles.error}>{searchError}</p>}
            <div className={styles.grid}>
              {results.map((card) => {
                const deckCard = cards.find((c) => c.scryfallId === card.scryfallId);
                return (
                  <CardTile
                    key={card.scryfallId}
                    card={card}
                    quantity={deckCard?.quantity ?? 0}
                    isCommander={deckCard?.isCommander}
                    onAdd={(amount) => addCard(card, amount)}
                    onRemove={(amount) => removeCard(card.scryfallId, amount)}
                    onSetCommander={format === "commander" && deckCard ? () => setCommander(card.scryfallId) : undefined}
                  />
                );
              })}
            </div>
          </section>
        )}
      </div>
    </ScreenShell>
  );
}
