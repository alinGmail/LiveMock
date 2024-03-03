import { v4 as uuId } from "uuid";
import { ActionM } from "./action";
import { RequestMatcherM } from "./matcher";
import _ from "lodash";

export interface ExpectationM {
  id: string;
  name: string;
  delay: number;
  priority: number;
  activate: boolean;
  matchers: Array<RequestMatcherM>;
  actions: Array<ActionM>;
  createTime: Date;
  $loki?: number;
}

export function createExpectation(): ExpectationM {
  return {
    actions: [],
    activate: true,
    createTime: new Date(),
    delay: 0,
    id: uuId(),
    matchers: [],
    name: "",
    priority: 0,
  };
}

export function duplicateExpectation(expectation: ExpectationM): ExpectationM {
  const expectationDP = _.cloneDeep(expectation);

  delete expectationDP.$loki;
  expectationDP.name = 'copy of' + expectation.name;
  expectationDP.id = uuId();
  expectationDP.matchers.forEach((matcherItem) => {
      matcherItem.id = uuId();
  });
  expectationDP.actions.forEach((actionItem) =>{
      actionItem.id = uuId();
  });

  return expectationDP;
}
