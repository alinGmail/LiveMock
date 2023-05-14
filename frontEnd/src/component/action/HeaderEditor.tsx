import React from "react";
import { Button, Col, Row } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import mStyle from "./HeaderEditor.module.scss";
import { useActionContext } from "../context";
import { NInput } from "../nui/NInput";

const HeaderEditor: React.FC<{
  headers: Array<[string, string]>;
  onHeaderModify: (headerIndex: number, value: [string, string]) => void;
  onAddHeader: (header: [string, string]) => void;
  onDeleteHeader: (headerIndex: number) => void;
}> = ({ headers, onHeaderModify, onAddHeader }) => {
  return (
    <div>
      <Row>
        <Col span={12}>key</Col>
        <Col span={12}>value</Col>
      </Row>
      {headers.map((header) => {
        return (
          <Row>
            <Col span={12}>
              <NInput value={header[0]} />
            </Col>
            <Col span={12}>
              <NInput value={header[1]} />
            </Col>
          </Row>
        );
      })}
      <Row>
        <div
          className={["textBtn", mStyle.addBtn].join(" ")}
          onClick={() => {
            onAddHeader(["", ""]);
            //onAddHeader && onAddHeader();
          }}
        >
          <PlusOutlined /> ADD
        </div>
      </Row>
    </div>
  );
};

export default HeaderEditor;
