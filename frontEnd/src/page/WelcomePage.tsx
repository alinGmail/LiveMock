import mStyle from "./WelcomePage.module.scss";
import { useImmer } from "use-immer";
import { ProjectM } from "/core/struct";
import { useEffect, useState } from "react";
import { createProject } from "../../../core/struct/project";

export const WelcomePage = () => {
  const [project, updateProject] = useImmer<ProjectM | null>(null);
  useEffect(()=>{
      updateProject(createProject());
  },[])
  const [count, setCount] = useState(0);
  return (
    <div className={mStyle.welcomePage}>
      <div className={mStyle.title}>Welcome to LiveMock{count}</div>
      <div className={mStyle.smallTitle}>create a project to start</div>
      <div
        onClick={() => {
          setCount(count + 1);
        }}
      >
        ffff
      </div>
    </div>
  );
};

export default WelcomePage;