import { KeyboardEvent, ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import btn from "./buttonStyles.module.scss";
import styles from "./Modal.module.scss";

interface ModalProps {
  title: string;
  onClose: () => void;
  size?: "sm" | "md" | "lg";
  headerExtra?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

const CloseIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

/**
 * Reusable modal shell: portal to body, backdrop and Esc close, a focus trap
 * while open, and focus restoration to the element that was focused when it
 * opened. Compose the header extra content, body and footer from the consumer.
 */
const Modal = ({
  title,
  onClose,
  size = "sm",
  headerExtra,
  footer,
  children,
}: ModalProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    // Consumers usually focus their first field in their own effect. If they
    // don't, keep keyboard focus inside the dialog so Esc and the Tab trap work.
    const timer = window.setTimeout(() => {
      const container = dialogRef.current;
      if (!container || container.contains(document.activeElement)) {
        return;
      }
      const field = container.querySelector<HTMLElement>(
        'input:not([disabled]), textarea:not([disabled]), select:not([disabled])',
      );
      const firstFocusable = container.querySelector<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      );
      (field ?? firstFocusable)?.focus();
    }, 0);
    return () => {
      window.clearTimeout(timer);
      previouslyFocused?.focus?.();
    };
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab") {
      return;
    }
    const container = dialogRef.current;
    if (!container) {
      return;
    }
    const focusable = Array.from(
      container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      ),
    );
    if (focusable.length === 0) {
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <div
      className={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={dialogRef}
        className={[
          styles.modal,
          size === "md" ? styles.md : size === "lg" ? styles.lg : styles.sm,
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className={styles.head}>
          <h2 className={styles.title}>{title}</h2>
          {headerExtra}
          <span className={styles.grow} />
          <button
            type="button"
            className={[btn.btn, btn.ghost, btn.iconBtn].join(" ")}
            aria-label="Close"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
        {footer ? <div className={styles.foot}>{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
