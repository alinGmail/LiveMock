import React, {useEffect, useState} from "react";
import { v4 as uuId } from "uuid";
import {createSimpleFilter, LogM} from "core/struct/log";
import LogFilterComponent from "../component/log/LogFilterComponent";
import {io, Socket} from "socket.io-client";
import {useAppSelector} from "../store";


const pageId:string = uuId();

const LogPage:React.FC = ()=>{
    const projectState = useAppSelector((state) => state.project);
    const currentProject = projectState.projectList[projectState.curProjectIndex];
    const [socketInstance,setSocketInstance] = useState<Socket|null>(null);
    const [logs,setLogs] = useState<Array<LogM>>([])
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

    </div>
}

export default LogPage;
