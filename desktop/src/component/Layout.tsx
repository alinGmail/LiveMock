import mStyle from "./Layout.module.scss";
import LeftNav from "./LeftNav";
import { Outlet } from "react-router-dom";
import ProjectInfo from "./project/ProjectInfo";
import * as React from "react";

const NAV_COLLAPSED_KEY = "navCollapsed";

const Layout: React.FC = () => {
  const [navCollapsed, setNavCollapsed] = React.useState<boolean>(() => {
    try {
      return localStorage.getItem(NAV_COLLAPSED_KEY) === "true";
    } catch {
      return false;
    }
  });

  const toggleNav = React.useCallback(() => {
    setNavCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(NAV_COLLAPSED_KEY, String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  return (
    <div className={mStyle.layout}>
      <div className={mStyle.headRow}>
        <ProjectInfo />
      </div>
      <div className={mStyle.mainRow}>
        <div
          className={[
            mStyle.leftCol,
            navCollapsed ? mStyle.leftColCollapsed : "",
          ].join(" ")}
        >
          <LeftNav collapsed={navCollapsed} onToggle={toggleNav} />
        </div>
        <div
          className={[
            mStyle.rightCol,
            navCollapsed ? mStyle.rightColCollapsed : "",
          ].join(" ")}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
