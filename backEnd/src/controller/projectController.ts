import express, { Request } from "express";
import { addCross } from "./common";
let router = express.Router();
import { getProjectDb } from "../db/dbManager";
import bodyParser from "body-parser";
import { ProjectM } from "core/struct/project";

const projectDbP = getProjectDb();

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
  res.end(JSON.stringify(projects));
});

/**
 * create project
 */
router.post(
  "/",
  bodyParser.json(),
  async (req: Request<{}, {}, { project: ProjectM }>, res) => {
    addCross(res);
    if (req.body.project) {
      await projectDbP.insertPromise(req.body.project);
    }
    res.end(JSON.stringify(req.body.project));
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

export { router as projectRouter };
