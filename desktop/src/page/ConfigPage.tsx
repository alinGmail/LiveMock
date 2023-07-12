import ProjectEditor from "../component/project/ProjectEditor";
import { EditorType } from "../struct/common";
import { useImmer } from "use-immer";
import { useAppSelector } from "../store";
import { useDebounceEffect, useDebounceFn } from "ahooks";
import { debounceWait } from "../config";
import { getProjectListReq, updateProjectReq } from "../server/projectServer";
import { toastPromise } from "../component/common";
import { setProjectList } from "../slice/projectSlice";
import { useDispatch } from "react-redux";
import { useEffect, useRef } from "react";

const ConfigPage = () => {
  const dispatch = useDispatch();
  const isStartUp = useRef(true);
  const projectState = useAppSelector((state) => state.project);
  const currentProject = projectState.projectList[projectState.curProjectIndex];
  const [modifyProject, updateModifyProject] = useImmer(currentProject);

  useEffect(() => {
    updateModifyProject(currentProject);
    isStartUp.current = true;
  }, [currentProject]);
  function onProjectEditorSubmit() {}
  useDebounceEffect(
    () => {
      if (isStartUp.current) {
        isStartUp.current = false;
        return;
      }
      const updatePromise = updateProjectReq(modifyProject.id, {
        projectUpdate: modifyProject,
      });
      toastPromise(updatePromise);
      updatePromise.then(async (_res) => {
        let res = await getProjectListReq();
        dispatch(setProjectList(res));
      });
    },
    [modifyProject],
    {
      wait: debounceWait,
    }
  );

  return (
    <div style={{padding:"20px 10px"}}>
      <ProjectEditor
        editorType={EditorType.MODIFY}
        projectM={modifyProject}
        onSubmit={onProjectEditorSubmit}
        updaterProjectM={updateModifyProject}
      />
    </div>
  );
};

export default ConfigPage;
