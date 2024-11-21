import React from "react";
import { ActionType, ProxyActionM, ProxyProtocol } from "core/struct/action";
import { Checkbox, Input, Select, Tooltip } from "antd";
import HeaderEditor from "./HeaderEditor";
import { CheckboxChangeEvent } from "antd/es/checkbox";
import { useActionContext } from "../context";
import moduleStyle from "./ProxyActionEditor.module.scss";
import { QuestionCircleOutlined } from "@ant-design/icons";

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

export const ProxyActionEditor: React.FunctionComponent<{
  action: ProxyActionM;
  typeChange: (type: ActionType) => void;
}> = ({ action, typeChange }) => {
  const actionContext = useActionContext();
  return (
    <>
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
        <div className={moduleStyle.row}>
          <div>
            request headers{" "}
            <Tooltip title={"the headers append to the request"}>
              <QuestionCircleOutlined style={{ fontSize: "12px" }} />
            </Tooltip>
          </div>
          <HeaderEditor
            headers={action.requestHeaders || []}
            onHeaderModify={(headerIndex, value) => {
              let _headers = action.requestHeaders
                ? [...action.requestHeaders]
                : [];
              _headers[headerIndex] = value;
              actionContext.onActionModify({
                ...action,
                requestHeaders: _headers,
              });
            }}
            onAddHeader={(header) => {
              actionContext.onActionModify({
                ...action,
                requestHeaders: action.requestHeaders
                  ? [...action.requestHeaders, header]
                  : [header],
              });
            }}
            onDeleteHeader={(headerIndex) => {
              let _headers = action.requestHeaders
                ? [...action.requestHeaders]
                : [];
              _headers.splice(headerIndex, 1);
              actionContext.onActionModify({
                ...action,
                requestHeaders: _headers,
              });
            }}
          />
        </div>
        <div className={moduleStyle.row}>
          <div>
            response headers{" "}
            <Tooltip title={"the headers append to the response"}>
              <QuestionCircleOutlined style={{ fontSize: "12px" }} />
            </Tooltip>
          </div>
          <div>
            <HeaderEditor
              headers={action.headers || []}
              onHeaderModify={(headerIndex, value) => {
                let _headers = action.headers ? [...action.headers] : [];
                _headers[headerIndex] = value;
                actionContext.onActionModify({
                  ...action,
                  headers: _headers,
                });
              }}
              onAddHeader={(header) => {
                actionContext.onActionModify({
                  ...action,
                  headers: action.headers
                    ? [...action.headers, header]
                    : [header],
                });
              }}
              onDeleteHeader={(headerIndex) => {
                let _headers = action.headers ? [...action.headers] : [];
                _headers.splice(headerIndex, 1);
                actionContext.onActionModify({
                  ...action,
                  headers: _headers,
                });
              }}
            />
          </div>
        </div>

        <div className={moduleStyle.row}>
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
        </div>
        <div className={moduleStyle.row}>
          <div>prefix remove</div>
          <div>
            <Input
              placeholder={"example: /api"}
              value={
                typeof action.prefixRemove === "string"
                  ? action.prefixRemove
                  : undefined
              }
              onChange={(event) => {
                actionContext.onActionModify({
                  ...action,
                  prefixRemove: event.target.value,
                });
              }}
            />
          </div>
        </div>
        <div className={moduleStyle.row}>
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
        <div className={moduleStyle.row}>
          <div>websocket config</div>
          <div>
            <Checkbox
              checked={action.supportWebsocket}
              onChange={(e) => {
                actionContext.onActionModify({
                  ...action,
                  supportWebsocket: e.target.checked,
                });
              }}
            >
              support websocket
            </Checkbox>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProxyActionEditor;
