import { useState } from "react";
import {
  createHeaderMatcher,
  createMethodMatcher,
  createParamMatcher,
  createPathMatcher,
  createQueryMatcher,
  MatcherCondition,
  matcherHasName,
  matcherHasValue,
  RequestMatcherM,
  RequestMatcherType,
} from "livemock-core/struct/matcher";
import Modal from "../Modal";
import Select from "../Select";
import btn from "../buttonStyles.module.scss";
import { conditionLabel } from "./display";
import styles from "./MatchersEditorModal.module.scss";

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const TYPE_OPTIONS = [
  { value: RequestMatcherType.METHOD, label: "method" },
  { value: RequestMatcherType.PATH, label: "path" },
  { value: RequestMatcherType.HEADER, label: "header" },
  { value: RequestMatcherType.QUERY, label: "query" },
  { value: RequestMatcherType.PARAM, label: "param" },
];

const CONDITION_OPTIONS = Object.values(MatcherCondition).map((condition) => ({
  value: condition,
  label: conditionLabel(condition),
}));

function createMatcherOfType(type: RequestMatcherType): RequestMatcherM {
  switch (type) {
    case RequestMatcherType.METHOD:
      return createMethodMatcher();
    case RequestMatcherType.HEADER:
      return createHeaderMatcher();
    case RequestMatcherType.QUERY:
      return createQueryMatcher();
    case RequestMatcherType.PARAM:
      return createParamMatcher();
    default:
      return createPathMatcher();
  }
}

const XIcon = () => (
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

const PlusIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

interface MatchersEditorModalProps {
  matchers: Array<RequestMatcherM>;
  saving: boolean;
  onSave: (matchers: Array<RequestMatcherM>) => void;
  onClose: () => void;
}

const MatchersEditorModal = ({
  matchers,
  saving,
  onSave,
  onClose,
}: MatchersEditorModalProps) => {
  const [draft, setDraft] = useState<Array<RequestMatcherM>>(() =>
    clone(matchers),
  );

  const changeType = (index: number, type: RequestMatcherType) => {
    setDraft((prev) =>
      prev.map((matcher, i) =>
        i === index ? { ...createMatcherOfType(type), id: matcher.id } : matcher,
      ),
    );
  };

  const patch = (index: number, partial: Record<string, unknown>) => {
    setDraft((prev) =>
      prev.map((matcher, i) =>
        i === index ? ({ ...matcher, ...partial } as RequestMatcherM) : matcher,
      ),
    );
  };

  return (
    <Modal
      title="Edit matchers"
      onClose={onClose}
      size="md"
      footer={
        <>
          <button
            type="button"
            className={[btn.btn, btn.ghost].join(" ")}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={[btn.btn, btn.primary].join(" ")}
            onClick={() => onSave(draft)}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      {draft.length === 0 ? (
        <div className={styles.empty}>no matchers</div>
      ) : (
        <div className={styles.list}>
          {draft.map((matcher, index) => {
            const name = "name" in matcher ? matcher.name : "";
            return (
              <div key={matcher.id} className={styles.row}>
                <span className={styles.typeWrap}>
                  <Select
                    value={matcher.type}
                    onChange={(value) =>
                      changeType(index, value as RequestMatcherType)
                    }
                    options={TYPE_OPTIONS}
                  />
                </span>
                {matcherHasName(matcher) ? (
                  <input
                    className={[styles.input, styles.nameInput].join(" ")}
                    value={name}
                    placeholder="name"
                    onChange={(event) =>
                      patch(index, { name: event.target.value })
                    }
                  />
                ) : null}
                <span className={styles.condWrap}>
                  <Select
                    value={matcher.conditions}
                    onChange={(value) =>
                      patch(index, {
                        conditions: value as MatcherCondition,
                      })
                    }
                    options={CONDITION_OPTIONS}
                  />
                </span>
                {matcherHasValue(matcher) ? (
                  <input
                    className={[styles.input, styles.valueInput].join(" ")}
                    value={matcher.value}
                    placeholder="value"
                    onChange={(event) =>
                      patch(index, { value: event.target.value })
                    }
                  />
                ) : null}
                <button
                  type="button"
                  className={styles.del}
                  aria-label={`Remove matcher ${index + 1}`}
                  onClick={() =>
                    setDraft((prev) => prev.filter((_, i) => i !== index))
                  }
                >
                  <XIcon />
                </button>
              </div>
            );
          })}
        </div>
      )}
      <button
        type="button"
        className={styles.addRow}
        onClick={() => setDraft((prev) => [...prev, createPathMatcher()])}
      >
        <PlusIcon />
        Add matcher
      </button>
    </Modal>
  );
};

export default MatchersEditorModal;
