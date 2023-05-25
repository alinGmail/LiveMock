import mStyle from "./ProjectInfo.module.scss";
import {ReactComponent as StartIcon} from "../../assets/svg/play2.svg";
import StopIcon from "../svg/stop.svg";
import Icon, {PlusOutlined} from "@ant-design/icons";
import {Dropdown, Modal} from "antd";
import {useEffect, useState} from "react";
import {Updater, useImmer} from "use-immer";
import {createProject, ProjectM} from "core/struct/project";
import ProjectEditor from "./ProjectEditor";
import {EditorType} from "../../struct/common";

const ProjectInfo = () => {
    const [projectModalShow, setProjectModalShow] = useState<boolean>(true);
    const [project, updateProject] = useImmer<ProjectM | null>(null);
    useEffect(() => {
        updateProject(createProject());
    }, []);
    return (
        <div>
            <Modal
                centered={true}
                open={projectModalShow}
                footer={null}
                bodyStyle={{
                    paddingBottom:"10px"
                }}
                onCancel={()=>{
                    setProjectModalShow(false);
                }}
                width={640}
                title={'Add Project'}>
                {project && (
                    <ProjectEditor
                        editorType={EditorType.ADD}
                        projectM={project}
                        onSubmit={() => {
                        }}
                        updaterProjectM={updateProject as Updater<ProjectM>}
                    />
                )}
            </Modal>
            <Dropdown overlay={
                <div className={''} style={{
                    width: "200px",
                    marginLeft: "30px"
                }}>
                    <div className={'menuWrap'}>
                        <div className={'menu'}>
                            <div className={'menuItem'} onClick={()=>{
                                setProjectModalShow(true);
                            }}><PlusOutlined
                                style={{
                                    position: "relative",
                                    top: "0px",
                                }}
                            />&nbsp; Create New Project
                            </div>
                        </div>
                    </div>
                </div>
            }>
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
                                onClick={(event) => {
                                }}
                                spin={false}
                            />
                        </div>
                    </div>
                </div>
            </Dropdown>
        </div>
    );
};

export default ProjectInfo;
