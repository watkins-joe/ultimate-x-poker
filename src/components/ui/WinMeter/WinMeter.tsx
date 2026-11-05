import "./WinMeter.scss";

interface WinMeterProps {
  winCredits: number;
  isResolved: boolean;
}

function WinMeter({ winCredits, isResolved }: WinMeterProps) {
  return (
    <div
      className={`win-meter casino-font${isResolved ? " is-visible" : ""}`}
      aria-live="polite"
      aria-hidden={!isResolved}
    >
      {isResolved && (
        <>
          <span>WIN {Math.floor(winCredits)}</span>
        </>
      )}
    </div>
  );
}

export default WinMeter;
