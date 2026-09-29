import { useState } from "react";
import { Star } from "lucide-react";
import type { MtgCard } from "../../types";
import styles from "./CardTile.module.css";

type Props = {
  card: MtgCard;
  quantity: number;
  isCommander?: boolean;
  onAdd: (amount: number) => void;
  onRemove: (amount: number) => void;
  onSetCommander?: () => void;
  onSelectCover?: () => void;
  isCoverCard?: boolean;
};

export function CardTile({ card, quantity, isCommander, onAdd, onRemove, onSetCommander, onSelectCover, isCoverCard }: Props) {
  const [step, setStep] = useState(1);

  return (
    <div className={`${styles.tile} ${isCommander ? styles.commander : ""}`}>
      <div className={styles.imageWrap}>
        {card.imageUrl ? (
          <img className={styles.image} src={card.imageUrl} alt={card.name} loading="lazy" />
        ) : (
          <div className={styles.placeholder}>{card.name}</div>
        )}
        {isCommander && <span className={styles.commanderBadge}>Commander</span>}
        {onSelectCover && (
          <button
            type="button"
            className={styles.coverSelectButton}
            onClick={onSelectCover}
            aria-label={`Set ${card.name} as cover card`}
          />
        )}
      </div>

      <div className={styles.controls}>
        <span className={styles.controlLabel}>Qty</span>
        <span className={styles.qtyValue} aria-label="Quantity in deck">
          {quantity}
        </span>
        <button type="button" className={styles.actionButton} onClick={() => onAdd(step)} title="Add to deck">
          +
        </button>
        <input
          className={styles.stepInput}
          type="number"
          min={1}
          value={step}
          aria-label="Amount to add or remove"
          onChange={(e) => setStep(Math.max(1, Math.floor(Number(e.target.value)) || 1))}
        />
        <button
          type="button"
          className={styles.actionButton}
          onClick={() => onRemove(step)}
          disabled={quantity === 0}
          title="Remove from deck"
        >
          −
        </button>
        {isCoverCard && (
          <span className={styles.coverBadge} title="Cover card" aria-label="Cover card">
            <Star size={17} fill="currentColor" />
          </span>
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
