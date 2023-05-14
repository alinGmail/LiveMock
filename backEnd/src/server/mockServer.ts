import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import { Collection } from "lokijs";
import { ExpectationM } from "core/struct/expectation";
import { getExpectationDb } from "../db/dbManager";
import arrayUtils from "../util/arrayUtils";
import { IMatcher } from "core/struct/matcher";
import { getMatcherImpl } from "../matcher/matchUtils";
import { getActionImpl } from "../action/common";

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
    const expectations = expectationCollection
      .chain()
      .find({ activate: true })
      .compoundsort([
        ["priority", true],
        ["createTime", false],
      ])
      .data();
    await arrayUtils.first(
      expectations,
      async (expectation, expectationIndex) => {
        let allValid = arrayUtils.validAll(
          expectation.matchers,
          (matcher, matcherIndex) => {
            let matchImpl: IMatcher | null = getMatcherImpl(matcher);
            if (matchImpl) {
              return matchImpl.match(req);
            } else {
              return false;
            }
          }
        );
        if (allValid) {
          if (expectation.actions.length !== 0) {
            const actionImpl = getActionImpl(
              expectation.actions[0],
              expectation.delay
            );
            await actionImpl?.process(req, res);
            return true;
          }
        }
        return false;
      }
    );
  });
  return router;
};

export default getMockRouter;
