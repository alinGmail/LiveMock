import express, {Request, Response} from "express";
import {addCross, ServerError, toAsyncRouter} from "./common";
import {getProjectDb} from "../db/dbManager";
import bodyParser from "body-parser";
import {
  CreateProjectPathParam,
  CreateProjectReqBody,
  CreateProjectReqQuery,
  ListProjectPathParam,
  ListProjectReqBody,
  ListProjectReqQuery,
  UpdateProjectPathParam,
  UpdateProjectReqBody,
} from "core/struct/params/ProjectParams";
import {isNotEmptyString} from "../common/utils";
import {CreateProjectResponse, ListProjectResponse, UpdateProjectResponse,} from "core/struct/response/ProjectResponse";
import {ProjectM, ProjectStatus} from "core/struct/project";
import {Collection} from "lokijs";
import {getProjectServer, getProjectStatus, setProjectServer, setProjectStatus} from "../server/projectStatusManage";
import getMockRouter from "../server/mockServer";

async function getProjectRouter(path: string): Promise<express.Router> {
  const projectDbP = await getProjectDb(path);
  const collection: Collection<ProjectM> = projectDbP.getCollection("project");
  let router = toAsyncRouter(express());

  router.options("*", (req, res) => {
    addCross(res);
    res.end();
  });

  /**
   * get all project
   */
  router.get(
    "/",
    async (
      req: Request<
        ListProjectPathParam,
        {},
        ListProjectReqBody,
        ListProjectReqQuery
      >,
      res: Response<ListProjectResponse>
    ) => {
      addCross(res);
      let projects = collection.find({});
      projects.forEach(project =>{
        const projectStatus = getProjectStatus(project.id);
        project.status = projectStatus;
      });
      res.json(projects);
    }
  );

  /**
   * create project
   */
  router.post(
    "/",
    bodyParser.json(),
    async (
      req: Request<
        CreateProjectPathParam,
        CreateProjectResponse,
        CreateProjectReqBody,
        CreateProjectReqQuery
      >,
      res: Response<CreateProjectResponse>
    ) => {
      addCross(res);
      if (req.body.project) {
        if (!isNotEmptyString(req.body.project.name)) {
          throw new ServerError(400, "project name can not be empty!");
        }
        const project = collection
          .insert(req.body.project);
        res.json(project);
      } else {
        throw new ServerError(400, "invalid request param");
      }
    }
  );

  /**
   * update project
   */
  router.put(
    "/:projectId",
    bodyParser.json(),
    async (
      req: Request<
        UpdateProjectPathParam,
        {},
        UpdateProjectReqBody,
        UpdateProjectReqBody
      >,
      res: Response<UpdateProjectResponse>
    ) => {
      addCross(res);
      const project = collection.findOne({ id: req.params.projectId });
      if(!project){
        throw new ServerError(500,'project not exist')
      }
      Object.assign(project, req.body.projectUpdate);
      collection.update(project);
      res.json(project);
    }
  );

  router.delete("/:projectId", bodyParser.json(), async (req, res) => {
    addCross(res);
    // todo remove expectation
    // todo remove log
    res.end("success");
  });


  /**
   * start the project
   */
  router.post("/start/:projectId",bodyParser.json(),async (req,res)=>{
    const projectId = req.params.projectId;
    const projectStatus = getProjectStatus(projectId);

    if(projectStatus !== ProjectStatus.STOPPED){
      throw new ServerError(500,"project status is " + projectStatus);
    }

    addCross(res);
    const project = collection.findOne({ id: req.params.projectId });
    const server = await getProjectServer(projectId,path);
    setProjectStatus(projectId,ProjectStatus.STARTING);
    if(server == null){
      let expServer = express();
      expServer.all("*",await getMockRouter(path,projectId));
      const newServer = expServer.listen(project?.port,()=>{
        setProjectStatus(projectId,ProjectStatus.STARTED);
        res.json({
          message:"success"
        });
      });
      setProjectServer(projectId,newServer);
    }else{
      server.listen(project?.port,()=>{
        setProjectStatus(projectId,ProjectStatus.STARTED);
        res.json({
          message:"success"
        });
      });
    }



  });

  /**
   *
   */
  router.post("/stop/:projectId",bodyParser.json(),async (req,res)=>{
    const projectId = req.params.projectId;
    const projectStatus = getProjectStatus(projectId);

    if(projectStatus !== ProjectStatus.STARTED){
      throw new ServerError(500,"project status is " + projectStatus);
    }

    const server = await getProjectServer(projectId,path);
    if(server){
      setProjectStatus(projectId,ProjectStatus.CLOSING);
      server.close(()=>{
        setProjectStatus(projectId,ProjectStatus.STOPPED);
        res.json({
          message:"success"
        });
      });
    }else{
      throw new ServerError(500,"server not exist");
    }
  });


  return router;
}

export { getProjectRouter };
