import lokijs from "lokijs";
import { getCollection, getDb } from "./dbUtils";
import { ProjectM } from "livemock-core/struct/project";
import { ExpectationM } from "livemock-core/struct/expectation";
import { LogViewM } from "livemock-core/struct/logView";
import { LogM } from "livemock-core/struct/log";
import {SystemConfigM} from "livemock-core/struct/systemConfig";


const projectDbPromiseMap = new Map<string, Promise<Loki>>();

export async function getProjectDb(path: string): Promise<Loki> {
  let projectDbP = projectDbPromiseMap.get(path);
  if (!projectDbP) {
    let newDbP = new Promise<Loki>((resolve, reject) => {
      let projectDb = new lokijs(`${path}/project.db`, {
        autoload: true,
        autosave: true,
        autosaveInterval: 4000,
        autoloadCallback: databaseInitialize,
      });
      function databaseInitialize() {
        resolve(projectDb);
      }
    });
    projectDbPromiseMap.set(path, newDbP);
    return newDbP;
  } else {
    return projectDbP;
  }
}

export async function getExpectationDb(
  projectId: string,
  path: string
): Promise<Loki> {
  return getDb(projectId, path, "expectation");
}

export async function getLogViewDb(projectId: string, path: string) {
  return getDb(projectId, path, "logView");
}

export async function getLogDb(projectId: string, path: string): Promise<Loki> {
  return getDb(projectId, path, "log");
}

export async function getProjectCollection(path: string) {
  const projectDb = await getProjectDb(path);
  let entries = projectDb.getCollection<ProjectM>("project");
  if (entries === null) {
    entries = projectDb.addCollection<ProjectM>("project");
  }
  return entries;
}

export async function getSystemCollection(path:string){
  const projectDb = await getProjectDb(path);
  let entries = projectDb.getCollection<SystemConfigM>("system");
  if (entries === null) {
    entries = projectDb.addCollection<SystemConfigM>("system");
  }
  return entries;
}


export async function getExpectationCollection(
  projectId: string,
  path: string
) {
  return getCollection<ExpectationM>(projectId, path, "expectation");
}

export async function getLogViewCollection(projectId: string, path: string) {
  return getCollection<LogViewM>(projectId, path, "logView");
}

export async function getLogCollection(projectId: string, path: string) {
  return getCollection<LogM>(projectId, path, "log");
}

const logIndexMap = new Map<string, number>();

/**
 * get the newest log index
 * @param projectId
 * @param path
 */
export function getNewLogNumber(projectId: string, path: string): number {
  const number = logIndexMap.get(`${path}/${projectId}`);
  let resIndex = 100001;
  if (number) {
    resIndex = number + 1;
  }
  logIndexMap.set(`${path}/${projectId}`, resIndex);
  return resIndex;
}

export function setNewestLogNumber(
  projectId: string,
  path: string,
  newestLogIndex: number
) {
  logIndexMap.set(`${path}/${projectId}`, newestLogIndex);
}
