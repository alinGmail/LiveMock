import { useParams } from "react-router-dom";
import { ProjectM } from "livemock-core/struct/project";
import { useAppSelector } from "../../store";

/**
 * The current project: the one named by the URL, falling back to the last
 * resolved project for pages that live outside the project segment.
 */
export const useOptionalCurrentProject = (): ProjectM | null => {
  const { projectId } = useParams();
  const projectList = useAppSelector((state) => state.project.projectList);
  const mirroredId = useAppSelector((state) => state.project.currentProjectId);
  const id = projectId ?? mirroredId;
  if (!id) {
    return null;
  }
  return projectList.find((project) => project.id === id) ?? null;
};

/**
 * For pages rendered under the project route guard, where the project is
 * guaranteed to be resolved.
 */
export const useCurrentProject = (): ProjectM =>
  useOptionalCurrentProject() as ProjectM;
