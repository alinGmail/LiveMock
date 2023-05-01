
import * as superagent from "superagent"
import {ServerUrl} from "../config";

const getProjectList = async ()=>{
    return superagent.get(`${ServerUrl}/project/`);
}
