import React, { ChangeEvent, useCallback } from "react";
import {
  ActionM,
  ActionType,
  getNewAction,
  ProxyActionM,
} from "core/struct/action";
import { Input, InputNumber, Select } from "antd";
import { useActionContext } from "../context";
import { ResponseType } from "core/struct/action";
import TextArea from "antd/es/input/TextArea";
import HeaderEditor from "./HeaderEditor";
import mStyle from "./ActionEditor.module.scss";

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
    <div className={["popper",mStyle.actionEditor].join(" ")}>
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
          <div>http status</div>
          <div>
            <InputNumber
              value={action.status}
              onChange={(value) => {
                if (value !== null) {
                  actionContext.onActionModify({
                    ...action,
                    status: value,
                  });
                }
              }}
            />
          </div>
          <div>response type</div>
          <div>
            <Select
              defaultValue={action.responseContent.type}
              options={[
                {
                  value: ResponseType.TEXT,
                  label: ResponseType.TEXT,
                },
                {
                  value: ResponseType.JSON,
                  label: ResponseType.JSON,
                },
              ]}
              onChange={(value) => {
                actionContext.onActionModify({
                  ...action,
                  responseContent: {
                    ...action.responseContent,
                    type: value,
                  },
                });
              }}
            />
          </div>
          <div>headers</div>
          <div>
            <HeaderEditor
              headers={action.responseContent.headers}
              onHeaderModify={(headerIndex, value) => {}}
              onAddHeader={(header) => {
                actionContext.onActionModify({
                  ...action,
                  responseContent: {
                    ...action.responseContent,
                    headers: [...action.responseContent.headers, header],
                  },
                });
              }}
              onDeleteHeader={(headerEditor) => {}}
            />
          </div>
          <div>content</div>
          <div>
            <TextArea
              value={action.responseContent.value}
              onChange={(event: ChangeEvent<{ value: string }>) => {
                actionContext.onActionModify({
                  ...action,
                  responseContent: {
                    ...action.responseContent,
                    value: event.target.value,
                  },
                });
              }}
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
            <Input
              value={action.host}
              onChange={(event) => {
                actionContext.onActionModify({
                  ...action,
                  host: event.target.value,
                } as ProxyActionM);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionEditor;
