import {RequestMatcherM} from "./matcher";
import {ActionM} from "./action";
import { v4 as uuId } from "uuid";

export interface ExpectationM {
    id: string;
    name: string;
    delay: number;
    priority: number;
    activate: boolean;
    matchers: Array<RequestMatcherM>;
    action: ActionM | null;
    createTime: Date;
}

export function createExpectation():ExpectationM{
    return {
        action: null,
        activate: false,
        createTime: new Date(),
        delay: 0,
        id: uuId(),
        matchers: [],
        name: "",
        priority: 0
    }
}
