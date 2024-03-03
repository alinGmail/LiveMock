import { Col, InputNumber, Row, Select } from "antd";
import {
  ActionType,
  ContentHandler,
  CustomResponseActionM,
  ResponseType,
} from "core/struct/action";
import HeaderEditor from "./HeaderEditor";
import React from "react";
import { useActionContext } from "../context";
import Editor from "@monaco-editor/react";
import { useAppSelector } from "../../store";

export const CustomResponseActionEditor: React.FunctionComponent<{
  action: CustomResponseActionM;
  typeChange: (type: ActionType) => void;
}> = ({ action, typeChange }) => {
  const actionContext = useActionContext();
  const systemConfigState = useAppSelector((state) => state.systemConfig);
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
        <Row gutter={10}>
          <Col span={12}>
            <div>content handler</div>
            <Select
              style={{ width: "220px" }}
              defaultValue={action.responseContent.contentHandler}
              options={[
                {
                  value: ContentHandler.NONE,
                  label: ContentHandler.NONE,
                },
                {
                  value: ContentHandler.MOCK_JS,
                  label: ContentHandler.MOCK_JS,
                },
              ]}
              onChange={(value) => {
                actionContext.onActionModify({
                  ...action,
                  responseContent: {
                    ...action.responseContent,
                    contentHandler: value,
                  },
                });
              }}
            />
          </Col>
        </Row>
        <div>content</div>
        <div
          style={{
            border: "1px solid #bfbfbf",
            borderRadius: "4px",
            padding: "2px",
          }}
        >
          <Editor
            options={{ lineNumbers: "off" }}
            theme={systemConfigState.mode === "dark" ? "vs-dark" : "light"}
            height="300px"
            language={
              action.responseContent.type === ResponseType.JSON
                ? "json"
                : "none"
            }
            defaultValue={action.responseContent.value}
            onChange={(value) => {
              actionContext.onActionModify({
                ...action,
                responseContent: {
                  ...action.responseContent,
                  value: value ?? "",
                },
              });
            }}
          />
        </div>
      </div>
    </>
  );
};
export default CustomResponseActionEditor;
