import { ReactNode } from "react";
import Modal from "../Modal";
import btn from "../buttonStyles.module.scss";
import styles from "./DeleteConfirmModal.module.scss";

const TrashIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
  </svg>
);

interface DeleteConfirmModalProps {
  title: string;
  name: string;
  note: ReactNode;
  confirmLabel: string;
  deleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Shared destructive confirmation, matching the design's delete-expectation
 * modal: a red trash badge in the header, the name in the question and a
 * consequence note above Cancel / a solid danger confirm button.
 */
const DeleteConfirmModal = ({
  title,
  name,
  note,
  confirmLabel,
  deleting,
  onConfirm,
  onClose,
}: DeleteConfirmModalProps) => (
  <Modal
    title={title}
    titleIcon={
      <span className={styles.badge}>
        <TrashIcon />
      </span>
    }
    onClose={onClose}
    size="sm"
    footer={
      <>
        <button
          type="button"
          className={[btn.btn, btn.ghost].join(" ")}
          onClick={onClose}
          disabled={deleting}
        >
          Cancel
        </button>
        <button
          type="button"
          className={[btn.btn, btn.dangerSolid].join(" ")}
          onClick={onConfirm}
          disabled={deleting}
        >
          {deleting ? "Deleting…" : confirmLabel}
        </button>
      </>
    }
  >
    <p className={styles.lead}>
      Are you sure you want to delete <b>{name || "(unnamed)"}</b>?
    </p>
    <p className={styles.note}>{note}</p>
  </Modal>
);

export default DeleteConfirmModal;
