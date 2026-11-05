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
  activeHandCount: number;
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
  activeHandCount,
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
  const heldCards = initialHand.map((card) =>
    card.isHeld ? { ...card } : { cardId: null, isHeld: false },
  );

  function renderHand(handIndex: number, isCurrentHand: boolean) {
    const isActiveHand =
      handIndex >= MULTI_HAND_COUNT - activeHandCount;
    const hand =
      isCurrentHand && initialHandIsVisible
        ? initialHand
        : !isCurrentHand && gameState === GAME_STATES.Awaiting_Holds
          ? heldCards
          : (hands[handIndex] ?? createEmptyHand());
    const hasHeldCards = hand.some((card) => card.isHeld);
    const result = results[handIndex] ?? null;
    const queuedMultiplier = multipliers[handIndex] ?? 1;
    const canSelect = isCurrentHand && gameState === GAME_STATES.Awaiting_Holds;
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
          {queuedMultiplier > 1 ? (
            <>
              <span>NEXT HAND</span>
              <strong>{queuedMultiplier}X</strong>
            </>
          ) : isCurrentHand && canSelect ? (
            <span>HOLD</span>
          ) : null}
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
                    canSelect && handleCardPointerDown(cardIndex, event)
                  }
                  onPointerEnter={(event) =>
                    canSelect && handleCardPointerEnter(cardIndex, event)
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

  return (
    <>
      <div className="game-table">
        <div className="hands-grid" aria-label="Nine follow-on hands">
          {Array.from({ length: MULTI_HAND_COUNT - 1 }, (_, handIndex) =>
            renderHand(handIndex, false),
          )}
        </div>
      </div>
      <div className="interactive-hand-area" aria-label="Interactive hand">
        {renderHand(MULTI_HAND_COUNT - 1, true)}
      </div>
    </>
  );
}

export default InteractiveHand;
