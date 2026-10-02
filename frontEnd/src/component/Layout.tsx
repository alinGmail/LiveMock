import mStyle from "./Layout.module.scss";
import LeftNav from "./LeftNav";
import { HashRouter, Outlet } from "react-router-dom";
import ProjectInfo from "./project/ProjectInfo";
import * as React from "react";

const Layout: React.FC<{}> = () => {
  return (
    <div className={mStyle.layout}>
      <div className={mStyle.headRow}>
        <ProjectInfo />
      </div>
      <div className={mStyle.mainRow}>
        <div className={mStyle.leftCol}>
          <LeftNav />
        </div>
        <div className={mStyle.rightCol}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
