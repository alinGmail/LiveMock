import mStyle from "./Layout.module.scss";
import LeftNav from "./LeftNav";
import { HashRouter } from "react-router-dom";

const Layout = () => {
  return (
    <HashRouter>
      <div className={mStyle.layout}>
        <div className={mStyle.leftCol}>
          <LeftNav />
        </div>
        <div className={mStyle.rightCol}>bbb</div>
      </div>
    </HashRouter>
  );
};

export default Layout;
