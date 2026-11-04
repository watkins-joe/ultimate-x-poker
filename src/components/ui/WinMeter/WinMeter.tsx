import "./WinMeter.scss";

interface WinMeterProps {
  winCredits: number;
  winningHandCount: number;
  isResolved: boolean;
}

function WinMeter({
  winCredits,
  winningHandCount,
  isResolved,
}: WinMeterProps) {

  return (
    <div
      className={`win-meter casino-font${isResolved ? " is-visible" : ""}`}
      aria-live="polite"
      aria-hidden={!isResolved}
    >
      {isResolved && (
        <>
          <span>WIN {Math.floor(winCredits)}</span>
          {winningHandCount > 0 && (
            <span className="win-hand-count">
              {winningHandCount} {winningHandCount === 1 ? "HAND" : "HANDS"}
            </span>
          )}
        </>
      )}
    </div>
  );
}

export default WinMeter;
