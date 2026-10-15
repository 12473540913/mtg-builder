import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { ScreenShell } from "../../components/ScreenShell";
import { AuthCard } from "../../components/AuthCard";
import { PasswordRequirements } from "../../components/PasswordRequirements/PasswordRequirements";
import { Input } from "../../primitives/Input";
import { Button } from "../../primitives/Button";
import { authClient } from "../../lib";
import { getUnmetPasswordRequirements } from "../../lib/password";
import styles from "./Auth.module.css";
import { CodeEntry } from "./CodeEntry";

export function SignUp() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [awaitingCode, setAwaitingCode] = useState(false);

  const emailTrimmed = email.trim();
  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed), [emailTrimmed]);
  const formValid = emailValid && getUnmetPasswordRequirements(password).length === 0 && !loading;

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formValid) return;

    try {
      setLoading(true);
      setErrorMessage(null);
      await authClient.signUp(emailTrimmed, password);
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
          <h2 className={styles.smallHeading}>Create Account</h2>
          <form className={styles.signUpStack} onSubmit={handleSubmit}>
            <p className={styles.label}>email</p>
            <Input type="email" value={email} ariaLabel="Email" onChange={(e) => setEmail(e.target.value)} />

            <p className={styles.label}>password</p>
            <div className={styles.passwordField}>
              <Input type="password" value={password} ariaLabel="Password" onChange={(e) => setPassword(e.target.value)} />
              <PasswordRequirements password={password} />
            </div>

            <div className={styles.buttonRow}>
              <Button type="submit" text={loading ? "Signing Up..." : "Sign Up"} disabled={!formValid} />
            </div>
          </form>

          {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}

          <div className={styles.textLinks}>
            <Link to="/">Back to sign in</Link>
          </div>
        </AuthCard>
      </div>
    </ScreenShell>
  );
}
