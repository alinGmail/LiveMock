import React, { useState } from "react";
import { ActionM, ActionType } from "core/struct/action";
import mStyle from "./ActionItem.module.scss";
import { CloseSquareOutlined } from "@ant-design/icons";
import { useActionContext } from "../context";
import { Dropdown } from "antd";
import ActionEditor from "./ActionEditor";

const ActionItem: React.FC<{
  action: ActionM;
  onPropertyChange: (action: ActionM) => void;
}> = ({ action, onPropertyChange }) => {
  const actionContext = useActionContext();
  const [dropShow, setDropShow] = useState(false);

  return (
    <div>
      <Dropdown
        visible={dropShow}
        onVisibleChange={(visible) => {
          setDropShow(visible);
        }}
        placement={"bottom"}
        trigger={["click"]}
        overlay={
          <div>
            <ActionEditor action={action} />
          </div>
        }
      >
        <div>
            {action.type === ActionType.PROXY && <div >
                <div className={mStyle.actionWrap}>
                    proxy to {action.host}
                    &nbsp;&nbsp;
                    <CloseSquareOutlined
                        className={mStyle.closeBtn}
                        onClick={() => {
                            actionContext.onActionRemove(action.id);
                        }}
                    />
                </div>
            </div>}
          {action.type === ActionType.CUSTOM_RESPONSE && (
            <div className={mStyle.actionWrap}>
              response {action.status} with {action.responseContent.type}
              &nbsp;&nbsp;
              <CloseSquareOutlined
                className={mStyle.closeBtn}
                onClick={() => {
                  actionContext.onActionRemove(action.id);
                }}
              />
            </div>
          )}
        </div>
      </Dropdown>
    </div>
  );
};
export default ActionItem;
