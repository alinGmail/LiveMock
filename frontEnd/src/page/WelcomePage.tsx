import mStyle from "./WelcomePage.module.scss";
import { useImmer } from "use-immer";
import { ProjectM } from "core/struct/project";
import { useEffect, useState } from "react";
import { createProject } from "core/struct/project";
import ProjectEditor from "../component/project/ProjectEditor";
import { EditorType } from "../struct/common";

export const WelcomePage = () => {
  const [project, updateProject] = useImmer<ProjectM | null>(null);
  useEffect(() => {
    updateProject(createProject());
  }, []);

  return (
    <div className={mStyle.welcomePage}>
      <div className={mStyle.title}>Welcome to LiveMock</div>
      <div className={mStyle.smallTitle}>create a project to start</div>
      <ProjectEditor editorType={EditorType.ADD} projectM={project} />

    </div>
  );
};

export default WelcomePage;
