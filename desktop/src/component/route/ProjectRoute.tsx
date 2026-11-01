import { useLayoutEffect, useRef } from "react";
import { Navigate, Outlet, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { useAppSelector } from "../../store";
import { setCurrentProjectId } from "../../slice/projectSlice";
import { projectPath, useFirstProjectId } from "./routes";

/**
 * Resolves the `:projectId` route param against the loaded project list.
 *
 * The URL is the source of truth: a param that does not resolve to a project
 * redirects to the first project, and an empty list renders nothing (the app
 * shows the welcome page outside the router in that case).
 *
 * The resolved id is mirrored into the store in a layout effect so that
 * components rendered beside the route (the top bar) see it before the first
 * paint.
 */
const ProjectRoute = () => {
  const { projectId } = useParams();
  const dispatch = useDispatch();
  const projectList = useAppSelector((state) => state.project.projectList);
  const project = projectList.find((p) => p.id === projectId);
  const firstProjectId = useFirstProjectId();
  const resolvedId = project?.id;
  const reportedIdRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (resolvedId) {
      dispatch(setCurrentProjectId(resolvedId));
    }
  }, [dispatch, resolvedId]);

  useEffect(() => {
    if (
      projectId &&
      !resolvedId &&
      firstProjectId &&
      reportedIdRef.current !== projectId
    ) {
      reportedIdRef.current = projectId;
      toast.error("Project not found");
    }
  }, [projectId, resolvedId, firstProjectId]);

  if (!resolvedId) {
    return firstProjectId ? (
      <Navigate to={projectPath(firstProjectId, "expectation")} replace />
    ) : null;
  }

  return <Outlet context={project} />;
};

export default ProjectRoute;
