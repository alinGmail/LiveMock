import express, {Request, Response} from "express";
import {addCross, ServerError} from "./common";
import { getProjectDb } from "../db/dbManager";
import bodyParser from "body-parser";
import { ProjectM } from "core/struct/project";
import {CreateProjectParam} from "core/struct/params/ProjectParams";
import {CreateProjectResponse} from "core/struct/response/ProjectListResponse";

function getProjectRouter(path: string): express.Router {
  const projectDbP = getProjectDb(path);
  let router = express.Router();

  router.options("*", (req, res) => {
    addCross(res);
    res.end();
  });

  /**
   * get all project
   */
  router.get("/", async (req, res) => {
    addCross(res);
    let projects = await projectDbP.findPromise({});
    res.json(projects);
  });

  /**
   * create project
   */
  router.post(
    "/",
    bodyParser.json(),
    async (req: Request<{}, {}, CreateProjectParam>, res:Response<CreateProjectResponse>) => {
      addCross(res);
      if (req.body.project) {
        const project = await projectDbP.insertPromise(req.body.project);
        res.json(project);
      }else{
        throw new ServerError(400,'invalid request param')
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
      req: Request<{ projectId: number }, {}, { updateQuery: any }>,
      res
    ) => {
      addCross(res);
      await projectDbP.updatePromise(
        { _id: req.params.projectId },
        req.body.updateQuery
      );
      res.end("success");
    }
  );

  router.delete("/:projectId", bodyParser.json(), async (req, res) => {
    addCross(res);
    // todo remove expectation
    // todo remove log
    res.end("success");
  });
  return router;
}

export { getProjectRouter };
