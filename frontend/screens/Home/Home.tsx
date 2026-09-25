import { Link } from "react-router-dom";
import { ScreenShell } from "../../components/ScreenShell";
import styles from "./Home.module.css";

export function Home() {
  return (
    <ScreenShell headerVariant="user">
      <div className={styles.homePage}>
        <h1 className={styles.title}>mtg-builder</h1>
        <p className={styles.subtitle}>Build, save, and browse Magic: The Gathering decks from every available card.</p>
        <nav className={styles.homeNav} aria-label="Primary">
          <Link className={styles.navCard} to="/decks">My Decks</Link>
          <Link className={styles.navCard} to="/decks/new">New Deck</Link>
        </nav>
      </div>
    </ScreenShell>
  );
}
