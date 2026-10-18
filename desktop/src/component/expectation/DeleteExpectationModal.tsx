import DeleteConfirmModal from "./DeleteConfirmModal";

interface DeleteExpectationModalProps {
  name: string;
  deleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const DeleteExpectationModal = ({
  name,
  deleting,
  onConfirm,
  onClose,
}: DeleteExpectationModalProps) => (
  <DeleteConfirmModal
    title="Delete expectation"
    name={name}
    note="This permanently removes its matchers and action. Request logs are preserved."
    confirmLabel="Delete expectation"
    deleting={deleting}
    onConfirm={onConfirm}
    onClose={onClose}
  />
);

export default DeleteExpectationModal;
