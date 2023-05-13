import React, { useCallback, useState } from "react";
import { ActionM, ActionType, getNewAction } from "core/struct/action";
import { Input, Select } from "antd";
import { useActionContext } from "../context";

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
    <div>
      {action.type === ActionType.CUSTOM_RESPONSE && (
        <div>
          <div>type</div>
          <div>
            <Select
              defaultValue={action.type}
              style={{ width: 120 }}
              onChange={typeChange}
              options={[
                { value: ActionType.PROXY, label: ActionType.PROXY },
                {
                  value: ActionType.CUSTOM_RESPONSE,
                  label: ActionType.CUSTOM_RESPONSE,
                },
              ]}
            />
          </div>
        </div>
      )}
      {action.type === ActionType.PROXY && (
        <div>
          <div>type</div>
          <div>
            <Select
              defaultValue={action.type}
              style={{ width: 120 }}
              onChange={typeChange}
              options={[
                { value: ActionType.PROXY, label: ActionType.PROXY },
                {
                  value: ActionType.CUSTOM_RESPONSE,
                  label: ActionType.CUSTOM_RESPONSE,
                },
              ]}
            />
          </div>
          <div>host</div>
          <div>
            <Input />
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionEditor;
