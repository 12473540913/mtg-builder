import { getUnmetPasswordRequirements } from "../../lib/password";
import styles from "./PasswordRequirements.module.css";

export function PasswordRequirements({ password }: { password: string }) {
  const requirements = getUnmetPasswordRequirements(password);

  return (
    <div aria-live="polite">
      {password.length > 0 && requirements.length > 0 && (
        <ul className={styles.requirements} aria-label="Unmet password requirements">
          {requirements.map((requirement) => <li key={requirement}>{requirement}</li>)}
        </ul>
      )}
    </div>
  );
}
