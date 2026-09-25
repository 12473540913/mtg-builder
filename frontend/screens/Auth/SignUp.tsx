import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { ScreenShell } from "../../components/ScreenShell";
import { AuthCard } from "../../components/AuthCard";
import { Input } from "../../primitives/Input";
import { Button } from "../../primitives/Button";
import { authClient } from "../../lib";
import styles from "./Auth.module.css";
import { CodeEntry } from "./CodeEntry";

export function SignUp() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [awaitingCode, setAwaitingCode] = useState(false);

  const emailTrimmed = email.trim();
  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed), [emailTrimmed]);
  const formValid = emailValid && username.trim().length > 0 && password.length >= 8 && !loading;

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formValid) return;

    try {
      setLoading(true);
      setErrorMessage(null);
      await authClient.signUp(emailTrimmed, username.trim(), password);
      setAwaitingCode(true);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message ?? "Could not sign up.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(code: string) {
    await authClient.verifySignUp(emailTrimmed, code);
    await authClient.signIn(emailTrimmed, password);
    navigate("/decks");
  }

  if (awaitingCode) {
    return (
      <CodeEntry
        heading="Check your email for a verification code."
        onSubmitCode={handleVerify}
        onResend={() => authClient.resendSignUpCode(emailTrimmed)}
      />
    );
  }

  return (
    <ScreenShell>
      <div className={styles.centerPage}>
        <AuthCard>
          <h1 className={styles.brandTitle}>mtg-builder</h1>
          <h2 className={styles.smallHeading}>Sign Up</h2>
          <form className={styles.signUpStack} onSubmit={handleSubmit}>
            <p className={styles.label}>email</p>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

            <p className={styles.label}>username</p>
            <Input type="username" value={username} onChange={(e) => setUsername(e.target.value)} />

            <p className={styles.label}>password</p>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

            <div className={styles.buttonRow}>
              <Button type="submit" text={loading ? "Signing Up..." : "Sign Up"} disabled={!formValid} />
            </div>
          </form>

          {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}

          <div className={styles.textLinks}>
            <Link to="/">Already have an account? Sign In here.</Link>
          </div>
        </AuthCard>
      </div>
    </ScreenShell>
  );
}
