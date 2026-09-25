import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { ScreenShell } from "../../components/ScreenShell";
import { AuthCard } from "../../components/AuthCard";
import { Input } from "../../primitives/Input";
import { Button } from "../../primitives/Button";
import { authClient } from "../../lib";
import styles from "./Auth.module.css";

export function ForgotCredentials() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const emailTrimmed = email.trim();
  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed), [emailTrimmed]);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!emailValid || loading) return;

    try {
      setLoading(true);
      setErrorMessage(null);
      await authClient.requestPasswordReset(emailTrimmed);
      navigate("/reset-password", { state: { email: emailTrimmed } });
    } catch (err: any) {
      setErrorMessage(err.message ?? "Could not send reset code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenShell>
      <div className={styles.centerPage}>
        <AuthCard>
          <h1 className={styles.brandTitle}>mtg-builder</h1>
          <h2 className={styles.smallHeading}>Reset your password</h2>
          <form className={styles.signUpStack} onSubmit={handleSubmit}>
            <p className={styles.label}>email</p>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

            <div className={styles.buttonRow}>
              <Button type="submit" text={loading ? "Sending..." : "Send reset code"} disabled={!emailValid || loading} />
            </div>
          </form>

          {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}

          <div className={styles.textLinks}>
            <Link to="/">Back to Sign In</Link>
          </div>
        </AuthCard>
      </div>
    </ScreenShell>
  );
}
