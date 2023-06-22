import mStyle from "./ProjectInfo.module.scss";
import { ReactComponent as StartIcon } from "../../assets/svg/play2.svg";
import { ReactComponent as StopIcon } from "../../assets/svg/stop.svg";
import Icon, { LoadingOutlined, PlusOutlined } from "@ant-design/icons";
import { Dropdown, Modal } from "antd";
import { useEffect, useState } from "react";
import { Updater, useImmer } from "use-immer";
import { createProject, ProjectM, ProjectStatus } from "core/struct/project";
import ProjectEditor from "./ProjectEditor";
import { EditorType } from "../../struct/common";
import {
  createProjectReq,
  getProjectListReq,
  startProjectReq,
  stopProjectReq,
} from "../../server/projectServer";
import toast from "react-hot-toast";
import { getErrorMessage, toastPromise } from "../common";
import { useAppSelector } from "../../store";
import { useDispatch } from "react-redux";
import { setCurProjectIndex, setProjectList } from "../../slice/projectSlice";

const ProjectInfo = () => {
  const projectState = useAppSelector((state) => state.project);
  const [projectListDropdown, setProjectListDropdown] =
    useState<boolean>(false);
  const [projectModalShow, setProjectModalShow] = useState<boolean>(true);
  const [project, updateProject] = useImmer<ProjectM | null>(null);
  useEffect(() => {
    updateProject(createProject());
  }, []);

  function onProjectEditorSubmit(project: ProjectM) {
    const createPromise = createProjectReq({ project });
    toast.promise(createPromise, {
      error: getErrorMessage,
      loading: "loading",
      success: "operation successful",
    });
    setProjectModalShow(false);
  }

  const ProjectStatusComponent = ({
    port,
    projectStatus,
  }: {
    projectStatus: ProjectStatus;
    port: string;
  }) => {
    switch (projectStatus) {
      case ProjectStatus.STARTED:
        return (
          <div className={mStyle.projectStatus}>running on port {port}</div>
        );
      case ProjectStatus.STOPPED:
        return (
          <div className={mStyle.projectStatus}>stopped on port {port}</div>
        );
      case ProjectStatus.STARTING:
        return (
          <div className={mStyle.projectStatus}>starting on port {port}</div>
        );
      case ProjectStatus.CLOSING:
        return (
          <div className={mStyle.projectStatus}>stopping on port {port}</div>
        );
    }
  };

  const currentProject = projectState.projectList[projectState.curProjectIndex];
  const dispatch = useDispatch();
  return (
    <div>
      <Modal
        centered={true}
        open={projectModalShow}
        footer={null}
        bodyStyle={{
          paddingBottom: "10px",
        }}
        onCancel={() => {
          setProjectModalShow(false);
        }}
        width={640}
        title={"Add Project"}
      >
        {project && (
          <ProjectEditor
            editorType={EditorType.ADD}
            projectM={project}
            onSubmit={onProjectEditorSubmit}
            updaterProjectM={updateProject as Updater<ProjectM>}
          />
        )}
      </Modal>
      <Dropdown
        overlayStyle={{ width: "240px", minWidth: "240px" }}
        open={projectListDropdown}
        onOpenChange={() => {
          setProjectListDropdown(true);
        }}
        onVisibleChange={(visible) => {
          setProjectListDropdown(visible);
        }}
        overlay={
          <div
            className={""}
            style={{
              width: "200px",
              marginLeft: "30px",
            }}
          >
            <div className={"menuWrap"}>
              <div className={"menu"}>
                {projectState.projectList.map((project, index) => {
                  return (
                    <div
                      key={project.id}
                      onClick={() => {
                        dispatch(setCurProjectIndex(index));
                        setProjectListDropdown(false);
                      }}
                      className={"menuItem"}
                    >
                      {project.name}
                    </div>
                  );
                })}
                <div
                  className={"menuItem"}
                  onClick={() => {
                    setProjectModalShow(true);
                    setProjectListDropdown(false);
                  }}
                >
                  <PlusOutlined
                    style={{
                      position: "relative",
                      top: "0px",
                    }}
                  />
                  &nbsp; Create New Project
                </div>
              </div>
            </div>
          </div>
        }
      >
        <div className={mStyle.projectInfo}>
          <div className={mStyle.curProjectRow}>
            <div className={mStyle.rowLeft}>
              <div className={mStyle.projectName}>{currentProject.name}</div>
              <ProjectStatusComponent
                projectStatus={currentProject.status}
                port={currentProject.port}
              />
            </div>
            <div className={mStyle.rowRight}>
              {currentProject.status === ProjectStatus.STARTED && (
                <Icon
                  component={StopIcon}
                  style={{
                    color: "#f5222d",
                    fontSize: "36px",
                  }}
                  className={mStyle.startIcon}
                  onClick={(event) => {
                    const stopPromise = stopProjectReq(currentProject.id);
                    toastPromise(stopPromise);
                    stopPromise.then(async (res) => {
                      // refresh project list
                      let projectLists = await getProjectListReq();
                      dispatch(setProjectList(projectLists));
                    });
                  }}
                  spin={false}
                />
              )}
              {currentProject.status === ProjectStatus.STOPPED && (
                <Icon
                  component={StartIcon}
                  style={{
                    color: "#98FF98",
                    fontSize: "36px",
                  }}
                  className={mStyle.startIcon}
                  onClick={(event) => {
                    // start the project
                    const startProjectPromise = startProjectReq(
                      currentProject!.id
                    );
                    toastPromise(startProjectPromise);
                    startProjectPromise.then(async (res) => {
                      // refresh project list
                      let projectLists = await getProjectListReq();
                      dispatch(setProjectList(projectLists));
                    });
                  }}
                  spin={false}
                />
              )}
              {(currentProject.status === ProjectStatus.STARTING ||
                currentProject.status === ProjectStatus.CLOSING) && (
                <LoadingOutlined
                  style={{
                    color: "#ffec3d",
                    fontSize: "36px",
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </Dropdown>
    </div>
  );
};

export default ProjectInfo;
