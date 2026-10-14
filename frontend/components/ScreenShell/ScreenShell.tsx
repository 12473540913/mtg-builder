import { Header } from "../Header";
import { Footer } from "../Footer";
import styles from "./ScreenShell.module.css";

type Props = {
  children: React.ReactNode;
  headerVariant?: "guest" | "user";
  showFlag?: boolean;
};

export function ScreenShell({ children, headerVariant = "guest", showFlag = true }: Props) {
  return (
    <div className={styles.pageShell}>
      <Header variant={headerVariant} showFlag={showFlag} />
      <main className={styles.main}>{children}</main>
      <Footer />
    </div>
  );
}
