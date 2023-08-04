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

const { Option } = Select;
const hostSelectBefore = (
  protocol: ProxyProtocol,
  onChange: (value: ProxyProtocol) => void
) => (
  <Select
    defaultValue={ProxyProtocol.HTTP}
    value={protocol}
    onChange={(value) => {
      onChange(value);
    }}
  >
    <Option value={ProxyProtocol.HTTP}>http://</Option>
    <Option value={ProxyProtocol.HTTPS}>https://</Option>
  </Select>
);

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
        <div>
          <div>type</div>
          <div>
            <Select
              defaultValue={action.type}
              style={{ width: 220 }}
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
          <Row gutter={10}>
            <Col span={12}>
              <div>http status</div>
              <div>
                <InputNumber
                  style={{ width: "220px" }}
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
            </Col>
            <Col span={12}>
              <div>response type</div>
              <div>
                <Select
                  style={{ width: "220px" }}
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
            </Col>
          </Row>
          <div>headers</div>
          <div>
            <HeaderEditor
              headers={action.responseContent.headers}
              onHeaderModify={(headerIndex, value) => {
                let _headers = [...action.responseContent.headers];
                _headers[headerIndex] = value;
                actionContext.onActionModify({
                  ...action,
                  responseContent: {
                    ...action.responseContent,
                    headers: _headers,
                  },
                });
              }}
              onAddHeader={(header) => {
                actionContext.onActionModify({
                  ...action,
                  responseContent: {
                    ...action.responseContent,
                    headers: [...action.responseContent.headers, header],
                  },
                });
              }}
              onDeleteHeader={(headerIndex) => {
                let _headers = [...action.responseContent.headers];
                _headers.splice(headerIndex, 1);
                actionContext.onActionModify({
                  ...action,
                  responseContent: {
                    ...action.responseContent,
                    headers: _headers,
                  },
                });
              }}
            />
          </div>
          <div>content</div>
          <div>
            <TextArea
              rows={10}
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
              style={{ width: 220 }}
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
          <div>headers</div>
          <div>
            <HeaderEditor
                headers={action.headers||[]}
                onHeaderModify={(headerIndex, value) => {
                  let _headers = action.headers?[...action.headers]:[];
                  _headers[headerIndex] = value;
                  actionContext.onActionModify({
                    ...action,
                    headers: _headers,
                  });
                }}
                onAddHeader={(header) => {
                  actionContext.onActionModify({
                    ...action,
                    headers: action.headers?[...action.headers, header]:[header],
                  });
                }}
                onDeleteHeader={(headerIndex) => {
                  let _headers = action.headers?[...action.headers]:[];
                  _headers.splice(headerIndex, 1);
                  actionContext.onActionModify({
                    ...action,
                    headers: _headers,
                  });
                }}
            />
          </div>

          <div>host</div>
          <div>
            <Input
              addonBefore={hostSelectBefore(action.protocol, (value) => {
                actionContext.onActionModify({
                  ...action,
                  protocol: value,
                });
              })}
              value={action.host}
              onChange={(event) => {
                let value = event.target.value;
                let protocol = action.protocol;
                if (value.startsWith("http://")) {
                  protocol = ProxyProtocol.HTTP;
                  value = value.substring(7);
                } else if (value.startsWith("https://")) {
                  protocol = ProxyProtocol.HTTPS;
                  value = value.substring(8);
                }
                actionContext.onActionModify({
                  ...action,
                  host: value,
                  protocol: protocol,
                } as ProxyActionM);
              }}
            />
          </div>
          <div>cross config</div>
          <div>
            <Checkbox
              checked={action.handleCross}
              onChange={(e: CheckboxChangeEvent) => {
                actionContext.onActionModify({
                  ...action,
                  handleCross: e.target.checked,
                });
              }}
            >
              handle cross
            </Checkbox>
            <Checkbox
              checked={action.crossAllowCredentials}
              onChange={(e: CheckboxChangeEvent) => {
                actionContext.onActionModify({
                  ...action,
                  crossAllowCredentials: e.target.checked,
                });
              }}
            >
              allow Credentials
            </Checkbox>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionEditor;
