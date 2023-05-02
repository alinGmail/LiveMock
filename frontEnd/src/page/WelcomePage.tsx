import mStyle from "./WelcomePage.module.scss";
import { Updater, useImmer } from "use-immer";
import { ProjectM } from "core/struct/project";
import { useEffect, useState } from "react";
import { createProject } from "core/struct/project";
import ProjectEditor from "../component/project/ProjectEditor";
import { EditorType } from "../struct/common";
import {createProjectReq} from "../server/projectServer";

export const WelcomePage = () => {
  const [project, updateProject] = useImmer<ProjectM | null>(null);
  useEffect(() => {
    updateProject(createProject());
  }, []);

  function onProjectEditorSubmit(project: ProjectM) {
      createProjectReq({project});
  }

  return (
    <div className={mStyle.welcomePage}>
      <div className={mStyle.title}>Welcome to LiveMock</div>
      <div className={mStyle.smallTitle}>create a project to start</div>
      {project && (
        <ProjectEditor
          editorType={EditorType.ADD}
          projectM={project}
          onSubmit={onProjectEditorSubmit}
          updaterProjectM={updateProject as Updater<ProjectM>}
        />
      )}
    </div>
  );
};

export default WelcomePage;
