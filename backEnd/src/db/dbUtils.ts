import lokijs from "lokijs";

const allMapDbMap = new Map<string, Map<string, Promise<Loki>>>();

export async function getDb(
  projectId: string,
  path: string,
  name: string
): Promise<Loki> {
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
