import {
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  GAME_STATES,
  type GameState,
} from "../../../config/gameConfig";
import type { GameDefinition, HandRank } from "../../../config/games";
import {
  createEmptyHand,
  MULTI_HAND_COUNT,
  type INITIAL_HAND_STATE_TYPE,
} from "../../../config/hands";
import HoldSelectionGesture from "../../../utils/HoldSelectionGesture";
import "./InteractiveHand.scss";

export interface HandResult {
  rank: HandRank;
  title: string;
  payoutCredits: number;
  multiplierApplied: number;
}

interface InteractiveHandProps {
  gameState: GameState;
  initialHand: INITIAL_HAND_STATE_TYPE;
  hands: INITIAL_HAND_STATE_TYPE[];
  isInitialDeal: boolean;
  isDrawing: boolean;
  game: GameDefinition;
  multipliers: readonly number[];
  results: readonly (HandResult | null)[];
  onCardClick: (positionIndex: number) => void;
}

function InteractiveHand({
  gameState,
  initialHand,
  hands,
  isInitialDeal,
  isDrawing,
  game,
  multipliers,
  results,
  onCardClick,
}: InteractiveHandProps) {
  const holdGestureRef = useRef(new HoldSelectionGesture());

  useEffect(() => {
    function stopSelecting(event: PointerEvent) {
      holdGestureRef.current.end(event.pointerId);
    }

    window.addEventListener("pointerup", stopSelecting);
    window.addEventListener("pointercancel", stopSelecting);
    return () => {
      window.removeEventListener("pointerup", stopSelecting);
      window.removeEventListener("pointercancel", stopSelecting);
    };
  }, []);

  function selectCard(index: number) {
    if (gameState !== GAME_STATES.Awaiting_Holds || isDrawing) return;
    onCardClick(index);
  }

  function handleCardPointerDown(
    index: number,
    event: ReactPointerEvent<HTMLImageElement>,
  ) {
    if (
      !event.isPrimary ||
      (event.pointerType === "mouse" && event.button !== 0) ||
      gameState !== GAME_STATES.Awaiting_Holds ||
      isDrawing
    ) {
      return;
    }

    event.preventDefault();
    const cardIndex = holdGestureRef.current.begin(event.pointerId, index);
    selectCard(cardIndex);
  }

  function handleCardPointerEnter(
    index: number,
    event: ReactPointerEvent<HTMLImageElement>,
  ) {
    if (holdGestureRef.current.visit(event.pointerId, index) === null) {
      return;
    }

    selectCard(index);
  }

  const initialHandIsVisible =
    isInitialDeal || gameState === GAME_STATES.Awaiting_Holds;

  return (
    <div className="hands-grid" aria-label="Ten poker hands">
      {Array.from({ length: MULTI_HAND_COUNT }, (_, handIndex) => {
        const isCurrentHand =
          handIndex === MULTI_HAND_COUNT - 1 && initialHandIsVisible;
        const hand = isCurrentHand ? initialHand : hands[handIndex] ?? createEmptyHand();
        const result = results[handIndex] ?? null;
        const queuedMultiplier = multipliers[handIndex] ?? 1;
        const canSelect = isCurrentHand && gameState === GAME_STATES.Awaiting_Holds;

        return (
          <div
            className={`multi-hand-row${canSelect ? " is-selectable" : ""}`}
            key={handIndex}
          >
            <div className="hand-marker" aria-live="polite">
              {result ? (
                <>
                  <span className="hand-result-name">{result.title}</span>
                  {result.payoutCredits > 0 && (
                    <span className="hand-result-payout">
                      +{result.payoutCredits} ({result.multiplierApplied}X)
                    </span>
                  )}
                  {queuedMultiplier > 1 && (
                    <span className="hand-result-multiplier">
                      NEXT {queuedMultiplier}X
                    </span>
                  )}
                </>
              ) : queuedMultiplier > 1 ? (
                <>
                  <span>NEXT</span>
                  <strong>{queuedMultiplier}X</strong>
                </>
              ) : handIndex === MULTI_HAND_COUNT - 1 &&
                gameState === GAME_STATES.Awaiting_Holds ? (
                <span>HOLD</span>
              ) : null}
            </div>
            <div className={`cards${canSelect ? " is-holding" : ""}`}>
              {hand.map((card, cardIndex) => {
                const asset =
                  card.cardId === null
                    ? { src: "/assets/cards/back.png", alt: "Card Back" }
                    : game.getCardAsset(card.cardId);

                return (
                  <div className="card-container" key={cardIndex}>
                    <img
                      alt={asset.alt}
                      draggable={false}
                      onPointerDown={(event) =>
                        canSelect && handleCardPointerDown(cardIndex, event)
                      }
                      onPointerEnter={(event) =>
                        canSelect && handleCardPointerEnter(cardIndex, event)
                      }
                      src={asset.src}
                    />
                    {card.isHeld && card.cardId !== null && canSelect && (
                      <div className="hold-badge">HELD</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default InteractiveHand;
