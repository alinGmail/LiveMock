import Nedb from "nedb";
const { promisify } = require("util");

class PromiseDatastore<T> {
  db: Nedb<T>;
  findPromise: <G extends T>(query: any, projection?: any) => Promise<Array<G>>;
  findOnePromise: <G extends T>(query: any, projection?: any) => Promise<G>;
  removePromise: <G extends T>(
    query: any,
    options?: Nedb.RemoveOptions
  ) => Promise<number>;
  updatePromise: <G extends T>(
    query: any,
    updateQuery: any,
    options?: Nedb.UpdateOptions
  ) => Promise<number>;
  insertPromise: (<G extends T>(newDoc: G) => Promise<G>) &
    (<G extends T>(newDoc: G[]) => Promise<G[]>);
  constructor(db: Nedb<T>) {
    this.db = db;
    this.findPromise = promisify(this.db.find).bind(this.db);
    this.removePromise = promisify(this.db.remove).bind(this.db);
    this.findOnePromise = promisify(this.db.findOne).bind(this.db);
    this.updatePromise = promisify(this.db.update).bind(this.db);
    this.insertPromise = promisify(this.db.insert).bind(this.db);
  }
  getDb() {
    return this.db;
  }
}

export default PromiseDatastore;
