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
