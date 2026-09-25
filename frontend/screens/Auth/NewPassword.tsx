import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ScreenShell } from "../../components/ScreenShell";
import { AuthCard } from "../../components/AuthCard";
import { Input } from "../../primitives/Input";
import { Button } from "../../primitives/Button";
import { authClient } from "../../lib";
import styles from "./Auth.module.css";

export function NewPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = (location.state as { email?: string } | null)?.email ?? "";

  const [email, setEmail] = useState(emailFromState);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formValid = email.trim().length > 0 && code.trim().length > 0 && password.length >= 8 && !loading;

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formValid) return;

    try {
      setLoading(true);
      setErrorMessage(null);
      await authClient.resetPassword(email.trim(), code.trim(), password);
      navigate("/password-updated");
    } catch (err: any) {
      setErrorMessage(err.message ?? "Could not reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenShell>
      <div className={styles.centerPage}>
        <AuthCard>
          <h1 className={styles.brandTitle}>mtg-builder</h1>
          <h2 className={styles.smallHeading}>Enter your new password</h2>
          <form className={styles.signUpStack} onSubmit={handleSubmit}>
            <p className={styles.label}>email</p>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

            <p className={styles.label}>code</p>
            <Input type="text" value={code} onChange={(e) => setCode(e.target.value)} />

            <p className={styles.label}>new password</p>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

            <div className={styles.buttonRow}>
              <Button type="submit" text={loading ? "Saving..." : "Save password"} disabled={!formValid} />
            </div>
          </form>

          {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
        </AuthCard>
      </div>
    </ScreenShell>
  );
}
