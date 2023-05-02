import { EditorType } from "../../struct/common";
import { ProjectM } from "core/struct/project";
import { FC } from "react";
import { Button, Col, Input, InputNumber, Row } from "antd";
import mStyle from "./ProjectEditor.module.scss";
import TextArea from "antd/es/input/TextArea";

const ProjectEditor: FC<{
  editorType: EditorType;
  projectM: ProjectM | null;
  onSubmit: (project: ProjectM) => void;
}> = (
  { editorType, projectM } = {
    projectM: null,
    editorType: EditorType.ADD,
  }
) => {
  if (!projectM) {
    return null;
  }
  return (
    <div className={mStyle.projectEditor}>
      <Row gutter={16}>
        <Col span={18}>
          <div className={mStyle.inpLabel}>project name:</div>
          <div>
            <Input placeholder={""} />
          </div>
        </Col>
        <Col span={6}>
          <div className={mStyle.inpLabel}>port:</div>
          <div>
            <InputNumber style={{ width: "100%" }} placeholder={""} />
          </div>
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <div className={mStyle.inpLabel}>description:</div>
          <div>
            <TextArea rows={4} placeholder={""} />
          </div>
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <Button className={mStyle.submitBtn} size={"large"} type={"primary"}>Submit</Button>
        </Col>
      </Row>
    </div>
  );
};

export default ProjectEditor;
