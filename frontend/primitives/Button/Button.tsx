import styles from "./Button.module.css";

type Props = {
  type?: "button" | "submit";
  text: string;
  disabled?: boolean;
  variant?: "primary" | "ghost" | "danger";
  onClick?: () => void;
};

export function Button({ type = "button", text, disabled = false, variant = "primary", onClick }: Props) {
  const variantClass = variant === "ghost" ? styles.ghost : variant === "danger" ? styles.danger : styles.primary;

  return (
    <button className={`${styles.button} ${variantClass}`} type={type} disabled={disabled} onClick={onClick}>
      {text}
    </button>
  );
}
