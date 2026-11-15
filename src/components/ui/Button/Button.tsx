import "./Button.scss";

interface ButtonProps {
  disabled: boolean;
  text: string;
  sound?: "maxBet";
  visuallyDisabled?: boolean;
  onButtonClick: () => void;
}

function Button({
  disabled,
  text,
  sound,
  visuallyDisabled = false,
  onButtonClick,
}: ButtonProps) {
  return (
    <button
      className={`casino-button${visuallyDisabled ? " is-visually-disabled" : ""}`}
      data-sound={sound}
      type="button"
      disabled={disabled}
      onClick={onButtonClick}
    >
      {text}
    </button>
  );
}

export default Button;
