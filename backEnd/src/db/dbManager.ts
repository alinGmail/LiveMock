import lokijs from "lokijs";


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
        let entries = projectDb.getCollection("project");
        if (entries === null) {
          entries = projectDb.addCollection("project");
        }
        resolve(projectDb);
      }
    });
    projectDbPromiseMap.set(path, newDbP);
    return newDbP;
  } else {
    return projectDbP;
  }
}

const expectationDbMap = new Map<string, Promise<Loki>>();

export async function getExpectationDb(
  projectId: string,
  path: string
): Promise<Loki> {
  const expectationDbP = expectationDbMap.get(`${path}/${projectId}`);
  if (!expectationDbP) {
    let newDbP = new Promise<Loki>((resolve, reject) => {
      let expectationDb = new lokijs(`${path}/${projectId}_Exp.db`, {
        autoload: true,
        autosave: true,
        autosaveInterval: 4000,
        autoloadCallback: databaseInitialize,
      });
      function databaseInitialize() {
        let entries = expectationDb.getCollection("expectation");
        if (entries === null) {
          entries = expectationDb.addCollection("expectation");
        }
        resolve(expectationDb);
      }
    });
    expectationDbMap.set(`${path}/${projectId}`, newDbP);
    return newDbP;
  } else {
    return expectationDbP;
  }
}

const allMapDbMap = new Map<string,Map<string,Promise<Loki>>>();

export async function getDb(projectId:string,path:string,name:string):Promise<Loki>{
  let dbMap = allMapDbMap.get(name);
  if(dbMap == null){
    dbMap = new Map<string, Promise<Loki>>();
    allMapDbMap.set(name,dbMap);
  }
  const db = dbMap.get(`${path}/${projectId}`);
  if(!db){
    let newDbP = new Promise<Loki>((resolve, reject) => {
      let expectationDb = new lokijs(`${path}/${projectId}_${name}.db`, {
        autoload: true,
        autosave: true,
        autosaveInterval: 4000,
        autoloadCallback: databaseInitialize,
      });
      function databaseInitialize() {
        let entries = expectationDb.getCollection(name);
        if (entries === null) {
          entries = expectationDb.addCollection(name);
        }
        resolve(expectationDb);
      }
    });
    dbMap.set(`${path}/${projectId}`, newDbP);
    return newDbP;
  }else {
    return db;
  }
}

export async function getLogViewDb(projectId:string,path:string){
  return getDb(projectId,path,"logView");
}


const logDbMap = new Map<string, Promise<Loki>>();

export async function getLogDb(
  projectId: string,
  path: string
): Promise<Loki> {
  const logDbP = logDbMap.get(`${path}/${projectId}`);
  if (!logDbP) {
    let newDbP = new Promise<Loki>((resolve, reject) => {
      let logDb = new lokijs(`${path}/${projectId}_Log.db`, {
        autoload: true,
        autosave: true,
        autosaveInterval: 4000,
        autoloadCallback: databaseInitialize,
      });
      function databaseInitialize() {
        let entries = logDb.getCollection("log");
        if (entries === null) {
          entries = logDb.addCollection("log");
        }
        resolve(logDb);
      }
    })
    logDbMap.set(`${path}/${projectId}`, newDbP);
    return newDbP;
  } else {
    return logDbP;
  }
}





const logIndexMap = new Map<string,number>();

/**
 * get the newest log index
 * @param projectId
 * @param path
 */
export function getNewLogNumber(projectId:string,path:string):number{
  const number = logIndexMap.get(`${path}/${projectId}`);
  let resIndex = 100001;
  if(number){
    resIndex = number + 1;
  }
  logIndexMap.set(`${path}/${projectId}`,resIndex);
  return resIndex;
}

export function setNewestLogNumber(projectId:string,path:string,newestLogIndex:number){
  logIndexMap.set(`${path}/${projectId}`,newestLogIndex);
}
