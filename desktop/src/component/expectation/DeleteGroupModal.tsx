import DeleteConfirmModal from "./DeleteConfirmModal";

interface DeleteGroupModalProps {
  name: string;
  /** Number of expectations that will be deleted with the group. */
  count: number;
  deleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const DeleteGroupModal = ({
  name,
  count,
  deleting,
  onConfirm,
  onClose,
}: DeleteGroupModalProps) => (
  <DeleteConfirmModal
    title="Delete group"
    name={name}
    note={
      count > 0
        ? `This permanently removes the group and its ${count} expectation${
            count === 1 ? "" : "s"
          }. Request logs are preserved.`
        : "This permanently removes the group. Request logs are preserved."
    }
    confirmLabel="Delete group"
    deleting={deleting}
    onConfirm={onConfirm}
    onClose={onClose}
  />
);

export default DeleteGroupModal;
