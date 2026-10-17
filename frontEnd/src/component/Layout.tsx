import AppBar from "./AppBar";
import { Outlet } from "react-router-dom";
import mStyle from "./Layout.module.scss";
import * as React from "react";

const Layout: React.FC = () => {
  return (
    <div className={mStyle.layout}>
      <AppBar />
      <div className={mStyle.content}>
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
