import { useEffect, useId, type MouseEvent } from "react";
import "./Modal.scss";

interface ModalProps {
  title: string;
  className?: string;
  showCloseButton?: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function Modal({
  title,
  className = "",
  showCloseButton = false,
  onClose,
  children,
}: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className={`modal-content ${className}`.trim()}
        role="dialog"
      >
        <h2 className="modal-title" id={titleId}>
          {title}
        </h2>
        {showCloseButton && (
          <button
            aria-label="Close dialog"
            className="modal-close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        )}
        {children}
      </section>
    </div>
  );
}

export default Modal;
