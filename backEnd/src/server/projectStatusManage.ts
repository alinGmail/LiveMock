import {ProjectStatus} from "livemock-core/struct/project";
import * as http from "http";
import * as net from "net";


let projectStatusMap = new Map<string,ProjectStatus>();
let projectServerMap = new Map<string,http.Server>();
const serverSocketMap = new WeakMap<http.Server, Set<net.Socket>>();

export function getProjectStatus(projectId:string):ProjectStatus{
    const projectStatus = projectStatusMap.get(projectId);

    if(projectStatus == null){
        return ProjectStatus.STOPPED;
    }else{
        return projectStatus;
    }

}

export function setProjectStatus(projectId:string,projectStatus:ProjectStatus){
    projectStatusMap.set(projectId,projectStatus);
}




export  function getProjectServer(projectId:string,path:string):http.Server|undefined{
    return projectServerMap.get(projectId);
}

export function setProjectServer(projectId:string,server:http.Server){
    projectServerMap.set(projectId,server);
}

/**
 * Remember every raw socket accepted by a mock server. `server.close()` waits
 * for in-flight requests, and `closeAllConnections()` does not destroy sockets
 * upgraded to another protocol (WebSocket), so the stop path needs the sockets
 * themselves to close promptly.
 */
export function trackServerConnections(server:http.Server){
    const sockets = new Set<net.Socket>();
    serverSocketMap.set(server, sockets);
    server.on("connection", (socket:net.Socket) => {
        sockets.add(socket);
        socket.once("close", () => sockets.delete(socket));
    });
}

/**
 * Close a mock server immediately instead of waiting for in-flight requests or
 * WebSocket connections to end on their own.
 */
export function stopServer(server:http.Server):Promise<void>{
    return new Promise((resolve, reject) => {
        const sockets = serverSocketMap.get(server);
        let settled = false;
        const forceClose = () => {
            (server as any).closeIdleConnections?.();
            (server as any).closeAllConnections?.();
            sockets?.forEach((socket) => socket.destroy());
        };
        const finish = (error?:Error | null) => {
            if (settled) {
                return;
            }
            settled = true;
            clearTimeout(timer);
            if (error && (error as any).code !== "ERR_SERVER_NOT_RUNNING") {
                reject(error);
            } else {
                resolve();
            }
        };
        // safety net: never leave a project stuck in CLOSING
        const timer = setTimeout(() => {
            console.warn("mock server close timed out, forcing shutdown");
            forceClose();
            finish();
        }, 3000);

        server.close(finish);
        forceClose();
    });
}

