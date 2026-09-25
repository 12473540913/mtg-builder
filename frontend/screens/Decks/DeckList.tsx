import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ScreenShell } from "../../components/ScreenShell";
import { Button } from "../../primitives/Button";
import { decksApi } from "../../lib";
import { DECK_FORMAT_LABELS } from "../../types";
import type { DeckSummary } from "../../types";
import styles from "./DeckList.module.css";

export function DeckList() {
  const [decks, setDecks] = useState<DeckSummary[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;

    decksApi
      .list()
      .then((data) => {
        if (!disposed) setDecks(data);
      })
      .catch((err) => {
        if (!disposed) setErrorMessage(err.message ?? "Could not load decks.");
      });

    return () => {
      disposed = true;
    };
  }, []);

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this deck? This cannot be undone.")) return;

    try {
      await decksApi.remove(id);
      setDecks((prev) => prev?.filter((deck) => deck.id !== id) ?? null);
    } catch (err: any) {
      setErrorMessage(err.message ?? "Could not delete deck.");
    }
  }

  return (
    <ScreenShell headerVariant="user">
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>My Decks</h1>
          <Link to="/decks/new">
            <Button text="New Deck" />
          </Link>
        </div>

        {errorMessage && <p className={styles.error}>{errorMessage}</p>}

        {decks === null && !errorMessage && <p className={styles.empty}>Loading decks...</p>}
        {decks && decks.length === 0 && <p className={styles.empty}>You haven't saved any decks yet.</p>}

        <div className={styles.grid}>
          {decks?.map((deck) => (
            <div key={deck.id} className={styles.card}>
              <Link to={`/decks/${deck.id}`} className={styles.cardLink}>
                <h2 className={styles.deckName}>{deck.name}</h2>
                <span className={styles.formatBadge}>{DECK_FORMAT_LABELS[deck.format]}</span>
                <p className={styles.cardMeta}>
                  {deck.total_cards} card{deck.total_cards === 1 ? "" : "s"}
                </p>
              </Link>
              <button type="button" className={styles.deleteButton} onClick={() => handleDelete(deck.id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </ScreenShell>
  );
}
