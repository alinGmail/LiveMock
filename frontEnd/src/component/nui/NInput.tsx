import { FC, memo, useRef, useState } from "react";
import ContentEditable from "react-contenteditable";
import styles from "./NInput.module.css";
import sanitizeHtml from "sanitize-html";

let NInput: FC<{
  value?: string;
  onChange?: (value: string) => void;
}> = ({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (value: string) => void;
}) => {
  //console.log("NInput")
  const curValue = useRef<string>(value ? value : "");
  const [showEmpty, setShowEmpty] = useState(!value);

  return (
    <div className={[styles.inputWrap, styles.sizeSmall].join(" ")}>
      {showEmpty ? <div className={styles.placeHolder}>empty</div> : null}
      <ContentEditable
          style={{
              "whiteSpace":"pre"
          }}
        onPaste={(event) => {
          event.preventDefault();
          // get paste date
          let clipboardData = event.clipboardData;
          let pastedText = clipboardData.getData("text/plain");
          pastedText = pastedText.trim();
          // input pure text in ContentEditable
          document.execCommand("insertText", false, pastedText);
        }}
        html={curValue.current}
        className={styles.inputEditor}
        onChange={(event) => {
          if (event.target.value === "<br>" || event.target.value === "") {
            setShowEmpty(true);
          } else {
            setShowEmpty(false);
          }
          curValue.current = sanitizeHtml(event.target.value, {
            allowedTags: [],
            allowedAttributes: {},
          });
          onChange && onChange(curValue.current);
        }}
      />
    </div>
  );
};

//NInput = memo(NInput,()=>true);

export { NInput };
