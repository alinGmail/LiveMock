import Datastore from "nedb";
import PromiseDatastore from "./promiseDatastore";
import { ProjectM } from "core/struct/project";
import { ExpectationM } from "core/struct/expectation";
import { LogM } from "core/struct/log";

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
    let newExpectationDbP = new PromiseDatastore<ExpectationM>(
      newExpectationDb
    );
    expectationDbMap.set(projectName, newExpectationDbP);
    return newExpectationDbP;
  } else {
    return expectationDbP;
  }
}

const logDbMap = new Map<string, PromiseDatastore<LogM>>();

export function getLogDb(projectName: string): PromiseDatastore<LogM> {
  const logDbP = logDbMap.get(projectName);
  if (!logDbP) {
    const newLogDb = new Datastore({
      filename: `db/${projectName}_Log.db`,
      autoload: true,
    });
    let newLogDbP = new PromiseDatastore<LogM>(newLogDb);
    logDbMap.set(projectName, newLogDbP);
    return newLogDbP;
  } else {
    return logDbP;
  }
}
