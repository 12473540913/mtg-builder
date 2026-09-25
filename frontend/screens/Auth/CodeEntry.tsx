import { useState } from "react";
import { ScreenShell } from "../../components/ScreenShell";
import { Input } from "../../primitives/Input";
import { Button } from "../../primitives/Button";
import styles from "./Auth.module.css";

type Props = {
  heading: string;
  onSubmitCode: (code: string) => Promise<void>;
  onResend: () => Promise<unknown>;
};

export function CodeEntry({ heading, onSubmitCode, onResend }: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!code.trim() || loading) return;

    try {
      setLoading(true);
      setErrorMessage(null);
      await onSubmitCode(code.trim());
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message ?? "Invalid code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      await onResend();
      setResent(true);
    } catch (err: any) {
      setErrorMessage(err.message ?? "Could not resend code.");
    }
  }

  return (
    <ScreenShell>
      <div className={styles.flowPage}>
        <h2 className={styles.flowHeading}>{heading}</h2>
        <form className={styles.inlineForm} onSubmit={handleSubmit}>
          <Input type="text" value={code} placeholder="Enter code" onChange={(e) => setCode(e.target.value)} />
          <Button type="submit" text={loading ? "Verifying..." : "Verify"} disabled={loading || !code.trim()} />
        </form>

        {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
        {resent && <p className={styles.successMessage}>A new code has been sent.</p>}

        <button type="button" className={styles.textLinks} onClick={handleResend} style={{ border: 0, background: "none", cursor: "pointer" }}>
          Resend code
        </button>
      </div>
    </ScreenShell>
  );
}
