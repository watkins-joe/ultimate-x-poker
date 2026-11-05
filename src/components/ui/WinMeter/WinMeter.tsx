import "./WinMeter.scss";

interface WinMeterProps {
  winCredits: number;
  isResolved: boolean;
}

function WinMeter({ winCredits, isResolved }: WinMeterProps) {
  const hasWin = isResolved && winCredits > 0;

  return (
    <div
      className={`win-meter casino-font${hasWin ? " is-visible" : ""}`}
      aria-live="polite"
      aria-hidden={!hasWin}
    >
      {hasWin && (
        <>
          <span>WIN {Math.floor(winCredits)}</span>
        </>
      )}
    </div>
  );
}

export default WinMeter;
