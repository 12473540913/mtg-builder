import { Header } from "../Header";
import { Footer } from "../Footer";
import styles from "./ScreenShell.module.css";

type Props = {
  children: React.ReactNode;
  headerVariant?: "guest" | "user";
};

export function ScreenShell({ children, headerVariant = "guest" }: Props) {
  return (
    <div className={styles.pageShell}>
      <Header variant={headerVariant} />
      <main className={styles.main}>{children}</main>
      <Footer />
    </div>
  );
}
