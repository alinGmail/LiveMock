import { ProjectEvents } from "core/struct/events/desktopEvents";
import * as electron from "electron";
import http from "http";
import {
  CreateProjectPathParam,
  CreateProjectReqBody,
  CreateProjectReqQuery,
  ListProjectPathParam,
  ListProjectReqBody,
  ListProjectReqQuery,
  UpdateProjectPathParam,
  UpdateProjectReqBody,
  UpdateProjectReqQuery,
} from "core/struct/params/ProjectParams";
import { ProjectM, ProjectStatus } from "core/struct/project";
import { Collection } from "lokijs";
import {
  getLogCollection,
  getLogViewCollection,
  getProjectCollection,
} from "../db/dbManager";
import {
  getProjectServer,
  getProjectStatus,
  setProjectServer,
  setProjectStatus,
} from "../server/projectStatusManage";
import { isNotEmptyString } from "../common/utils";
import { ServerError } from "./common";
import { createLogView } from "core/struct/logView";
import express from "express";
import getMockRouter from "../server/mockServer";
import { getLogDynamicView } from "../log/logUtils";
import * as console from "console";
import {deleteDatabase} from "../db/dbUtils";

const ipcMain = electron.ipcMain;

export async function setProjectHandler(path: string): Promise<void> {
  const collection: Collection<ProjectM> = await getProjectCollection(path);

  /**
   * list project
   */
  ipcMain.handle(
    ProjectEvents.ListProject,
    (
      event,
      reqParam: ListProjectPathParam,
      reqQuery: ListProjectReqQuery,
      reqBody: ListProjectReqBody
    ) => {
      const projects = collection.find({});
      projects.forEach((project) => {
        const projectStatus = getProjectStatus(project.id);
        project.status = projectStatus;
      });
      return projects;
    }
  );

  ipcMain.handle(
    ProjectEvents.CreateProject,
    async (
      event,
      reqParam: CreateProjectPathParam,
      reqQuery: CreateProjectReqQuery,
      reqBody: CreateProjectReqBody
    ) => {
      if (reqBody.project) {
        if (!isNotEmptyString(reqBody.project.name)) {
          throw new ServerError(400, "project name can not be empty");
        }
        const project = collection.insert(reqBody.project);
        const logViewMCollection = await getLogViewCollection(
          project!.id,
          path
        );
        logViewMCollection.insert(createLogView());
        return reqBody.project;
      } else {
        throw new ServerError(400, "invalid Request param");
      }
    }
  );

  ipcMain.handle(
    ProjectEvents.UpdateProject,
    async (
      event,
      reqParam: UpdateProjectPathParam,
      reqQuery: UpdateProjectReqQuery,
      reqBody: UpdateProjectReqBody
    ) => {
      const project = collection.findOne({ id: reqParam.projectId });
      if (!project) {
        throw new ServerError(500, "project not exist");
      }
      const projectUpdate = reqBody.projectUpdate;
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
      return project;
    }
  );

  ipcMain.handle(
    ProjectEvents.StartProject,
    async (event, projectId: string) => {
      const projectStatus = getProjectStatus(projectId);

      if (projectStatus !== ProjectStatus.STOPPED) {
        throw new ServerError(500, "project status is " + projectStatus);
      }

      const project = collection.findOne({ id: projectId });
      if (!project) {
        throw new ServerError(500, "project not exist");
      }
      let server = getProjectServer(projectId, path);
      setProjectStatus(projectId, ProjectStatus.STARTING);
      if (server == null) {
        let expServer = express();
        server = http.createServer(expServer);
        expServer.all("*", await getMockRouter(path, projectId));

        server.on('upgrade',async (req, socket, head) => {
          const res_dummy = new http.ServerResponse(req);
          const expressMiddleware = expServer._router.handle.bind(
              expServer._router
          );
          expressMiddleware(req, res_dummy, (err) => {
            if (err) {
              socket.destroy();
            }
          });
        });

        server.listen(project?.port, () => {
          server!.removeAllListeners("error");
          setProjectStatus(projectId, ProjectStatus.STARTED);
          onProjectStart(project);
          return {
            message: "success",
          };
        });
        setProjectServer(projectId, server);
      } else {
        server.listen(project?.port, () => {
          server!.removeAllListeners("error");
          setProjectStatus(projectId, ProjectStatus.STARTED);
          onProjectStart(project);
          return {
            message: "success",
          };
        });
      }
      server.once("error", (error) => {
        // res.status(500);
        throw new ServerError(500, "server start fail");
      });
    }
  );

  ipcMain.handle(
    ProjectEvents.StopProject,
    async (event, projectId: string) => {
      const projectStatus = getProjectStatus(projectId);

      if (projectStatus !== ProjectStatus.STARTED) {
        throw new ServerError(500, "project status is " + projectStatus);
      }
      const server = await getProjectServer(projectId, path);
      if (server) {
        setProjectStatus(projectId, ProjectStatus.CLOSING);
        server.closeIdleConnections();
        server.closeAllConnections();
        server.close((err) => {
          if (err) {
            console.log(err);
            throw new ServerError(500, err.message);
          }
          setProjectStatus(projectId, ProjectStatus.STOPPED);
          return {
            message: "success",
          };
        });
      } else {
        throw new ServerError(500, "server not exist");
      }
    }
  );

  async function onProjectStart(project: ProjectM) {
    // create lokij view
    const logViewCollection = await getLogViewCollection(project.id, path);
    const logCollection = await getLogCollection(project.id, path);
    const logViews = logViewCollection.find({});

    for (const logView of logViews) {
      await getLogDynamicView(project.id, logView.id, path);
    }
  }


  ipcMain.handle(ProjectEvents.DeleteProject, async (event, projectId: string) => {
    const project = collection.findOne({ id: projectId });
    if (!project) {
      throw new ServerError(500, "project not exist");
    }
    const projectStatus = getProjectStatus(projectId);
    if (projectStatus !== ProjectStatus.STOPPED) {
      throw new ServerError(500, "project status is " + projectStatus);
    }
    await deleteDatabase(projectId, path, "expectation");
    await deleteDatabase(projectId, path, "logView");
    await deleteDatabase(projectId, path, "log");
    collection.remove(project);
    return {
      message: "success",
    };
  })

}
