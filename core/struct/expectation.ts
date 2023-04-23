import {RequestMatcherM} from "./matcher";
import {ActionM} from "./action";




export interface ExpectationM {
    id: string;
    name: string;
    delay: number;
    priority: number;
    activate: boolean;
    matchers: Array<RequestMatcherM>;
    action: ActionM | null;
    createTime: Date;
    _id?: string | undefined | null;
}

