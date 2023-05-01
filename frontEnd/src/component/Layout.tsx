import mStyle from "./Layout.module.scss";
import LeftNav from "./LeftNav";
import { HashRouter } from "react-router-dom";
import ProjectInfo from "./project/ProjectInfo";

const Layout = () => {
  return (
    <HashRouter>
      <div className={mStyle.layout}>
        <div className={mStyle.headRow}>
          <ProjectInfo />
        </div>
        <div className={mStyle.mainRow}>
          <div className={mStyle.leftCol}>
            <LeftNav />
          </div>
          <div className={mStyle.rightCol}>bbb</div>
        </div>
      </div>
    </HashRouter>
  );
};

export default Layout;
