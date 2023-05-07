import express, { Request, Response } from "express";
import { addCross, ServerError, toAsyncRouter } from "./common";
import bodyParser from "body-parser";
import { CreateMatcherParams } from "core/struct/params/MatcherParams";
import {CreateMatcherResponse, DeleteMatcherResponse} from "core/struct/response/MatcherResponse";
import { getExpectationDb } from "../db/dbManager";

export function getMatcherRouter(path: string): express.Router {
  let router = toAsyncRouter(express());
  router.options("*", (req, res) => {
    addCross(res);
    res.end();
  });
  /**
   * create matcher
   */
  router.post(
    "/",
    bodyParser.json(),
    async (
      req: Request<{}, {}, CreateMatcherParams>,
      res: Response<CreateMatcherResponse>
    ) => {
      addCross(res);
      const params = req.body;
      if (!params.projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const expectationDb = getExpectationDb(params.projectId, path);
      if (params.matcher) {
        const updateRes = await expectationDb.updatePromise(
          { _id: params.expectationId },
          {
            $push: {
              matchers: params.matcher,
            },
          }
        );
        res.json(params.matcher);
      } else {
        throw new ServerError(400, "invalid params!");
      }
    }
  );

  /**
   * delete matcher
   */
  router.delete('/:matcherId',bodyParser.json(),async (req:Request<
      {matcherId:string},{},{},{
    projectId:string;
    expectationId:string;
  }>,res:Response<DeleteMatcherResponse>)=>{
    addCross(res);
    let {expectationId, projectId} = req.query;
    if (!projectId) {
      throw new ServerError(400, "project id not exist!");
    }
    const expectationDb = getExpectationDb(projectId,path);
    await expectationDb.updatePromise(
        {
          _id: expectationId,
        },
        {
          $pull: {
            matchers: {
              id: req.params.matcherId,
            },
          },
        }
    );
    res.json({message:'operation success'});
  });

  return router;
}
