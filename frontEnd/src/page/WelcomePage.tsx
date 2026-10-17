import { useState } from "react";
import { createProject, ProjectM } from "livemock-core/struct/project";
import { createProjectReq, getProjectListReq } from "../server/projectServer";
import { logoutReq } from "../server/authServer";
import { getErrorMessage } from "../component/common";
import ProjectForm, {
  ProjectFormValues,
} from "../component/project/ProjectForm";
import { setProjectList } from "../slice/projectSlice";
import { useAppSelector } from "../store";
import { useDispatch } from "react-redux";
import logoUrl from "../assets/logo.png";
import btn from "../component/buttonStyles.module.scss";
import styles from "./WelcomePage.module.scss";

const CheckIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m5 12 5 5 9-10" />
  </svg>
);

/**
 * First-run onboarding: create the first project, then a summary screen with
 * "Open dashboard". The project list is only dispatched when the user leaves
 * this page, so the Done screen is not skipped by the authenticated router.
 */
const WelcomePage = () => {
  const dispatch = useDispatch();
  const username = useAppSelector((state) => state.auth.username);
  const [created, setCreated] = useState<ProjectM | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const onSignOut = () => {
    logoutReq().catch(() => {
      // logout always notifies the app; nothing else to do here
    });
  };

  const onCreateProject = async (values: ProjectFormValues) => {
    const project = createProject();
    project.name = values.name;
    project.port = values.port;
    project.maxRequestLogNumber = values.maxRequestLogNumber;
    project.description = values.description;
    setSubmitting(true);
    setError("");
    try {
      const res = await createProjectReq({ project });
      setCreated(res);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const openDashboard = () => {
    getProjectListReq()
      .then((list) => dispatch(setProjectList(list)))
      .catch((err) => setError(getErrorMessage(err)));
  };

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <img src={logoUrl} alt="" />
          <span>LiveMock</span>
        </div>
        <span className={styles.grow} />
        <span className={styles.signedIn}>{username || "account"}</span>
        <button
          type="button"
          className={[btn.btn, btn.ghost].join(" ")}
          onClick={onSignOut}
        >
          Sign out
        </button>
      </header>

      <main className={styles.screen}>
        {created ? (
          <div className={styles.welcome}>
            <span className={styles.doneBadge}>
              <CheckIcon />
            </span>
            <h1>Project ready</h1>
            <p className={styles.sub}>
              <span className={styles.mono}>{created.name}</span> is ready on{" "}
              <span className={styles.mono}>:{created.port}</span>.
            </p>

            <section className={styles.card}>
              <div className={styles.cardBody}>
                <div className={styles.summaryGrid}>
                  <div className={styles.summaryItem}>
                    <span className={styles.k}>Project</span>
                    <span className={styles.v}>{created.name}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.k}>Port</span>
                    <span className={[styles.v, styles.mono].join(" ")}>
                      :{created.port}
                    </span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.k}>Max request log</span>
                    <span className={[styles.v, styles.mono].join(" ")}>
                      {created.maxRequestLogNumber}
                    </span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.k}>Account</span>
                    <span className={styles.v}>{username || "account"}</span>
                  </div>
                  <div className={[styles.summaryItem, styles.span2].join(" ")}>
                    <span className={styles.k}>Description</span>
                    <span className={styles.v}>
                      {created.description || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <div className={styles.doneActions}>
              <button
                type="button"
                className={[btn.btn, btn.primary].join(" ")}
                onClick={openDashboard}
              >
                Open dashboard
              </button>
              <button
                type="button"
                className={[btn.btn, btn.ghost].join(" ")}
                onClick={() => {
                  setCreated(null);
                  setError("");
                }}
              >
                Create another project
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.welcome}>
            <h1>Welcome to LiveMock</h1>
            <p className={styles.sub}>
              Create your first project to start mocking.
            </p>

            <section className={styles.card}>
              <div className={styles.cardHead}>
                <h3>New project</h3>
                <span className={styles.hint}>
                  you can change this later in Project settings
                </span>
              </div>
              <div className={styles.cardBody}>
                {error ? (
                  <div className={styles.formError} role="alert">
                    {error}
                  </div>
                ) : null}
                <ProjectForm
                  submitting={submitting}
                  onSubmit={onCreateProject}
                />
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default WelcomePage;
