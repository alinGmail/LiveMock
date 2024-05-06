import ProjectEditor from "../component/project/ProjectEditor";
import { EditorType } from "../struct/common";
import { useImmer } from "use-immer";
import { useAppSelector } from "../store";
import { useDebounceEffect, useDebounceFn } from "ahooks";
import { debounceWait } from "../config";
import {
  deleteProjectReq,
  getProjectListReq,
  updateProjectReq,
} from "../server/projectServer";
import { toastPromise } from "../component/common";
import { setProjectList } from "../slice/projectSlice";
import { useDispatch } from "react-redux";
import { useEffect, useRef, useState } from "react";
import { Button, Input, Modal } from "antd";
import { message } from "antd/lib";

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
    },
  );

  const [messageApi, messageContextHolder] = message.useMessage();
  const [projectNameInp, setProjectNameInp] = useState<string>("abc");
  const [deleteModalShow, setDeleteModalShow] = useState(false);

  return (
    <div style={{ padding: "20px 10px" }}>
      {messageContextHolder}
      <Modal
        title={"warning"}
        open={deleteModalShow}
        onOk={() => {
          if (projectNameInp !== currentProject.name) {
            messageApi.error("incorrect project name");
            return false;
          }
          const deletePromise = deleteProjectReq(currentProject.id).then(
            (res) => {
              setDeleteModalShow(false);
            },
          );
          toastPromise(deletePromise);
        }}
        onCancel={() => {
          setDeleteModalShow(false);
        }}
      >
        <div
          style={{
            lineHeight: "2em",
          }}
        >
          Are you sure want to delete the project{" "}
          <strong>{currentProject.name}</strong> ?
          <br />
          input the project name to confirm
          <Input
            value={projectNameInp}
            onChange={(e) => {
              setProjectNameInp(e.target.value);
            }}
            style={{
              marginTop: "4px",
            }}
          />
        </div>
      </Modal>
      <ProjectEditor
        editorType={EditorType.MODIFY}
        projectM={modifyProject}
        onSubmit={onProjectEditorSubmit}
        updaterProjectM={updateModifyProject}
      />
      <Button
        onClick={async () => {
          setDeleteModalShow(true);
        }}
      >
        Delete Project
      </Button>
    </div>
  );
};

export default ConfigPage;
