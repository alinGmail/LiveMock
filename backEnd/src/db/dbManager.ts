import Datastore from "nedb";
import PromiseDatastore from "./promiseDatastore";
import { ProjectM } from "core/struct/project";
import { ExpectationM } from "core/struct/expectation";
import { LogM } from "core/struct/log";

const projectDbMap = new Map<string, PromiseDatastore<ExpectationM>>();

export function getProjectDb(path: string): PromiseDatastore<ProjectM> {
  let projectDbP = projectDbMap.get(path);
  if (!projectDbP) {
    let projectDb = new Datastore({
      filename: `${path}/project.db`,
      autoload: true,
    });
    projectDbP = new PromiseDatastore<ProjectM>(projectDb);
    return projectDbP;
  } else {
    return projectDbP;
  }
}

const expectationDbMap = new Map<string, PromiseDatastore<ExpectationM>>();

export function getExpectationDb(
  projectId: string,
  path: string
): PromiseDatastore<ExpectationM> {
  const expectationDbP = expectationDbMap.get(`${path}/${projectId}`);
  if (!expectationDbP) {
    const newExpectationDb = new Datastore({
      filename: `${path}/${projectId}_Exp.db`,
      autoload: true,
    });
    let newExpectationDbP = new PromiseDatastore<ExpectationM>(
      newExpectationDb
    );
    expectationDbMap.set(projectId, newExpectationDbP);
    return newExpectationDbP;
  } else {
    return expectationDbP;
  }
}

const logDbMap = new Map<string, PromiseDatastore<LogM>>();

export function getLogDb(
  projectId: string,
  path: string
): PromiseDatastore<LogM> {
  const logDbP = logDbMap.get(`${path}/${projectId}`);
  if (!logDbP) {
    const newLogDb = new Datastore({
      filename: `${path}/${projectId}_Log.db`,
      autoload: true,
    });
    let newLogDbP = new PromiseDatastore<LogM>(newLogDb);
    logDbMap.set(projectId, newLogDbP);
    return newLogDbP;
  } else {
    return logDbP;
  }
}


