import "./WinMeter.scss";

interface WinMeterProps {
  winCredits: number;
}

function WinMeter({ winCredits }: WinMeterProps) {
  const hasWin = winCredits > 0;

  return (
    <div
      className={`win-meter casino-font${hasWin ? " is-visible" : ""}`}
      aria-live="polite"
      aria-hidden={!hasWin}
    >
      WIN {hasWin ? Math.floor(winCredits) : ""}
    </div>
  );
}

export default WinMeter;
