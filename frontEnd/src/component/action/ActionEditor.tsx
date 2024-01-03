import React, { ChangeEvent, useCallback } from "react";
import {
  ActionM,
  ActionType,
  getNewAction,
  ProxyActionM,
  ProxyProtocol,
} from "core/struct/action";
import { Checkbox, Col, Input, InputNumber, Row, Select } from "antd";
import { useActionContext } from "../context";
import { ResponseType } from "core/struct/action";
import TextArea from "antd/es/input/TextArea";
import HeaderEditor from "./HeaderEditor";
import mStyle from "./ActionEditor.module.scss";
import { CheckboxChangeEvent } from "antd/es/checkbox";
import CustomResponseActionEditor from "./CustomResponseActionEditor";
import ProxyActionEditor from "./ProxyActionEditor";

const ActionEditor: React.FC<{
  action: ActionM;
}> = ({ action }) => {
  const actionContext = useActionContext();
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

  return (
    <div className={["popper", mStyle.actionEditor].join(" ")}>
      {action.type === ActionType.CUSTOM_RESPONSE && (
        <CustomResponseActionEditor action={action} typeChange={typeChange} />
      )}
      {action.type === ActionType.PROXY && (
        <ProxyActionEditor action={action} typeChange={typeChange} />
      )}
    </div>
  );
};

export default ActionEditor;
