import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import { Collection } from "lokijs";
import { ExpectationM } from "../../../core/struct/expectation";
import { getExpectationDb } from "../db/dbManager";

async function getExpectationCollection(
  projectId: string,
  path: string
): Promise<Collection<ExpectationM>> {
  const db = await getExpectationDb(projectId, path);
  return db.getCollection("expectation");
}

const getMockRouter: (
  path: string,
  projectId: string
) => Promise<express.Router> = async (path, projectId) => {
  let router = express.Router();
  const expectationCollection = await getExpectationCollection(projectId, path);
  router.all("*", bodyParser(), async (req: Request, res: Response) => {
    expectationCollection
      .chain()
      .find({ activate: true })
      .simplesort("priority", true)
      .simplesort("createTime")
      .data();
  });
  return router;
};

export default getMockRouter;
