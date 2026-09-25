import type { MtgCard } from "../../types";
import styles from "./CardTile.module.css";

type Props = {
  card: MtgCard;
  quantity?: number;
  isCommander?: boolean;
  onAdd?: () => void;
  onRemove?: () => void;
  onSetCommander?: () => void;
};

export function CardTile({ card, quantity, isCommander, onAdd, onRemove, onSetCommander }: Props) {
  return (
    <div className={`${styles.tile} ${isCommander ? styles.commander : ""}`}>
      <div className={styles.imageWrap}>
        {card.imageUrl ? (
          <img className={styles.image} src={card.imageUrl} alt={card.name} loading="lazy" />
        ) : (
          <div className={styles.placeholder}>{card.name}</div>
        )}
        {typeof quantity === "number" && quantity > 1 && <span className={styles.qtyBadge}>×{quantity}</span>}
        {isCommander && <span className={styles.commanderBadge}>Commander</span>}
      </div>

      <div className={styles.actions}>
        {onAdd && (
          <button type="button" className={styles.actionButton} onClick={onAdd} title="Add to deck">
            +
          </button>
        )}
        {onRemove && (
          <button type="button" className={styles.actionButton} onClick={onRemove} title="Remove from deck">
            −
          </button>
        )}
        {onSetCommander && (
          <button type="button" className={styles.commanderButton} onClick={onSetCommander} title="Set as commander">
            ⚑
          </button>
        )}
      </div>
    </div>
  );
}
