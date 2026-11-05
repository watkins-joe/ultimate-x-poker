import { GAME_STATES, type GameState } from "../../../config/gameConfig";
import type { GameDefinition } from "../../../config/games";
import {
  createEmptyHand,
  MULTI_HAND_COUNT,
  type INITIAL_HAND_STATE_TYPE,
} from "../../../config/hands";
import HandRow, { type HandResult } from "./HandRow";

interface GameTableProps {
  gameState: GameState;
  initialHand: INITIAL_HAND_STATE_TYPE;
  hands: INITIAL_HAND_STATE_TYPE[];
  game: GameDefinition;
  multipliers: readonly number[];
  results: readonly (HandResult | null)[];
  activeHandCount: number;
}

function GameTable({
  gameState,
  initialHand,
  hands,
  game,
  multipliers,
  results,
  activeHandCount,
}: GameTableProps) {
  const heldCards = initialHand.map((card) =>
    card.isHeld ? { ...card } : { cardId: null, isHeld: false },
  );
  const firstActiveHandIndex = MULTI_HAND_COUNT - activeHandCount;

  return (
    <section className="game-shell" aria-label="Nine follow-on hands">
      <div className="game-table">
        <div className="hands-grid" aria-label="Nine follow-on hands">
          {Array.from({ length: MULTI_HAND_COUNT - 1 }, (_, handIndex) => {
            const isActiveHand = handIndex >= firstActiveHandIndex;
            const hand =
              gameState === GAME_STATES.Awaiting_Holds
                ? heldCards
                : (hands[handIndex] ?? createEmptyHand());

            return (
              <HandRow
                canSelect={false}
                game={game}
                hand={hand}
                handIndex={handIndex}
                isActiveHand={isActiveHand}
                isCurrentHand={false}
                key={handIndex}
                queuedMultiplier={multipliers[handIndex] ?? 1}
                result={results[handIndex] ?? null}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default GameTable;
