import styles from "./AppBar.module.scss";
import { NavLink } from "react-router-dom";
import { Dropdown, Modal } from "antd";
import {
  LoadingOutlined,
  LogoutOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { Updater, useImmer } from "use-immer";
import { useDispatch } from "react-redux";
import logoUrl from "../assets/logo.png";
import { useAppSelector } from "../store";
import { setCurProjectIndex, setProjectList } from "../slice/projectSlice";
import {
  createProject,
  ProjectM,
  ProjectStatus,
} from "livemock-core/struct/project";
import ProjectEditor from "./project/ProjectEditor";
import ProjectSettingsModal, {
  ProjectSettingsValues,
} from "./ProjectSettingsModal";
import { EditorType } from "../struct/common";
import {
  createProjectReq,
  deleteProjectReq,
  getProjectListReq,
  startProjectReq,
  stopProjectReq,
  updateProjectReq,
} from "../server/projectServer";
import { logoutReq } from "../server/authServer";
import toast from "react-hot-toast";
import { getErrorMessage, toastPromise } from "./common";

const NAV_ITEMS = [
  { to: "/expectation", label: "Expectation" },
  { to: "/requestLog", label: "Request Log" },
];

function statusLabel(status: ProjectStatus, port: string): string {
  switch (status) {
    case ProjectStatus.STARTED:
      return `running :${port}`;
    case ProjectStatus.STOPPED:
      return `stopped :${port}`;
    case ProjectStatus.STARTING:
      return `starting :${port}`;
    case ProjectStatus.CLOSING:
      return `stopping :${port}`;
    default:
      return "";
  }
}

const GearIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width="16"
    height="16"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const AppBar = () => {
  const projectState = useAppSelector((state) => state.project);
  const dispatch = useDispatch();
  const currentProject = projectState.projectList[projectState.curProjectIndex];

  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [projectModalShow, setProjectModalShow] = useState(false);
  const [projectSettingsOpen, setProjectSettingsOpen] = useState(false);
  const [projectSettingsSaving, setProjectSettingsSaving] = useState(false);
  const [projectDeleting, setProjectDeleting] = useState(false);
  const [project, updateProject] = useImmer<ProjectM | null>(null);

  useEffect(() => {
    updateProject(createProject());
  }, []);

  const refreshProjects = () => {
    getProjectListReq().then((list) => {
      dispatch(setProjectList(list));
    });
  };

  const onCreateProject = (projectM: ProjectM) => {
    const createPromise = createProjectReq({ project: projectM });
    toast.promise(createPromise, {
      error: getErrorMessage,
      loading: "loading",
      success: "operation successful",
    });
    setProjectModalShow(false);
    createPromise.then(refreshProjects);
    updateProject(createProject());
  };

  const onToggleServer = () => {
    if (!currentProject) {
      return;
    }
    const promise =
      currentProject.status === ProjectStatus.STARTED
        ? stopProjectReq(currentProject.id)
        : startProjectReq(currentProject.id);
    toastPromise(promise);
    promise.then(refreshProjects);
  };

  const onSaveProjectSettings = async (values: ProjectSettingsValues) => {
    if (!currentProject) {
      return;
    }
    setProjectSettingsSaving(true);
    try {
      await updateProjectReq(currentProject.id, { projectUpdate: values });
      toast.success("Project settings saved");
      refreshProjects();
      setProjectSettingsOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setProjectSettingsSaving(false);
    }
  };

  const onDeleteProject = async () => {
    if (!currentProject) {
      return;
    }
    setProjectDeleting(true);
    try {
      await deleteProjectReq(currentProject.id);
      toast.success("Project deleted");
      setProjectSettingsOpen(false);
      getProjectListReq()
        .then((list) => {
          dispatch(setProjectList(list));
          dispatch(setCurProjectIndex(0));
        })
        .catch(() => {
          toast.error("Project deleted, but the list failed to refresh.");
        });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setProjectDeleting(false);
    }
  };

  const onLogout = () => {
    logoutReq().catch((error) => {
      toast.error(getErrorMessage(error));
    });
  };

  const transitioning =
    currentProject &&
    (currentProject.status === ProjectStatus.STARTING ||
      currentProject.status === ProjectStatus.CLOSING);
  const running = currentProject?.status === ProjectStatus.STARTED;

  const projectMenu = (
    <div className={styles.menu}>
      {projectState.projectList.map((p, index) => (
        <button
          key={p.id}
          type="button"
          className={[
            styles.menuItem,
            index === projectState.curProjectIndex
              ? styles.menuItemActive
              : "",
          ].join(" ")}
          onClick={() => {
            dispatch(setCurProjectIndex(index));
            setProjectMenuOpen(false);
          }}
        >
          <div className={styles.menuItemMain}>
            <span className={styles.menuItemName}>{p.name}</span>
            <span className={styles.menuItemMeta}>
              <span
                className={[
                  styles.statusDot,
                  p.status === ProjectStatus.STARTED ? styles.statusDotOn : "",
                ].join(" ")}
              />
              {statusLabel(p.status, p.port)}
            </span>
          </div>
        </button>
      ))}
      <div className={styles.menuSep} />
      <button
        type="button"
        className={styles.menuItem}
        onClick={() => {
          setProjectModalShow(true);
          setProjectMenuOpen(false);
        }}
      >
        <PlusOutlined />
        <span>Create New Project</span>
      </button>
    </div>
  );

  const overflowMenu = (
    <div className={styles.menu}>
      <div className={[styles.menuItem, styles.menuItemInfo].join(" ")}>
        version {APP_VERSION}
      </div>
      <div className={styles.menuSep} />
      <button
        type="button"
        className={styles.menuItem}
        onClick={() => {
          setOverflowOpen(false);
          onLogout();
        }}
      >
        <LogoutOutlined />
        <span>Logout</span>
      </button>
    </div>
  );

  return (
    <header className={styles.appbar}>
      <Modal
        centered={true}
        open={projectModalShow}
        footer={null}
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
            onSubmit={onCreateProject}
            updaterProjectM={updateProject as Updater<ProjectM>}
          />
        )}
      </Modal>

      {projectSettingsOpen && currentProject ? (
        <ProjectSettingsModal
          project={currentProject}
          saving={projectSettingsSaving}
          deleting={projectDeleting}
          onSubmit={onSaveProjectSettings}
          onDelete={onDeleteProject}
          onClose={() => setProjectSettingsOpen(false)}
        />
      ) : null}

      <div className={styles.brand}>
        <img className={styles.brandLogo} src={logoUrl} alt="LiveMock" />
        <span>LiveMock</span>
      </div>
      <span className={styles.divider} aria-hidden="true" />

      <Dropdown
        trigger={["click"]}
        open={projectMenuOpen}
        onOpenChange={setProjectMenuOpen}
        placement="bottomLeft"
        dropdownRender={() => projectMenu}
      >
        <button type="button" className={styles.projectTrigger}>
          <span className={styles.projectMeta}>
            <span className={styles.projectName}>
              {currentProject?.name ?? "No project"}
            </span>
            <span className={styles.projectSub}>
              {currentProject
                ? statusLabel(currentProject.status, currentProject.port)
                : ""}
            </span>
          </span>
          <svg
            className={styles.chev}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </Dropdown>

      <nav className={styles.nav} aria-label="Pages">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [styles.navTab, isActive ? styles.navTabActive : ""].join(" ")
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        className={styles.iconBtn}
        aria-label="Project settings"
        title="Project settings"
        onClick={() => setProjectSettingsOpen(true)}
        disabled={!currentProject}
      >
        <GearIcon />
      </button>

      <span className={styles.spacer} />

      <span
        className={[
          styles.statusPill,
          running ? styles.statusPillRunning : "",
          transitioning ? styles.statusPillPending : "",
        ].join(" ")}
      >
        {transitioning ? (
          <LoadingOutlined />
        ) : (
          <span
            className={[styles.statusDot, running ? styles.statusDotOn : ""].join(
              " ",
            )}
          />
        )}
        {currentProject
          ? statusLabel(currentProject.status, currentProject.port)
          : ""}
      </span>

      <button
        type="button"
        className={[styles.iconBtn, running ? styles.stopBtn : ""].join(" ")}
        onClick={onToggleServer}
        disabled={!currentProject || !!transitioning}
        aria-label={running ? "Stop project" : "Start project"}
        title={running ? "Stop project" : "Start project"}
      >
        {transitioning ? (
          <LoadingOutlined />
        ) : running ? (
          <StopOutlined />
        ) : (
          <PlayCircleOutlined />
        )}
      </button>

      <Dropdown
        trigger={["click"]}
        open={overflowOpen}
        onOpenChange={setOverflowOpen}
        placement="bottomRight"
        dropdownRender={() => overflowMenu}
      >
        <button
          type="button"
          className={styles.iconBtn}
          aria-label="More actions"
          title="More actions"
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            width="16"
            height="16"
            aria-hidden="true"
          >
            <circle cx="5" cy="12" r="1.6" />
            <circle cx="12" cy="12" r="1.6" />
            <circle cx="19" cy="12" r="1.6" />
          </svg>
        </button>
      </Dropdown>
    </header>
  );
};

export default AppBar;
