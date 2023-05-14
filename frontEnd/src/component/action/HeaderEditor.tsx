import React from "react";
import { Button, Col, Row } from "antd";
import { CloseSquareOutlined, PlusOutlined } from "@ant-design/icons";
import mStyle from "./HeaderEditor.module.scss";
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
        <Col span={10}>key</Col>
        <Col span={10}>value</Col>
        <Col span={4}>&nbsp;</Col>
      </Row>
      {headers.map((header) => {
        return (
          <Row className={mStyle.headerRow}>
            <Col span={11} className={mStyle.headerItem}>
              <NInput value={header[0]} />
            </Col>
            <Col span={11} className={mStyle.headerItem}>
              <NInput value={header[1]} />
            </Col>
            <Col span={2} className={mStyle.headerItem} style={{textAlign:"center",paddingTop:"5px"}}>
              <CloseSquareOutlined
                className={mStyle.closeBtn}
                onClick={() => {}}
              />
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
