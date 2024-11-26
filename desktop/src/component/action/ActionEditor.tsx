import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ActionM, ActionType, getNewAction } from "livemock-core/struct/action";
import { useActionContext } from "../context";
import mStyle from "./ActionEditor.module.scss";
import CustomResponseActionEditor from "./CustomResponseActionEditor";
import ProxyActionEditor from "./ProxyActionEditor";
import { FullscreenExitOutlined, FullscreenOutlined } from "@ant-design/icons";
import { Button } from "antd";

const ActionEditor: React.FC<{
  action: ActionM;
}> = ({ action }) => {
  const actionContext = useActionContext();
  const [fullScreen, setFullScreen] = useState<boolean>(false);
  const fullScreenCB = useRef<Function | null>(null);
  useEffect(() => {
    fullScreenCB.current && fullScreenCB.current();
    fullScreenCB.current = null;
  }, [fullScreen]);
  const typeChange = useCallback(
    (type: ActionType) => {
      if (type !== action.type) {
        const newAction = getNewAction(action.id, action.type);
        actionContext.onActionModify({
          ...action,
          type: type,
        } as ActionM);
      }
    },
    [action]
  );

  function Content() {
    return (
      <div
        className={[
          "popper",
          mStyle.actionEditor,
          fullScreen ? mStyle.fullScreenEditor : "",
        ].join(" ")}
        style={{
          viewTransitionName: "action-editor",
        }}
      >
        <Button
          shape={"circle"}
          size={"small"}
          icon={
            fullScreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />
          }
          className={mStyle.fullScreenBtn}
          onClick={() => {
            document.startViewTransition(async () => {
              return new Promise((resolve, reject) => {
                setFullScreen(!fullScreen);
                fullScreenCB.current = resolve;
              });
            });
          }}
        ></Button>
        {action.type === ActionType.CUSTOM_RESPONSE && (
          <CustomResponseActionEditor
            action={action}
            typeChange={typeChange}
            fullScreen={fullScreen}
          />
        )}
        {action.type === ActionType.PROXY && (
          <ProxyActionEditor action={action} typeChange={typeChange} />
        )}
      </div>
    );
  }

  return Content();
};

export default ActionEditor;
