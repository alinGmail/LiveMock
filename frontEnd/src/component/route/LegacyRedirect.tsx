import { Navigate, useLocation } from "react-router-dom";
import { pageSegmentFromPathname, projectPath, useFirstProjectId } from "./routes";

/**
 * Catches URLs that do not name a project (`#/`, `#/expectation`,
 * `#/requestLog`, `#/project`, anything unknown) and sends them to the first
 * project, keeping the page the user asked for when there is one.
 */
const LegacyRedirect = () => {
  const firstProjectId = useFirstProjectId();
  const { pathname } = useLocation();

  if (!firstProjectId) {
    return null;
  }

  return (
    <Navigate
      to={projectPath(firstProjectId, pageSegmentFromPathname(pathname))}
      replace
    />
  );
};

export default LegacyRedirect;
