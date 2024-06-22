import lokijs from "lokijs";
import fs from 'fs';
import {checkValidIdStr} from "../util/commonUtils";

const allMapDbMap = new Map<string, Map<string, Promise<Loki>>>();

export async function getDb(
  projectId: string,
  path: string,
  name: string
): Promise<Loki> {
  if(!checkValidIdStr(projectId)){
    throw new Error(`Invalid project ID: ${projectId}`);
  }
  let dbMap = allMapDbMap.get(name);
  if (dbMap == null) {
    dbMap = new Map<string, Promise<Loki>>();
    allMapDbMap.set(name, dbMap);
  }
  const db = dbMap.get(`${path}/${projectId}`);
  if (!db) {
    let newDbP = new Promise<Loki>((resolve, reject) => {
      let expectationDb = new lokijs(`${path}/${projectId}_${name}.db`, {
        autoload: true,
        autosave: true,
        autosaveInterval: 4000,
        autoloadCallback: databaseInitialize,
      });
      function databaseInitialize() {
        resolve(expectationDb);
      }
    });
    dbMap.set(`${path}/${projectId}`, newDbP);
    return newDbP;
  } else {
    return db;
  }
}

export async function getCollection<T extends Object>(
  projectId: string,
  path: string,
  name: string
): Promise<Collection<T>> {
  const db = await getDb(projectId, path, name);
  let collection = db.getCollection<T>(name);
  if (collection === null) {
    collection = db.addCollection<T>(name);
  }
  return collection;
}

export async function deleteDatabase(
  projectId: string,
  path: string,
  name: string
) {
  const db = await getDb(projectId, path, name);
  return new Promise((resolve, reject) => {
    db.deleteDatabase((err, data) => {
      if (err) {
        if (fs.existsSync(db.filename)) {
          reject(err);
        } else {
          // ignore, maybe the file was not created
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
  });
}
