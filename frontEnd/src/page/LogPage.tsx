import React, {useEffect, useState} from "react";
import { v4 as uuId } from "uuid";
import {createSimpleFilter} from "../../../core/struct/log";
import LogFilterComponent from "../component/log/LogFilterComponent";
import {io, Socket} from "socket.io-client";


const pageId:string = uuId();

const LogPage:React.FC = ()=>{
    const [socketInstance,setSocketInstance] = useState<Socket|null>(null);
    useEffect(() =>{
        const socket = io("http://localhost:9002");

        // client-side
        socket.on("connect", () => {
            console.log(socket.id); // x8WIv7-mJelg7on_ALbx
        });
        setSocketInstance(socket);
    },[])
    const simpleFilterM = createSimpleFilter();
    return <div>
        <LogFilterComponent filter={simpleFilterM} />
    </div>
}

export default LogPage;
