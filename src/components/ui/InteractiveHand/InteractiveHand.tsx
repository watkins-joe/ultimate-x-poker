import {
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { GAME_STATES, type GameState } from "../../../config/gameConfig";
import type { GameDefinition } from "../../../config/games";
import {
  createEmptyHand,
  MULTI_HAND_COUNT,
  type INITIAL_HAND_STATE_TYPE,
} from "../../../config/hands";
import HoldSelectionGesture from "../../../utils/HoldSelectionGesture";
import HandRow, { type HandResult } from "./HandRow";

export type { HandResult } from "./HandRow";

export interface InteractiveHandProps {
  gameState: GameState;
  initialHand: INITIAL_HAND_STATE_TYPE;
  hands: INITIAL_HAND_STATE_TYPE[];
  isInitialDeal: boolean;
  isDrawing: boolean;
  game: GameDefinition;
  multipliers: readonly number[];
  activeMultipliers: readonly number[];
  results: readonly (HandResult | null)[];
  activeHandCount: number;
  initialHandResult: HandResult | null;
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
  activeMultipliers,
  results,
  activeHandCount,
  initialHandResult,
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
    if (holdGestureRef.current.visit(event.pointerId, index) === null) return;
    selectCard(index);
  }

  const initialHandIsVisible =
    isInitialDeal || gameState === GAME_STATES.Awaiting_Holds;
  const hand = initialHandIsVisible
    ? initialHand
    : (hands[MULTI_HAND_COUNT - 1] ?? createEmptyHand());
  const handIndex = MULTI_HAND_COUNT - 1;
  const isActiveHand = handIndex >= MULTI_HAND_COUNT - activeHandCount;
  const canSelect = gameState === GAME_STATES.Awaiting_Holds;

  return (
    <div className="interactive-hand-area" aria-label="Interactive hand">
      <HandRow
        canSelect={canSelect}
        game={game}
        hand={hand}
        handIndex={handIndex}
        isActiveHand={isActiveHand}
        isCurrentHand
        onCardPointerDown={handleCardPointerDown}
        onCardPointerEnter={handleCardPointerEnter}
        queuedMultiplier={multipliers[handIndex] ?? 1}
        activeMultiplier={activeMultipliers[handIndex] ?? 1}
        result={
          initialHandIsVisible
            ? initialHandResult
            : (results[handIndex] ?? null)
        }
      />
    </div>
  );
}

export default InteractiveHand;
