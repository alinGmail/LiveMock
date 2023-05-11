import { v4 as uuId } from "uuid";
import { ActionM } from "./action";
import { RequestMatcherM } from "./matcher";

export interface ExpectationM {
    id: string;
    name: string;
    delay: number;
    priority: number;
    activate: boolean;
    matchers: Array<RequestMatcherM>;
    actions: Array<ActionM>;
    createTime: Date;
}

export function createExpectation():ExpectationM{
    return {
        actions: [],
        activate: false,
        createTime: new Date(),
        delay: 0,
        id: uuId(),
        matchers: [],
        name: "",
        priority: 0
    }
}
