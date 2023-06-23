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

const ConfigPage = () => {
  const dispatch = useDispatch();
  const projectState = useAppSelector((state) => state.project);
  const currentProject = projectState.projectList[projectState.curProjectIndex];

  const [modifyProject, updateModifyProject] = useImmer(currentProject);

  function onProjectEditorSubmit() {}

  useDebounceEffect(
    () => {
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
    <div>
      <ProjectEditor
        editorType={EditorType.ADD}
        projectM={modifyProject}
        onSubmit={onProjectEditorSubmit}
        updaterProjectM={updateModifyProject}
      />
    </div>
  );
};

export default ConfigPage;
