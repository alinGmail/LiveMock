import { useAppSelector } from "../../store";

export type ProjectPage = "expectation" | "requestLog";

/** URL of a page inside a project. */
export const projectPath = (projectId: string, page: ProjectPage) =>
  `/project/${projectId}/${page}`;

/** The page segment a pathname points at, used to keep it across navigations. */
export const pageSegmentFromPathname = (pathname: string): ProjectPage =>
  pathname.endsWith("/requestLog") ? "requestLog" : "expectation";

/** The project to fall back to when the URL does not name one. */
export const useFirstProjectId = (): string | null =>
  useAppSelector((state) => state.project.projectList[0]?.id ?? null);
