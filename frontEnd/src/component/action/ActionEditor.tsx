import React, { useCallback, useState } from "react";
import {ActionM, ActionType, getNewAction, ProxyActionM} from "core/struct/action";
import { Input, Select } from "antd";
import { useActionContext } from "../context";
import {useDebounceFn} from "ahooks";
import {debounceWait} from "../../config";

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

  const {
    run :updateHost,
    cancel,
    flush
  } = useDebounceFn(
      (action:ActionM,value:string)=>{
        actionContext.onActionModify({
          ...action,
          host:value
        } as ProxyActionM);
      },
      {wait:debounceWait}
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
            <Input value={action.host} onChange={(event) => {
              updateHost(action,event.target.value);
            }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionEditor;
