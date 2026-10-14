import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ScreenShell } from "../../components/ScreenShell";
import { Button } from "../../primitives/Button";
import { Input } from "../../primitives/Input";
import { authClient, type AppAuthSession } from "../../lib";
import { loadAppProfile, saveAppProfile } from "../../lib/profile";
import type { AppProfile } from "../../../shared/profile";
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
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(Boolean(session));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<Message | null>(null);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<Message | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const userId = session?.userId;

  useEffect(() => {
    let disposed = false;
    setProfile(null);
    setUsername("");
    setLoadError(null);
    setProfileMessage(null);
    setPassword("");
    setPasswordConfirmation("");
    setPasswordMessage(null);
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void loadAppProfile().then((nextProfile) => {
      if (disposed) return;
      setProfile(nextProfile);
      setUsername(nextProfile.username ?? "");
    }).catch((error: unknown) => {
      if (disposed) return;
      console.error("Could not load profile", error);
      setLoadError(error instanceof Error ? error.message : "Could not load profile.");
    }).finally(() => {
      if (!disposed) setLoading(false);
    });
    return () => { disposed = true; };
  }, [userId, loadAttempt]);

  const busy = savingProfile || savingPassword || signingOut;
  const trimmedUsername = username.trim();
  const profileFormValid = Boolean(profile) && trimmedUsername.length >= 3 &&
    trimmedUsername.length <= 100 && trimmedUsername !== profile?.username && !busy;
  const passwordStrong = password.length >= 8 && /[a-z]/.test(password) &&
    /[A-Z]/.test(password) && /[0-9]/.test(password);
  const passwordFormValid = passwordStrong && password === passwordConfirmation && !busy;

  async function handleProfileSave(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profileFormValid) return;
    setSavingProfile(true);
    setProfileMessage(null);
    try {
      const saved = await saveAppProfile({ username: trimmedUsername });
      setProfile(saved);
      setUsername(saved.username ?? "");
      setProfileMessage({ text: "Profile updated.", error: false });
    } catch (error) {
      console.error("Could not update profile", error);
      setProfileMessage({ text: error instanceof Error ? error.message : "Could not update profile.", error: true });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passwordFormValid) return;
    setSavingPassword(true);
    setPasswordMessage(null);
    try {
      await authClient.changePassword(password);
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
            {activeSection !== "about" && session && (
              <>
                {loading && <p role="status">Loading profile...</p>}
                {loadError && (
                  <div className={styles.notice}>
                    <p className={styles.errorMessage} role="alert">{loadError}</p>
                    <Button text="Retry" variant="ghost" onClick={() => setLoadAttempt((attempt) => attempt + 1)} />
                  </div>
                )}
              </>
            )}
            {activeSection === "identity" && (
              <section id="profile-identity" className={styles.card} aria-labelledby="identity-heading">
                <h2 id="identity-heading" className={styles.sectionTitle}>Identity</h2>
                {session ? (
                  <dl className={styles.detailList}>
                    <div><dt>Email</dt><dd>{session.email}</dd></div>
                    <div><dt>Username</dt><dd>{profile?.username ?? (loading ? "Loading..." : loadError ? "Unavailable" : "Not set")}</dd></div>
                    <div><dt>Email verified</dt><dd>{session.emailVerified ? "Yes" : "No"}</dd></div>
                  </dl>
                ) : (
                  <p><Link to="/">Sign in</Link> to view your account information.</p>
                )}
              </section>
            )}
            {activeSection === "update" && (
              <div id="profile-update" className={styles.panel}>
                {session && (
                  <>
                    <section className={styles.card} aria-labelledby="details-heading">
                      <h2 id="details-heading" className={styles.sectionTitle}>Profile Details</h2>
                      <form className={styles.form} onSubmit={handleProfileSave}>
                        <fieldset className={styles.fields} disabled={loading || !profile || busy}>
                          <div className={styles.field}>
                            <p className={styles.fieldLabel}>Username</p>
                            <Input type="username" value={username} ariaLabel="Username" onChange={(event) => setUsername(event.target.value)} />
                            <p className={styles.hint}>3-100 characters. This updates your MTG Builder profile, not your sign-in credentials.</p>
                          </div>
                          <Button type="submit" text={savingProfile ? "Saving..." : "Save Profile Updates"} disabled={!profileFormValid} />
                        </fieldset>
                        {profileMessage && <p className={profileMessage.error ? styles.errorMessage : styles.successMessage} role={profileMessage.error ? "alert" : "status"}>{profileMessage.text}</p>}
                      </form>
                    </section>
                    <section className={styles.card} aria-labelledby="password-heading">
                      <h2 id="password-heading" className={styles.sectionTitle}>Change Password</h2>
                      <form className={styles.form} onSubmit={handleChangePassword}>
                        <fieldset className={styles.fields} disabled={busy}>
                          <div className={styles.field}>
                            <p className={styles.fieldLabel}>New Password</p>
                            <Input type="password" value={password} ariaLabel="New password" onChange={(event) => setPassword(event.target.value)} />
                            <p className={styles.hint}>At least 8 characters, including lowercase, uppercase, and a number.</p>
                          </div>
                          <div className={styles.field}>
                            <p className={styles.fieldLabel}>Confirm Password</p>
                            <Input type="password" value={passwordConfirmation} ariaLabel="Confirm password" onChange={(event) => setPasswordConfirmation(event.target.value)} />
                          </div>
                          {passwordConfirmation && password !== passwordConfirmation && <p className={styles.errorMessage} role="alert">Passwords do not match.</p>}
                          <Button type="submit" text={savingPassword ? "Saving..." : "Change Password"} disabled={!passwordFormValid} />
                        </fieldset>
                        {passwordMessage && <p className={passwordMessage.error ? styles.errorMessage : styles.successMessage} role={passwordMessage.error ? "alert" : "status"}>{passwordMessage.text}</p>}
                      </form>
                    </section>
                  </>
                )}
                <section className={styles.card} aria-labelledby="session-heading">
                  <h2 id="session-heading" className={styles.sectionTitle}>Session &amp; Account</h2>
                  <div className={styles.sessionActions}>
                    {session ? (
                      <Button text={signingOut ? "Signing Out..." : "Sign Out"} variant="ghost" onClick={handleSignOut} disabled={busy} />
                    ) : (
                      <Link className={styles.signInLink} to="/">Sign In</Link>
                    )}
                  </div>
                  {sessionError && <p className={styles.errorMessage} role="alert">{sessionError}</p>}
                </section>
              </div>
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
                  <p>NCC - no copyright code.</p>
                  <p>See the <a href="https://ncc.lnks.rip" target="_blank" rel="noopener noreferrer">NCC website</a> for more details.</p>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </ScreenShell>
  );
}
