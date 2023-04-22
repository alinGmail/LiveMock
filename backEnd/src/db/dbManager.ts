import Datastore from "nedb";
import PromiseDatastore from "./promiseDatastore";
import { IProject } from "core/src/struct/project"

let projectDb = new Datastore({ filename: "db/project.db", autoload: true });
let projectDbP = new PromiseDatastore<IProject>(projectDb);
function getProjectDB():PromiseDatastore<IProject>{
   return projectDbP;
}