import {ActionM, ActionType, IAction} from "core/struct/action";
import {CustomResponseActionImpl} from "./CustomResponseAction";


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
            //return new ProxyActionImpl(action, logDbP, delay);
            return null;
        case ActionType.CUSTOM_RESPONSE:
            return new CustomResponseActionImpl(action, delay);
        default:
            return null;
    }
}



export { delayPromise };
