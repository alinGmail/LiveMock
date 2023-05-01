import mStyle from "./ProjectInfo.module.scss";
import { ReactComponent as StartIcon } from "../../assets/svg/play2.svg";
import StopIcon from "../svg/stop.svg";
import Icon, { PlusOutlined } from "@ant-design/icons";

const ProjectInfo = () => {
  return (
    <div className={mStyle.projectInfo}>
      <div className={mStyle.curProjectRow}>
        <div className={mStyle.rowLeft}>
          <div className={mStyle.projectName}>test project name</div>
          <div className={mStyle.projectStatus}>running on port 8080</div>
        </div>
        <div className={mStyle.rowRight}>
          <Icon
            component={StartIcon}
            style={{
              color: "#98FF98",
              fontSize: "36px",
            }}
            className={mStyle.startIcon}
            onClick={(event) => {}}
            spin={false}
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectInfo;
