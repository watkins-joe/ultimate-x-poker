import type { PointerEvent as ReactPointerEvent } from "react";
import { DEUCES_WILD_HAND_TYPES } from "../../../config/deucesWildConfig";
import { HAND_TYPES } from "../../../config/doubleDoubleBonusConfig";
import type { GameDefinition, HandRank } from "../../../config/games";
import type { INITIAL_HAND_STATE_TYPE } from "../../../config/hands";
import "./InteractiveHand.scss";

const WINNING_HAND_ACCENTS: Readonly<Record<HandRank, string>> = {
  [HAND_TYPES.ROYAL_FLUSH]: "orange",
  [HAND_TYPES.STRAIGHT_FLUSH]: "pink",
  [HAND_TYPES.FOUR_ACES_WITH_ANY_TWO_THREE_FOUR]: "burgundy",
  [HAND_TYPES.FOUR_TWOS_THREE_FOURS_WITH_ACE_TWO_THREE_FOUR]: "burgundy",
  [HAND_TYPES.FOUR_ACES]: "burgundy",
  [HAND_TYPES.FOUR_TWOS_THREE_FOURS]: "burgundy",
  [HAND_TYPES.FOUR_FIVES_THRU_KINGS]: "burgundy",
  [HAND_TYPES.FULL_HOUSE]: "blue",
  [HAND_TYPES.FLUSH]: "green",
  [HAND_TYPES.STRAIGHT]: "yellow",
  [HAND_TYPES.THREE_OF_A_KIND]: "yellow",
  [HAND_TYPES.TWO_PAIR]: "light-blue",
  [HAND_TYPES.JACKS_OR_BETTER]: "purple",
  [DEUCES_WILD_HAND_TYPES.ROYAL_FLUSH_NO_DEUCES]: "orange",
  [DEUCES_WILD_HAND_TYPES.FOUR_DEUCES_WITH_ACE]: "burgundy",
  [DEUCES_WILD_HAND_TYPES.FOUR_DEUCES]: "burgundy",
  [DEUCES_WILD_HAND_TYPES.ROYAL_FLUSH_WITH_DEUCES]: "orange",
  [DEUCES_WILD_HAND_TYPES.FIVE_ACES]: "burgundy",
  [DEUCES_WILD_HAND_TYPES.FIVE_THREES_FOURS_FIVES]: "burgundy",
  [DEUCES_WILD_HAND_TYPES.FIVE_SIXES_THRU_KINGS]: "burgundy",
  [DEUCES_WILD_HAND_TYPES.FOUR_OF_A_KIND]: "burgundy",
};

export interface HandResult {
  rank: HandRank;
  title: string;
  basePayoutCredits: number;
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
  activeMultiplier: number;
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
  activeMultiplier,
  result,
  game,
  onCardPointerDown,
  onCardPointerEnter,
}: HandRowProps) {
  const hasHeldCards = hand.some((card) => card.isHeld);
  const showHeldStatus = isCurrentHand && hasHeldCards;
  const isWinningHand = result !== null && result.payoutCredits > 0;
  const overlayAccent = isWinningHand
    ? WINNING_HAND_ACCENTS[result.rank]
    : undefined;

  return (
    <div
      className={`multi-hand-row${canSelect ? " is-selectable" : ""}${isActiveHand ? "" : " is-inactive"}`}
      key={handIndex}
    >
      <div className="hand-marker" aria-live="polite">
        {queuedMultiplier > 1 && (
          <div className="queued-hand-multiplier">
            <div className="next-hand">NEXT HAND</div>
            <span>{queuedMultiplier}X</span>
          </div>
        )}
        {activeMultiplier > 1 && (
          <span
            aria-label={`Active multiplier ${activeMultiplier}X`}
            className="active-hand-multiplier"
          >
            {activeMultiplier}X
          </span>
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
        {isWinningHand && overlayAccent && (
          <div
            aria-label={`${result.title}, ${result.payoutCredits} credits`}
            className={`winning-hand-overlay winning-hand-overlay--${overlayAccent}`}
            role="status"
          >
            <span>{result.title.toLowerCase()}</span>
            <strong>
              {result.multiplierApplied > 1
                ? `${result.multiplierApplied} x ${result.basePayoutCredits} = ${result.payoutCredits}`
                : result.payoutCredits}
            </strong>
          </div>
        )}
      </div>
    </div>
  );
}

export default HandRow;
