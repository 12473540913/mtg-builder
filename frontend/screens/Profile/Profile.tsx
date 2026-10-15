import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { ScreenShell } from "../../components/ScreenShell";
import { PasswordRequirements } from "../../components/PasswordRequirements/PasswordRequirements";
import { Button } from "../../primitives/Button";
import { Input } from "../../primitives/Input";
import { authClient, type AppAuthSession } from "../../lib";
import { getUnmetPasswordRequirements } from "../../lib/password";
import styles from "./Profile.module.css";

type Props = {
  session: AppAuthSession | null;
};

const SECTIONS = [
  { id: "identity", label: "Identity" },
  { id: "update", label: "Update Profile" },
  { id: "about", label: "About" },
] as const;

type ProfileSection = typeof SECTIONS[number]["id"];
type Message = { text: string; error: boolean };

export function Profile({ session }: Props) {
  const [activeSection, setActiveSection] = useState<ProfileSection>("identity");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const passwordDialog = useRef<HTMLDialogElement>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<Message | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const userId = session?.userId;

  useEffect(() => {
    setShowPasswordForm(false);
    setCurrentPassword("");
    setPassword("");
    setPasswordConfirmation("");
    setPasswordMessage(null);
    setSessionError(null);
  }, [userId]);

  useEffect(() => {
    const dialog = passwordDialog.current;
    if (showPasswordForm) {
      dialog?.showModal();
    } else {
      dialog?.close();
    }
  }, [showPasswordForm]);

  const busy = savingPassword || signingOut;
  const passwordStrong = getUnmetPasswordRequirements(password).length === 0;
  const passwordFormValid = currentPassword.length > 0 && passwordStrong &&
    password === passwordConfirmation && !busy;

  async function handleChangePassword(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passwordFormValid) return;
    setSavingPassword(true);
    setPasswordMessage(null);
    try {
      await authClient.changePassword(currentPassword, password);
      setCurrentPassword("");
      setPassword("");
      setPasswordConfirmation("");
      setPasswordMessage({ text: "Password updated.", error: false });
    } catch (error) {
      console.error("Could not update password", error);
      setPasswordMessage({ text: error instanceof Error ? error.message : "Could not update password.", error: true });
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    setSessionError(null);
    try {
      await authClient.signOut();
    } catch (error) {
      console.error("Could not sign out", error);
      setSessionError(error instanceof Error ? error.message : "Could not sign out.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <ScreenShell>
      <div className={styles.page}>
        <h1 className={styles.title}>Profile</h1>
        <div className={styles.layout}>
          <nav className={styles.sideNav} aria-label="Profile sections">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                className={`${styles.sideNavButton} ${activeSection === section.id ? styles.active : ""}`}
                aria-current={activeSection === section.id ? "page" : undefined}
                aria-controls={activeSection === section.id ? `profile-${section.id}` : undefined}
                onClick={() => setActiveSection(section.id)}
              >
                {section.label}
              </button>
            ))}
          </nav>
          <div className={styles.content}>
            {activeSection === "identity" && (
              <section id="profile-identity" className={styles.card} aria-labelledby="identity-heading">
                <h2 id="identity-heading" className={styles.sectionTitle}>Identity</h2>
                {session ? (
                  <dl className={styles.detailList}>
                    <div><dt>Email</dt><dd>{session.email}</dd></div>
                    <div><dt>Email verified</dt><dd>{session.emailVerified ? "Yes" : "No"}</dd></div>
                  </dl>
                ) : (
                  <p><Link to="/">Sign in</Link> to view your account information.</p>
                )}
              </section>
            )}
            {activeSection === "update" && (
              <section id="profile-update" className={`${styles.card} ${styles.panel}`} aria-label="Account actions">
                <div className={styles.sessionActions}>
                  {session ? (
                    <>
                      <Button text={signingOut ? "Signing Out..." : "Sign Out"} variant="ghost" onClick={handleSignOut} disabled={busy} />
                      <Button text="Change Password" onClick={() => {
                        setCurrentPassword("");
                        setPassword("");
                        setPasswordConfirmation("");
                        setPasswordMessage(null);
                        setShowPasswordForm(true);
                      }} disabled={busy} />
                    </>
                  ) : (
                    <Link className={styles.signInLink} to="/">Sign In</Link>
                  )}
                </div>
                {sessionError && <p className={styles.errorMessage} role="alert">{sessionError}</p>}
              </section>
            )}
            {session && (
                  <dialog
                    ref={passwordDialog}
                    className={styles.passwordDialog}
                    aria-labelledby="password-heading"
                    onCancel={(event) => {
                      if (savingPassword) event.preventDefault();
                    }}
                    onClose={() => {
                      setShowPasswordForm(false);
                      setCurrentPassword("");
                      setPassword("");
                      setPasswordConfirmation("");
                      setPasswordMessage(null);
                    }}
                  >
                    <h2 id="password-heading" className={styles.sectionTitle}>Change Password</h2>
                    <form className={styles.form} onSubmit={handleChangePassword}>
                      <fieldset className={styles.fields} disabled={busy}>
                        <div className={styles.field}>
                          <p className={styles.fieldLabel}>Current Password</p>
                          <Input type="password" value={currentPassword} ariaLabel="Current password" onChange={(event) => setCurrentPassword(event.target.value)} />
                        </div>
                        <div className={styles.field}>
                          <p className={styles.fieldLabel}>New Password</p>
                          <Input type="password" value={password} ariaLabel="New password" onChange={(event) => setPassword(event.target.value)} />
                          <PasswordRequirements password={password} />
                        </div>
                        <div className={styles.field}>
                          <p className={styles.fieldLabel}>Confirm Password</p>
                          <Input type="password" value={passwordConfirmation} ariaLabel="Confirm password" onChange={(event) => setPasswordConfirmation(event.target.value)} />
                        </div>
                        {passwordConfirmation && password !== passwordConfirmation && <p className={styles.errorMessage} role="alert">Passwords do not match.</p>}
                        <div className={styles.sessionActions}>
                          <Button text="Close" variant="ghost" onClick={() => passwordDialog.current?.close()} disabled={savingPassword} />
                          <Button type="submit" text={savingPassword ? "Saving..." : "Submit"} disabled={!passwordFormValid} />
                        </div>
                      </fieldset>
                      {passwordMessage && <p className={passwordMessage.error ? styles.errorMessage : styles.successMessage} role={passwordMessage.error ? "alert" : "status"}>{passwordMessage.text}</p>}
                    </form>
                  </dialog>
            )}
            {activeSection === "about" && (
              <div id="profile-about" className={styles.panel}>
                <section className={styles.card} aria-labelledby="app-heading">
                  <h2 id="app-heading" className={styles.sectionTitle}>About MTG Builder</h2>
                  <p>MTG Builder helps you build and save Magic: The Gathering deck combinations from every available card. Search the card catalog, assemble decks with card images, and organize saved decks with House, Standard Constructed, Commander, or Limited rules.</p>
                  <p>It is a deck-building tool, not a collection tracker. You are responsible for building decks from the cards available to you.</p>
                  <p>Repository: <a href="https://github.com/1247350913/mtg-builder" target="_blank" rel="noopener noreferrer">github.com/1247350913/mtg-builder</a></p>
                  <p>Contact: open an issue in the repository for bugs, feedback, and feature requests.</p>
                </section>
                <section className={styles.card} aria-labelledby="ncc-heading">
                  <h2 id="ncc-heading" className={styles.sectionTitle}>About NCC</h2>
                  <p>See <a href="https://ncc.lnks.rip" target="_blank" rel="noopener noreferrer">website</a> for more details.</p>
                  <p>Repository: <a href="https://github.com/1247350913/ncc" target="_blank" rel="noopener noreferrer">github.com/1247350913/ncc</a></p>
                  <p>Contact: open an issue in the repository for bugs, feedback, and feature requests.</p>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </ScreenShell>
  );
}
