import "./Button.scss";

interface ButtonProps {
  disabled: boolean;
  text: string;
  onButtonClick: () => void;
}

function Button({ disabled, text, onButtonClick }: ButtonProps) {
  return (
    <button
      className="casino-button"
      type="button"
      disabled={disabled}
      onClick={onButtonClick}
    >
      {!disabled && text}
    </button>
  );
}

export default Button;
