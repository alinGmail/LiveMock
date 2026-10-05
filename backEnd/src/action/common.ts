import {ActionM, ActionType, IAction} from "livemock-core/struct/action";
import { LogM } from "livemock-core/struct/log";
import {CustomResponseActionImpl} from "./CustomResponseAction";
import ProxyActionImpl from "./ProxyAction";
import {StaticDirectoryActionImpl} from "./StaticDirectoryAction";


const util = require("util");

function delay(t, cb) {
    setTimeout(function () {
        let err: null | Error = null;
        cb(err, "Success");
    }, t);
}

let delayPromise = util.promisify(delay);


export function getActionImpl(
    action: ActionM,
    delay: number
): IAction | null {
    switch (action.type) {
        case ActionType.PROXY:
            return new ProxyActionImpl(action, delay);
        case ActionType.CUSTOM_RESPONSE:
            return new CustomResponseActionImpl(action, delay);
        case ActionType.STATIC_DIRECTORY:
            return new StaticDirectoryActionImpl(action, delay);
        default:
            return null;
    }
}



export function insertProxyInfo(log: LogM | undefined) {
    if (!log) {
        return;
    }
    log.proxyInfo = {
        isProxy: false,
        proxyHost: null,
        proxyPath: null,
        requestHeaders: [],
        responseHeaders: [],
    };
}


export { delayPromise };
