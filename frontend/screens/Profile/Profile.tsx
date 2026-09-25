import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ScreenShell } from "../../components/ScreenShell";
import { Button } from "../../primitives/Button";
import { authClient } from "../../lib";
import type { AppAuthSession } from "../../lib";
import styles from "./Profile.module.css";

type Props = {
  session: AppAuthSession;
};

export function Profile({ session }: Props) {
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

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
        <Button text={signingOut ? "Signing Out..." : "Sign Out"} variant="ghost" onClick={handleSignOut} disabled={signingOut} />
      </div>
    </ScreenShell>
  );
}
