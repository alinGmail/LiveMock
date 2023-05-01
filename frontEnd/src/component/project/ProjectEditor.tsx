import { EditorType } from "../../struct/common";
import { ProjectM } from "core/struct/project";
import { FC } from "react";

const ProjectEditor: FC<{ editorType: EditorType; projectM: ProjectM }> = (
  { editorType, projectM } = {
    projectM: null,
    editorType: EditorType.ADD,
  }
) => {
  if (!projectM) {
    return null;
  }
  return <div></div>;
};

export default ProjectEditor;
