import { useState } from "react";
import { createProject } from "livemock-core/struct/project";
import { createProjectReq, getProjectListReq } from "../server/projectServer";
import { getErrorMessage } from "../component/common";
import ProjectForm, {
  ProjectFormValues,
} from "../component/project/ProjectForm";
import { setProjectList } from "../slice/projectSlice";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import logoUrl from "../assets/logo.png";
import styles from "./WelcomePage.module.scss";

/**
 * First-run onboarding: create the first project, then hand off to the shell.
 * Dispatching the refreshed project list makes App mount the router, whose
 * default route is the expectation page.
 */
const WelcomePage = () => {
  const dispatch = useDispatch();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const onCreateProject = async (values: ProjectFormValues) => {
    const project = createProject();
    project.name = values.name;
    project.port = values.port;
    project.maxRequestLogNumber = values.maxRequestLogNumber;
    project.description = values.description;
    setSubmitting(true);
    setError("");
    try {
      await createProjectReq({ project });
      toast.success("Project created");
      const list = await getProjectListReq();
      dispatch(setProjectList(list));
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <img src={logoUrl} alt="" />
          <span>LiveMock</span>
        </div>
      </header>

      <main className={styles.screen}>
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
      </main>
    </div>
  );
};

export default WelcomePage;
