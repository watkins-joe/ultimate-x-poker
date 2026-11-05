import type { PointerEvent as ReactPointerEvent } from "react";
import type { GameDefinition, HandRank } from "../../../config/games";
import type { INITIAL_HAND_STATE_TYPE } from "../../../config/hands";
import "./InteractiveHand.scss";

export interface HandResult {
  rank: HandRank;
  title: string;
  payoutCredits: number;
  multiplierApplied: number;
}

interface HandRowProps {
  handIndex: number;
  hand: INITIAL_HAND_STATE_TYPE;
  isCurrentHand: boolean;
  isActiveHand: boolean;
  canSelect: boolean;
  queuedMultiplier: number;
  result: HandResult | null;
  game: GameDefinition;
  onCardPointerDown?: (
    index: number,
    event: ReactPointerEvent<HTMLImageElement>,
  ) => void;
  onCardPointerEnter?: (
    index: number,
    event: ReactPointerEvent<HTMLImageElement>,
  ) => void;
}

function HandRow({
  handIndex,
  hand,
  isCurrentHand,
  isActiveHand,
  canSelect,
  queuedMultiplier,
  result,
  game,
  onCardPointerDown,
  onCardPointerEnter,
}: HandRowProps) {
  const hasHeldCards = hand.some((card) => card.isHeld);
  const showHeldStatus = isCurrentHand && hasHeldCards;
  const isWinningHand = result !== null && result.payoutCredits > 0;
  const paylineFrame = isWinningHand
    ? `/assets/ui/payline${Math.min(16, Math.max(1, result.multiplierApplied))}_2.gif`
    : null;

  return (
    <div
      className={`multi-hand-row${canSelect ? " is-selectable" : ""}${isActiveHand ? "" : " is-inactive"}`}
      key={handIndex}
    >
      <div className="hand-marker" aria-live="polite">
        {queuedMultiplier > 1 && (
          <>
            <div>NEXT HAND</div>
            <span>{queuedMultiplier}X</span>
          </>
        )}
      </div>
      <div
        className={`cards${canSelect ? " is-holding" : ""}${showHeldStatus ? " has-held-cards" : ""}`}
      >
        {hand.map((card, cardIndex) => {
          const asset =
            card.cardId === null
              ? { src: "/assets/cards/back.png", alt: "Card Back" }
              : game.getCardAsset(card.cardId);

          return (
            <div className="card-container" key={cardIndex}>
              <img
                alt={asset.alt}
                className="playing-card"
                draggable={false}
                onPointerDown={(event) =>
                  canSelect && onCardPointerDown?.(cardIndex, event)
                }
                onPointerEnter={(event) =>
                  canSelect && onCardPointerEnter?.(cardIndex, event)
                }
                src={asset.src}
              />
              {showHeldStatus && (
                <span
                  aria-label={card.isHeld ? "Held" : undefined}
                  aria-hidden={!card.isHeld}
                  className="hold-badge"
                >
                  {card.isHeld ? "HELD" : ""}
                </span>
              )}
            </div>
          );
        })}
        {isWinningHand && paylineFrame && (
          <div
            aria-label={`${result.title}, ${result.payoutCredits} credits`}
            className="winning-hand-overlay"
            role="status"
            style={{ backgroundImage: `url("${paylineFrame}")` }}
          >
            <span>{result.title.toLowerCase()}</span>
            <strong>{result.payoutCredits}</strong>
          </div>
        )}
      </div>
    </div>
  );
}

export default HandRow;
