const net = require('net');

/**
 * check the port is running
 * @param port
 */
export function checkPort(port):Promise<boolean> {
    return new Promise((resolve, reject) => {
        const server = net.createServer();

        server.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                resolve(true); // 端口被占用
            } else {
                reject(err); // 其他错误
            }
            server.close();
        });

        server.once('listening', () => {
            resolve(false); // 端口空闲
            server.close();
        });

        server.listen(port);
    });
}



const runMap = {}

export function once(key:string,fn:Function){
    if(runMap[key]){
        return;
    }
    runMap[key] = true;
    fn();
}