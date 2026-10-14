import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <a className={styles.link} href="https://ncc.lnks.rip" target="_blank" rel="noopener noreferrer">NCC - no copyright code</a>
    </footer>
  );
}
