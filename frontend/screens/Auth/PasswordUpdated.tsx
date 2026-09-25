import { Link } from "react-router-dom";
import { ScreenShell } from "../../components/ScreenShell";
import { AuthCard } from "../../components/AuthCard";
import styles from "./Auth.module.css";

export function PasswordUpdated() {
  return (
    <ScreenShell>
      <div className={styles.centerPage}>
        <AuthCard>
          <h1 className={styles.brandTitle}>mtg-builder</h1>
          <h2 className={styles.smallHeading}>Your password has been updated</h2>
          <div className={styles.textLinks}>
            <Link to="/">Back to Sign In</Link>
          </div>
        </AuthCard>
      </div>
    </ScreenShell>
  );
}
