import express, { Request, Response } from "express";
import { addCross, ServerError, toAsyncRouter } from "./common";
import {
  getLogCollection,
  getLogViewCollection,
  getProjectCollection,
} from "../db/dbManager";
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
import { isNotEmptyString } from "../common/utils";
import {
  CreateProjectResponse,
  ListProjectResponse,
  UpdateProjectResponse,
} from "core/struct/response/ProjectResponse";
import { ProjectM, ProjectStatus } from "core/struct/project";
import { Collection } from "lokijs";
import {
  getProjectServer,
  getProjectStatus,
  setProjectServer,
  setProjectStatus,
} from "../server/projectStatusManage";
import getMockRouter from "../server/mockServer";
import { createLogView } from "core/struct/logView";
import { getLogDynamicView } from "../log/logUtils";
import * as console from "console";
import { deleteDatabase } from "../db/dbUtils";

async function getProjectRouter(path: string): Promise<express.Router> {
  const collection: Collection<ProjectM> = await getProjectCollection(path);
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
      projects.forEach((project) => {
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
        const project = collection.insert(req.body.project);
        const logViewMCollection = await getLogViewCollection(
          project!.id,
          path
        );
        logViewMCollection.insert(createLogView());
        // create the log view
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
      if (!project) {
        throw new ServerError(500, "project not exist");
      }
      const projectUpdate = req.body.projectUpdate;
      // if the project start , can not modify port
      const portChange = projectUpdate && project.port !== projectUpdate;
      const projectStatus = getProjectStatus(project.id);
      if (
        [
          ProjectStatus.STARTING,
          ProjectStatus.STARTED,
          ProjectStatus.CLOSING,
        ].indexOf(projectStatus) !== -1 &&
        portChange
      ) {
        throw new ServerError(
          500,
          `project is ${projectStatus} can not modify port`
        );
      }

      Object.assign(project, projectUpdate);
      collection.update(project);
      res.json(project);
    }
  );

  router.delete("/:projectId", bodyParser.json(), async (req, res) => {
    addCross(res);
    const projectId = req.params.projectId;
    const project = collection.findOne({ id: req.params.projectId });
    if (!project) {
      throw new ServerError(500, "project not exist");
    }
    await deleteDatabase(projectId, path, "expectation");
    await deleteDatabase(projectId, path, "logView");
    await deleteDatabase(projectId, path, "log");
    collection.remove(project);
    res.end("success");
  });

  /**
   * start the project
   */
  router.post("/start/:projectId", bodyParser.json(), async (req, res) => {
    const projectId = req.params.projectId;
    const projectStatus = getProjectStatus(projectId);

    if (projectStatus !== ProjectStatus.STOPPED) {
      throw new ServerError(500, "project status is " + projectStatus);
    }

    addCross(res);
    const project = collection.findOne({ id: req.params.projectId });
    if (!project) {
      throw new ServerError(500, "project not exist");
    }
    let server = await getProjectServer(projectId, path);
    setProjectStatus(projectId, ProjectStatus.STARTING);
    if (server == null) {
      let expServer = express();
      expServer.all("*", await getMockRouter(path, projectId));
      server = expServer.listen(project?.port, () => {
        server!.removeAllListeners("error");
        setProjectStatus(projectId, ProjectStatus.STARTED);
        onProjectStart(project);
        res.json({
          message: "success",
        });
      });
      setProjectServer(projectId, server);
    } else {
      server.listen(project?.port, () => {
        server!.removeAllListeners("error");
        setProjectStatus(projectId, ProjectStatus.STARTED);
        onProjectStart(project);
        res.json({
          message: "success",
        });
      });
    }
    server.once("error", (error) => {
      res.status(500);
      res.end("server start fail");
    });
  });

  async function onProjectStart(project: ProjectM) {
    // create lokij view
    const logViewCollection = await getLogViewCollection(project.id, path);
    const logCollection = await getLogCollection(project.id, path);
    const logViews = logViewCollection.find({});

    for (const logView of logViews) {
      await getLogDynamicView(project.id, logView.id, path);
    }
  }

  /**
   * stop the project
   */
  router.post("/stop/:projectId", bodyParser.json(), async (req, res) => {
    addCross(res);
    const projectId = req.params.projectId;
    const projectStatus = getProjectStatus(projectId);

    if (projectStatus !== ProjectStatus.STARTED) {
      throw new ServerError(500, "project status is " + projectStatus);
    }

    const server = await getProjectServer(projectId, path);
    if (server) {
      setProjectStatus(projectId, ProjectStatus.CLOSING);
      server.close((err) => {
        if (err) {
          console.error(err);
          throw new ServerError(500, err.message);
        }
        setProjectStatus(projectId, ProjectStatus.STOPPED);
        res.json({
          message: "success",
        });
      });
    } else {
      throw new ServerError(500, "server not exist");
    }
  });

  return router;
}

export { getProjectRouter };
