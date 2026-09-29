import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ScreenShell } from "../../components/ScreenShell";
import { Button } from "../../primitives/Button";
import { Input } from "../../primitives/Input";
import { authClient } from "../../lib";
import type { AppAuthSession } from "../../lib";
import styles from "./Profile.module.css";

type Props = {
  session: AppAuthSession;
};

export function Profile({ session }: Props) {
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; error: boolean } | null>(null);

  const passwordFormValid = password.length >= 8 && password === passwordConfirmation && !savingPassword;

  function handlePasswordFormToggle() {
    setShowPasswordForm((visible) => !visible);
    setPassword("");
    setPasswordConfirmation("");
    setPasswordMessage(null);
  }

  async function handleChangePassword(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!passwordFormValid) return;

    try {
      setSavingPassword(true);
      setPasswordMessage(null);
      await authClient.changePassword(password);
      setPassword("");
      setPasswordConfirmation("");
      setShowPasswordForm(false);
      setPasswordMessage({ text: "Password updated.", error: false });
    } catch (err: any) {
      setPasswordMessage({ text: err.message ?? "Could not update password.", error: true });
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    await authClient.signOut();
    navigate("/");
  }

  return (
    <ScreenShell headerVariant="user">
      <div className={styles.page}>
        <h1 className={styles.title}>Profile</h1>
        <dl className={styles.detailList}>
          <dt>Username</dt>
          <dd>{session.username ?? "—"}</dd>
          <dt>Email</dt>
          <dd>{session.email}</dd>
        </dl>
        <section className={styles.passwordSection}>
          <Button
            text={showPasswordForm ? "Cancel password change" : "Change password"}
            variant="ghost"
            onClick={handlePasswordFormToggle}
          />
          {showPasswordForm && (
            <form className={styles.passwordForm} onSubmit={handleChangePassword}>
              <div className={styles.passwordField}>
                <p className={styles.fieldLabel}>New password</p>
                <Input
                  type="password"
                  value={password}
                  ariaLabel="New password, at least 8 characters"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className={styles.passwordField}>
                <p className={styles.fieldLabel}>Confirm new password</p>
                <Input
                  type="password"
                  value={passwordConfirmation}
                  ariaLabel="Confirm new password"
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                />
              </div>
              {passwordConfirmation && password !== passwordConfirmation && (
                <p className={styles.errorMessage} role="alert">Passwords do not match.</p>
              )}
              <Button
                type="submit"
                text={savingPassword ? "Saving..." : "Save password"}
                disabled={!passwordFormValid}
              />
            </form>
          )}
          {passwordMessage && (
            <p className={passwordMessage.error ? styles.errorMessage : styles.successMessage} role="status">
              {passwordMessage.text}
            </p>
          )}
        </section>
        <Button text={signingOut ? "Signing Out..." : "Sign Out"} variant="ghost" onClick={handleSignOut} disabled={signingOut} />
      </div>
    </ScreenShell>
  );
}
