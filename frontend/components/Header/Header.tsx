import { Link } from "react-router-dom";
import flag from "../../assets/flag.jpg";
import styles from "./Header.module.css";

type Props = {
  homeLink?: string;
  variant?: "guest" | "user";
  showFlag?: boolean;
};

export function Header({ homeLink, variant = "guest", showFlag = true }: Props) {
  return (
    <header className={styles.header}>
      <Link className={styles.logo} to={homeLink ?? (variant === "user" ? "/decks" : "/")}>mtg-builder</Link>
      <div className={styles.headerRight}>
        {variant === "user" && (
          <nav className={styles.nav} aria-label="Primary">
            <Link className={styles.navLink} to="/profile">Profile</Link>
          </nav>
        )}
        {showFlag && (
          <a className={styles.flagLink} href="https://ncc.lnks.rip" target="_blank" rel="noopener noreferrer">
            <img className={styles.flag} src={flag} alt="NCC - no copyright code" />
          </a>
        )}
      </div>
    </header>
  );
}
