import Datastore from "nedb";
import PromiseDatastore from "./promiseDatastore";
import { ProjectM } from "core/struct/project";
import { ExpectationM } from "core/struct/expectation";


let projectDb = new Datastore({ filename: "db/project.db", autoload: true });
let projectDbP = new PromiseDatastore<ProjectM>(projectDb);
export function getProjectDb(): PromiseDatastore<ProjectM> {
  return projectDbP;
}

const expectationDbMap = new Map<string, PromiseDatastore<ExpectationM>>();

export function getExpectationDb(
  projectName: string
): PromiseDatastore<ExpectationM> {
  const expectationDbP = expectationDbMap.get(projectName);
  if (!expectationDbP) {
    const newExpectationDb = new Datastore({
      filename: `db/${projectName}_Exp.db`,
      autoload: true,
    });
    let newExpectationDbP = new PromiseDatastore<ExpectationM>(newExpectationDb);
    expectationDbMap.set(projectName, newExpectationDbP);
    return newExpectationDbP;
  } else {
    return expectationDbP;
  }
}

const requestLogDbMap = new Map<string,PromiseDatastore<RequestLogM>>();

export function getRequestLogDb(){

}


