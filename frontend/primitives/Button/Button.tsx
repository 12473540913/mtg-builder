import styles from "./Button.module.css";

type Props = {
  type?: "button" | "submit";
  text: string;
  disabled?: boolean;
  variant?: "primary" | "ghost" | "danger" | "success" | "failure";
  onClick?: () => void;
};

const VARIANT_CLASSES = {
  primary: styles.primary,
  ghost: styles.ghost,
  danger: styles.danger,
  success: styles.success,
  failure: styles.failure,
};

export function Button({ type = "button", text, disabled = false, variant = "primary", onClick }: Props) {
  const variantClass = VARIANT_CLASSES[variant];

  return (
    <button className={`${styles.button} ${variantClass}`} type={type} disabled={disabled} onClick={onClick}>
      {text}
    </button>
  );
}
