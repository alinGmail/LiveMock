import { useEffect, useLayoutEffect, useRef } from "react";
import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { useAppSelector } from "../../store";
import { setCurrentProjectId } from "../../slice/projectSlice";
import {
  pageSegmentFromPathname,
  projectPath,
  useFirstProjectId,
} from "./routes";

/**
 * Resolves the `:projectId` route param against the loaded project list.
 *
 * The URL is the source of truth: a param that does not resolve to a project
 * redirects to the first project, keeping the page the user was on. An empty
 * list renders nothing (the app shows the welcome page outside the router in
 * that case).
 *
 * The resolved id is mirrored into the store in a layout effect so that
 * components rendered beside the route (the top bar) see it before the first
 * paint.
 */
const ProjectRoute = () => {
  const { projectId } = useParams();
  const { pathname } = useLocation();
  const dispatch = useDispatch();
  const projectList = useAppSelector((state) => state.project.projectList);
  const firstProjectId = useFirstProjectId();
  const project = projectList.find((p) => p.id === projectId);
  const resolvedId = project?.id;
  const reportedIdRef = useRef<string | null>(null);

  // Ids this session has ever seen in the list. A project that disappears from
  // the list was deleted, not a broken link: the delete flow navigates away, and
  // the redirect below keeps the page. Only an id this session never resolved is
  // a stale link worth reporting.
  //
  // Accumulated during render on purpose: the render that sees the removal is
  // the one that has to decide, and an effect would be a frame too late.
  const knownIdsRef = useRef(new Set<string>());
  const wasKnown = !!projectId && knownIdsRef.current.has(projectId);
  projectList.forEach((item) => knownIdsRef.current.add(item.id));

  useLayoutEffect(() => {
    if (resolvedId) {
      dispatch(setCurrentProjectId(resolvedId));
    }
  }, [dispatch, resolvedId]);

  useEffect(() => {
    if (
      projectId &&
      !resolvedId &&
      !wasKnown &&
      firstProjectId &&
      reportedIdRef.current !== projectId
    ) {
      reportedIdRef.current = projectId;
      toast.error("Project not found");
    }
  }, [projectId, resolvedId, wasKnown, firstProjectId]);

  if (!resolvedId) {
    return firstProjectId ? (
      <Navigate
        to={projectPath(firstProjectId, pageSegmentFromPathname(pathname))}
        replace
      />
    ) : null;
  }

  return <Outlet context={project} />;
};

export default ProjectRoute;
