import {
  BETTING_OPTIONS,
  DENOMINATIONS,
  type BetAmount,
  type Denomination,
} from "../../../config/gameConfig";
import type { GameDefinition } from "../../../config/games";
import Button from "../Button/Button";
import "./Controls.scss";

interface ControlsProps {
  currentBet: BetAmount;
  denomination: Denomination;
  canDeal: boolean;
  canBetMax: boolean;
  isRoundActive: boolean;
  isBetting: boolean;
  isResetConfirmationActive: boolean;
  gameName: GameDefinition["name"];
  canDraw: boolean;
  isDrawing: boolean;
  onBetChange: (bet: BetAmount) => void;
  onDeal: (bet?: BetAmount) => void;
  onDraw: () => void;
  onResetBalance: () => void;
  onDenomClick: () => void;
  onMenuClick: () => void;
}

function Controls({
  currentBet,
  denomination,
  canDeal,
  canBetMax,
  isRoundActive,
  isBetting,
  isResetConfirmationActive,
  gameName,
  canDraw,
  isDrawing,
  onBetChange,
  onDeal,
  onDenomClick,
  onMenuClick,
  onDraw,
  onResetBalance,
}: ControlsProps) {
  const currentBetIndex = BETTING_OPTIONS.indexOf(currentBet);
  const canChangeBet = !isRoundActive;

  return (
    <>
      <div className="controls--container">
        <div className="controls--column">
          <Button
            disabled={!canChangeBet}
            text="BET UP"
            onButtonClick={() => {
              const nextBet = BETTING_OPTIONS[currentBetIndex + 1];
              if (nextBet === undefined) {
                onBetChange(1);
              } else {
                onBetChange(nextBet);
              }
            }}
          />
          <Button
            disabled={isRoundActive}
            text="MENU"
            onButtonClick={onMenuClick}
          />
        </div>
        <div className="controls--column">
          <div className="bet">BET {currentBet}</div>
          <div className="denom">
            <button
              aria-label="Change denomination"
              disabled={isRoundActive}
              onClick={onDenomClick}
              type="button"
            >
              <img
                alt={`${denomination} denomination`}
                src={`/assets/ui/denoms/${DENOMINATIONS[denomination].image}`}
              />
            </button>
          </div>
        </div>
        <div className="controls--column">
          <Button
            disabled={!canChangeBet || !canBetMax}
            text="BET MAX"
            onButtonClick={() => {
              const maxBet = BETTING_OPTIONS[BETTING_OPTIONS.length - 1];
              onBetChange(maxBet);
              onDeal(maxBet);
            }}
          />
          <Button
            disabled={
              isDrawing ||
              isBetting ||
              (canDraw ? false : !canDeal || isRoundActive)
            }
            text={canDraw ? "DRAW" : "DEAL"}
            onButtonClick={() => {
              if (canDraw) {
                onDraw();
              } else {
                onDeal();
              }
            }}
          />
        </div>
      </div>
      <div className="game-info">
        <button
          aria-label="Reset balance by clicking twice"
          className={`game-name${isResetConfirmationActive ? " confirming" : ""}`}
          disabled={isRoundActive}
          onClick={onResetBalance}
          type="button"
        >
          {isResetConfirmationActive ? "ARE YOU SURE?" : gameName}
        </button>
        <div>{!isRoundActive && "GAME OVER"}</div>
      </div>
    </>
  );
}

export default Controls;
