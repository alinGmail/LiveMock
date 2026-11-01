import styles from "./AppBar.module.scss";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Dropdown } from "antd";
import {
  LoadingOutlined,
  LogoutOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { useDispatch } from "react-redux";
import logoUrl from "../assets/logo.png";
import { useAppSelector } from "../store";
import { useOptionalCurrentProject } from "./route/useCurrentProject";
import { setProjectList } from "../slice/projectSlice";
import { createProject, ProjectStatus } from "livemock-core/struct/project";
import ProjectSettingsModal, {
  ProjectSettingsValues,
} from "./ProjectSettingsModal";
import ProjectForm, {
  ProjectFormValues,
} from "./project/ProjectForm";
import Modal from "./Modal";
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
import {
  ProjectPage,
  pageSegmentFromPathname,
  projectPath,
} from "./route/routes";

const NAV_ITEMS: Array<{ page: ProjectPage; label: string }> = [
  { page: "expectation", label: "Expectation" },
  { page: "requestLog", label: "Request Log" },
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

const ChevronIcon = () => (
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
);

const AppBar = () => {
  const projectState = useAppSelector((state) => state.project);
  const username = useAppSelector((state) => state.auth.username);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const currentProject = useOptionalCurrentProject();
  // Which page the user is on, so a project switch keeps it.
  const pageSegment = pageSegmentFromPathname(pathname);

  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [projectModalShow, setProjectModalShow] = useState(false);
  const [projectCreating, setProjectCreating] = useState(false);
  const [projectSettingsOpen, setProjectSettingsOpen] = useState(false);
  const [projectSettingsSaving, setProjectSettingsSaving] = useState(false);
  const [projectDeleting, setProjectDeleting] = useState(false);

  const refreshProjects = async () => {
    const list = await getProjectListReq();
    dispatch(setProjectList(list));
    return list;
  };

  const onCreateProject = async (values: ProjectFormValues) => {
    const project = createProject();
    project.name = values.name;
    project.port = values.port;
    project.maxRequestLogNumber = values.maxRequestLogNumber;
    project.description = values.description;
    setProjectCreating(true);
    try {
      await createProjectReq({ project });
      toast.success("Project created");
      setProjectModalShow(false);
      // Load the list first, so the guard can resolve the new project's URL.
      const list = await refreshProjects();
      if (list.some((item) => item.id === project.id)) {
        navigate(projectPath(project.id, "expectation"));
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setProjectCreating(false);
    }
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
      // Remove the project locally first, so a failed refresh cannot leave the
      // deleted project selected.
      const remaining = projectState.projectList.filter(
        (project) => project.id !== currentProject.id
      );
      dispatch(setProjectList(remaining));
      if (remaining[0]) {
        navigate(projectPath(remaining[0].id, pageSegment), { replace: true });
      }
      getProjectListReq()
        .then((list) => {
          dispatch(setProjectList(list));
          if (!remaining[0] && list[0]) {
            navigate(projectPath(list[0].id, pageSegment), { replace: true });
          }
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
  const initial = (username || "account").charAt(0).toUpperCase();

  const projectMenu = (
    <div className={styles.menu}>
      {projectState.projectList.map((p) => (
        <Link
          key={p.id}
          to={projectPath(p.id, pageSegment)}
          className={[
            styles.menuItem,
            styles.menuLink,
            p.id === currentProject?.id ? styles.menuItemActive : "",
          ].join(" ")}
          onClick={() => {
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
        </Link>
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
        <span>New project</span>
      </button>
    </div>
  );

  const userMenu = (
    <div className={[styles.menu, styles.userMenu].join(" ")}>
      <div className={styles.userMenuHead}>
        <span className={[styles.avatar, styles.avatarLg].join(" ")}>
          {initial}
        </span>
        <div>
          <div className={styles.accountName}>{username || "account"}</div>
          <div className={styles.accountMeta}>Single account · signed in</div>
        </div>
      </div>
      <div className={styles.menuSep} />
      <button
        type="button"
        className={styles.menuItem}
        onClick={() => {
          setUserMenuOpen(false);
          navigate("/settings");
        }}
      >
        <GearIcon />
        <span>Settings</span>
      </button>
      <button
        type="button"
        className={styles.menuItem}
        onClick={() => {
          setUserMenuOpen(false);
          onLogout();
        }}
      >
        <LogoutOutlined />
        <span>Sign out</span>
      </button>
    </div>
  );

  return (
    <header className={styles.appbar}>
      {projectModalShow ? (
        <Modal
          title="New project"
          size="md"
          onClose={() => setProjectModalShow(false)}
        >
          <ProjectForm
            submitting={projectCreating}
            onSubmit={onCreateProject}
          />
        </Modal>
      ) : null}

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
          <ChevronIcon />
        </button>
      </Dropdown>

      <nav className={styles.nav} aria-label="Pages">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.page}
            className={({ isActive }) =>
              [styles.navTab, isActive ? styles.navTabActive : ""].join(" ")
            }
            to={
              currentProject
                ? projectPath(currentProject.id, item.page)
                : `/${item.page}`
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

      {currentProject ? (
        <button
          type="button"
          className={[styles.iconBtn, running ? styles.stopBtn : ""].join(" ")}
          onClick={onToggleServer}
          disabled={!!transitioning}
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
      ) : null}

      <Dropdown
        trigger={["click"]}
        open={userMenuOpen}
        onOpenChange={setUserMenuOpen}
        placement="bottomRight"
        dropdownRender={() => userMenu}
      >
        <button
          type="button"
          className={styles.userTrigger}
          aria-label="User menu"
          title={username || "Account"}
        >
          <span className={styles.avatar}>{initial}</span>
          <span className={styles.uname}>{username || "account"}</span>
          <ChevronIcon />
        </button>
      </Dropdown>
    </header>
  );
};

export default AppBar;
