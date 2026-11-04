import { GAME_STATES, type GameState } from "../../../config/gameConfig";
import "./HandTitle.scss";

interface HandTitleProps {
  gameState: GameState;
  title: string; // HAND_TITLE
}

function HandTitle({ gameState, title }: HandTitleProps) {
  const isInitialWin =
    gameState === GAME_STATES.Awaiting_Holds && title.length > 0;
  const isResolvedWin =
    gameState === GAME_STATES.Game_Over && title.length > 0;

  return (
    <div id="title" className="title">
      <span
        className={
          isInitialWin
            ? "initial-hand-rank"
            : isResolvedWin
              ? "casino-font"
              : ""
        }
      >
        {title}
      </span>
    </div>
  );
}

export default HandTitle;
