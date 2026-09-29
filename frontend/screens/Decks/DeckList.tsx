import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ScreenShell } from "../../components/ScreenShell";
import { Button } from "../../primitives/Button";
import { decksApi } from "../../lib";
import type { DeckSummary } from "../../types";
import styles from "./DeckList.module.css";

const deckLanes = [
  { format: "standard", title: "Standard" },
  { format: "commander", title: "Commander" },
  { format: "limited", title: "Limited" },
  { format: "house", title: "House Rules" },
] as const;

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

        {decks && (
          <div className={styles.lanes}>
            {deckLanes.map((lane) => (
              <section key={lane.format} className={styles.lane}>
                <h2 className={styles.laneTitle}>{lane.title}</h2>
                <div className={styles.grid}>
                  {decks
                    .filter((deck) => deck.format === lane.format)
                    .map((deck) => (
                      <div key={deck.id} className={styles.card}>
                        <Link to={`/decks/${deck.id}`} className={styles.cardLink}>
                          <div className={styles.cardDetails}>
                            <h3 className={styles.deckName}>{deck.name}</h3>
                            <p className={styles.description}>{deck.description || "..."}</p>
                            <p className={styles.cardMeta}>
                              {deck.total_cards} card{deck.total_cards === 1 ? "" : "s"}
                            </p>
                          </div>
                          {deck.coverCard?.imageUrl && (
                            <img className={styles.coverImage} src={deck.coverCard.imageUrl} alt={deck.coverCard.name} loading="lazy" />
                          )}
                        </Link>
                      </div>
                    ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </ScreenShell>
  );
}
