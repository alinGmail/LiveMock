import mStyle from "./ProjectInfo.module.scss";
import { ReactComponent as StartIcon } from "../../assets/svg/play2.svg";
import { ReactComponent as StopIcon } from "../../assets/svg/stop.svg";
import Icon, { LoadingOutlined, PlusOutlined } from "@ant-design/icons";
import { Dropdown, Modal, Switch } from "antd";
import { useEffect, useState } from "react";
import { Updater, useImmer } from "use-immer";
import { createProject, ProjectM, ProjectStatus } from "livemock-core/struct/project";
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
import { ReactComponent as DarkIcon } from "../../assets/svg/dark.svg";
import { ReactComponent as LightIcon } from "../../assets/svg/light.svg";
import { setMode } from "../../slice/systemConfigSlice";

const ProjectInfo = () => {
  const projectState = useAppSelector((state) => state.project);
  const systemConfigState = useAppSelector((state) => state.systemConfig);
  const [projectListDropdown, setProjectListDropdown] =
    useState<boolean>(false);
  const [projectModalShow, setProjectModalShow] = useState<boolean>(false);
  const [project, updateProject] = useImmer<ProjectM | null>(null);
  useEffect(() => {
    updateProject(createProject());
  }, []);

  async function onProjectEditorSubmit(project: ProjectM) {
    const createPromise = createProjectReq({ project });
    toast.promise(createPromise, {
      error: getErrorMessage,
      loading: "loading",
      success: "operation successful",
    });
    setProjectModalShow(false);
    createPromise.then(async (_res) => {
      let res = await getProjectListReq();
      dispatch(setProjectList(res));
    });
    updateProject(createProject());
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
      <div style={{ display: "flex", justifyContent: "space-between" }}>
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
        <div
          style={{
            color: "white",
            display: "flex",
            marginRight: "20px",
            alignItems: "center",
          }}
        >
          <DarkIcon
            style={{ fill: "#d9d9d9", stroke: "white", margin: "0px 6px" }}
          />
          <Switch
            checked={systemConfigState.mode === "dark"}
            onChange={(checked) => {
              dispatch(setMode(checked ? "dark" : "light"));
            }}
          />
          <LightIcon
            style={{ fill: "#d9d9d9", stroke: "white", margin: "0px 6px" }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectInfo;
