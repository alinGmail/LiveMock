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
}> = ({ headers, onHeaderModify, onAddHeader,onDeleteHeader }) => {
  return (
    <div>
      <Row className={mStyle.headerTilRow}>
        <Col span={11} className={mStyle.headerTilItem}>key</Col>
        <Col span={11} className={mStyle.headerTilItem}>value</Col>
        <Col span={2} className={mStyle.headerTilItem}>&nbsp;</Col>
      </Row>
      {headers.map((header,headerIndex) => {
        return (
          <Row className={mStyle.headerRow}>
            <Col span={11} className={mStyle.headerItem}>
              <NInput value={header[0]} onChange={(value)=>{
                  onHeaderModify(headerIndex,[value,header[1]])
              }}/>
            </Col>
            <Col span={11} className={mStyle.headerItem}>
              <NInput value={header[1]} onChange={(value => {
                  onHeaderModify(headerIndex,[header[0],value]);
              })}/>
            </Col>
            <Col span={2} className={mStyle.headerItem} style={{textAlign:"center",paddingTop:"5px"}}>
              <CloseSquareOutlined
                className={mStyle.closeBtn}
                onClick={() => {
                    onDeleteHeader(headerIndex);
                }}
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
          }}
        >
          <PlusOutlined /> ADD
        </div>
      </Row>
    </div>
  );
};

export default HeaderEditor;
