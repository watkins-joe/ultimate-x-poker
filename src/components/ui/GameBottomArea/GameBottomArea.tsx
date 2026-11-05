import type { ReactNode } from "react";

interface GameBottomAreaProps {
  interactiveHand: ReactNode;
  footer: ReactNode;
  isUltimateXActive: boolean;
  isRoundActive: boolean;
  onActivateUltimateX: () => void;
}

function GameBottomArea({
  interactiveHand,
  footer,
  isUltimateXActive,
  isRoundActive,
  onActivateUltimateX,
}: GameBottomAreaProps) {
  return (
    <section className="game-bottom-area" aria-label="Interactive hand and controls">
      {interactiveHand}
      <button
        aria-label={
          isUltimateXActive
            ? "Ultimate X bonus active"
            : "Set bet to 100 credits to activate Ultimate X"
        }
        className="ultimate-x-indicator"
        disabled={isUltimateXActive || isRoundActive}
        onClick={onActivateUltimateX}
        type="button"
      >
        <img
          alt={
            isUltimateXActive
              ? "Ultimate X active"
              : "Bet max credits to activate the Ultimate X feature"
          }
          src={`/assets/ui/${isUltimateXActive ? "bonusActive" : "betMax"}.gif`}
        />
      </button>
      {footer}
    </section>
  );
}

export default GameBottomArea;
