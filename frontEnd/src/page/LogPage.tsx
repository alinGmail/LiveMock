import React, {useEffect, useState} from "react";
import { v4 as uuId } from "uuid";
import {createSimpleFilter, LogM} from "core/struct/log";
import LogFilterComponent from "../component/log/LogFilterComponent";
import {io, Socket} from "socket.io-client";
import {useAppSelector} from "../store";
import {useDispatch} from "react-redux";
import {Table} from "antd";
import {configColumn, getCustomColumn, getDefaultColumn} from "./LogPageColumn";


// const pageId:string = uuId();

const LogPage:React.FC = ()=>{


    const logState = useAppSelector(state => state.log);
    let {
        columnConfigShow,
        columnEditorShow,
        currentColumnEditIndex,
        defaultColumnVisible,
        logFilter,
        logList,
        tableColumns
    } = logState;
    const dispatch = useDispatch();

    const projectState = useAppSelector((state) => state.project);
    const currentProject = projectState.projectList[projectState.curProjectIndex];
    const [socketInstance,setSocketInstance] = useState<Socket|null>(null);
    const [logs,setLogs] = useState<Array<LogM>>([]);

    const customColumns = getCustomColumn(
        tableColumns.filter((item, index) => item.visible),
        dispatch
    );
    const logColumn = getDefaultColumn(dispatch)
        .filter((item, index) => defaultColumnVisible[index])
        .concat(customColumns)
        .concat(configColumn);


    useEffect(() =>{
        const socket = io("http://localhost:9002",{
            query:{
                projectId:currentProject.id
            }
        });

        // client-side
        socket.on("connect", () => {
            // socket.emit('setProjectId',currentProject.id);
            socket.emit('initLogsReq');
            //console.log(socket.id); // x8WIv7-mJelg7on_ALbx
        });
        socket.on('initLogsRes',(logs)=>{
            console.log(logs);
            setLogs(logs);
        });
        setSocketInstance(socket);
        return ()=>{
            socket.disconnect();
        }
    },[])
    const simpleFilterM = createSimpleFilter();
    return <div>
        <LogFilterComponent filter={simpleFilterM} />
        <div >
            <Table
                columns={logColumn}
                dataSource={logs}
                size={"small"}
                tableLayout={"fixed"}
            />
        </div>
    </div>
}

export default LogPage;
