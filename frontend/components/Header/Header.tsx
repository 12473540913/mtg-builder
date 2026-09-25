import { Link } from "react-router-dom";
import styles from "./Header.module.css";

type Props = {
  homeLink?: string;
  variant?: "guest" | "user";
};

export function Header({ homeLink = "/", variant = "guest" }: Props) {
  return (
    <header className={styles.header}>
      <Link className={styles.logo} to={homeLink}>mtg-builder</Link>
      {variant === "user" && (
        <nav className={styles.nav} aria-label="Primary">
          <Link className={styles.navLink} to="/decks">My Decks</Link>
          <Link className={styles.navLink} to="/profile">Profile</Link>
        </nav>
      )}
    </header>
  );
}
