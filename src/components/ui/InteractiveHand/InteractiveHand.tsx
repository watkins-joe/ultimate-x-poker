import {
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { GAME_STATES, type GameState } from "../../../config/gameConfig";
import type { GameDefinition } from "../../../config/games";
import type { INITIAL_HAND_STATE_TYPE } from "../../../config/hands";
import HoldSelectionGesture from "../../../utils/HoldSelectionGesture";
import "./InteractiveHand.scss";

interface InteractiveHandProps {
  gameState: GameState;
  handState: INITIAL_HAND_STATE_TYPE[];
  isDrawing: boolean;
  game: GameDefinition;
  onCardClick: (positionIndex: number) => void;
}

function InteractiveHand({
  gameState,
  handState,
  isDrawing,
  game,
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

  return (
    <div
      className={`cards ${
        gameState === GAME_STATES.Awaiting_Holds ? "is-holding" : ""
      }`}
    >
      {handState[0].map((card, index) => {
        const asset =
          card.cardId === null
            ? { src: "/assets/cards/back.png", alt: "Card Back" }
            : game.getCardAsset(card.cardId);

        return (
          <div className="card-container" key={index}>
            <img
              alt={asset.alt}
              draggable={false}
              onPointerDown={(event) => handleCardPointerDown(index, event)}
              onPointerEnter={(event) => handleCardPointerEnter(index, event)}
              src={asset.src}
            />
            {card.isHeld && card.cardId !== null && (
              <div className="hold-badge">HELD</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default InteractiveHand;
