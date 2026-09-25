import { useMemo, useState } from "react";
import { Eye, EyeOff, LockKeyhole, Search, UserRound } from "lucide-react";
import styles from "./Input.module.css";

type Props = {
  type: "username" | "email" | "password" | "text" | "search";
  value: string;
  placeholder?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export function Input({ type, value, placeholder, onChange }: Props) {
  const [showPassword, setShowPassword] = useState(false);

  const config = useMemo(() => {
    switch (type) {
      case "username":
        return { inputType: "text", Icon: UserRound };
      case "email":
        return { inputType: "email", Icon: UserRound };
      case "search":
        return { inputType: "search", Icon: Search };
      case "text":
        return { inputType: "text", Icon: null };
      case "password":
        return { inputType: showPassword ? "text" : "password", Icon: LockKeyhole };
    }
  }, [type, showPassword]);

  const { inputType, Icon } = config;

  return (
    <label className={styles.field}>
      <span className={styles.inputWrap}>
        {Icon && <Icon className={styles.icon} strokeWidth={1.8} />}
        <input
          className={`${styles.input} ${Icon ? styles.withIcon : ""}`}
          type={inputType}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
        />

        {type === "password" && (
          <button type="button" className={styles.eyeButton} onClick={() => setShowPassword((prev) => !prev)}>
            {showPassword ? (
              <EyeOff className={styles.eye} strokeWidth={1.8} />
            ) : (
              <Eye className={styles.eye} strokeWidth={1.8} />
            )}
          </button>
        )}
      </span>
    </label>
  );
}
