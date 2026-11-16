import type { BetAmount, Denomination } from "../../../config/gameConfig";
import type { GameDefinition } from "../../../config/games";
import Controls from "../Controls/Controls";
import { CreditMeter } from "../CreditsCounter/CreditsCounter";
import WinMeter from "../WinMeter/WinMeter";

interface GameFooterProps {
  winCredits: number;
  isRoundResolved: boolean;
  creditsMode: boolean;
  balanceCents: number;
  denominationValueCents: number;
  onModeChange: () => void;
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
  canSpeedUpDraw: boolean;
  onBetChange: (bet: BetAmount) => void;
  onDeal: (bet?: BetAmount) => void;
  onDraw: () => void;
  onSpeedUpDraw: () => void;
  onResetBalance: () => void;
  onDenomClick: () => void;
  onMenuClick: () => void;
  onPaytableClick: () => void;
  onVolumeClick: () => void;
}

function GameFooter({
  winCredits,
  isRoundResolved,
  creditsMode,
  balanceCents,
  denominationValueCents,
  onModeChange,
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
  canSpeedUpDraw,
  onBetChange,
  onDeal,
  onDraw,
  onSpeedUpDraw,
  onResetBalance,
  onDenomClick,
  onMenuClick,
  onPaytableClick,
  onVolumeClick,
}: GameFooterProps) {
  return (
    <footer className="game-footer">
      <div id="meters">
        <WinMeter isResolved={isRoundResolved} winCredits={winCredits} />
        <CreditMeter
          creditsMode={creditsMode}
          balanceCents={balanceCents}
          denominationValueCents={denominationValueCents}
          onModeChange={onModeChange}
        />
      </div>
      <Controls
        currentBet={currentBet}
        denomination={denomination}
        canDeal={canDeal}
        canBetMax={canBetMax}
        isRoundActive={isRoundActive}
        isBetting={isBetting}
        isResetConfirmationActive={isResetConfirmationActive}
        gameName={gameName}
        canDraw={canDraw}
        isDrawing={isDrawing}
        canSpeedUpDraw={canSpeedUpDraw}
        onBetChange={onBetChange}
        onDeal={onDeal}
        onDenomClick={onDenomClick}
        onMenuClick={onMenuClick}
        onPaytableClick={onPaytableClick}
        onVolumeClick={onVolumeClick}
        onDraw={onDraw}
        onSpeedUpDraw={onSpeedUpDraw}
        onResetBalance={onResetBalance}
      />
    </footer>
  );
}

export default GameFooter;
