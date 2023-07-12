import ipcMain = Electron.ipcMain;
import { MatcherEvents } from "core/struct/events/desktopEvents";
import { ServerError } from "./common";
import { getExpectationCollection } from "../db/dbManager";
import {
    CreateMatcherPathParam,
    CreateMatcherReqBody,
    CreateMatcherReqQuery, DeleteMatcherPathParam,
    DeleteMatcherReqBody,
    DeleteMatcherReqQuery,
    UpdateMatcherPathParam,
    UpdateMatcherReqBody,
    UpdateMatcherReqQuery,
} from "core/struct/params/MatcherParams";

export async function setMatcherHandler(path: string): Promise<void> {
  ipcMain.handle(
    MatcherEvents.CreateMatcher,
    async (
      event,
      reqParam: CreateMatcherPathParam,
      reqQuery: CreateMatcherReqQuery,
      reqBody: CreateMatcherReqBody
    ) => {
      let { expectationId, matcher, projectId } = reqBody;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      if (!matcher) {
        throw new ServerError(400, "invalid params!");
      }
      const collection = await getExpectationCollection(projectId, path);
      const expectation = collection.findOne({ id: expectationId });
      if (!expectation) {
        throw new ServerError(500, "expectation not exist");
      }
      expectation.matchers.push(matcher);
      collection.update(expectation);
      return matcher;
    }
  );


  ipcMain.handle(MatcherEvents.UpdateMatcher,async (
      event,
      reqParam: UpdateMatcherPathParam,
      reqQuery: UpdateMatcherReqQuery,
      reqBody: UpdateMatcherReqBody
  )=>{
      let { expectationId, projectId, matcherUpdate } = reqBody;
      let matcherId = reqParam.matcherId;
      if (!projectId) {
          throw new ServerError(400, "project id not exist!");
      }
      const collection = await getExpectationCollection(projectId, path);
      const expectation = collection.findOne({ id: expectationId });
      if (!expectation) {
          throw new ServerError(500, "expectation not exist");
      }

      const matcher = expectation.matchers.find(item => item.id === matcherId);
      if(!matcher){
          throw new ServerError(500, "matcher not exist");
      }
      Object.assign(matcher,matcherUpdate);
      collection.update(expectation);
      return matcher;
  });


  ipcMain.handle(MatcherEvents.DeleteMatcher,async (
      event,
      reqParam: DeleteMatcherPathParam,
      reqQuery: DeleteMatcherReqQuery,
      reqBody: DeleteMatcherReqBody
  )=>{
      let { expectationId, projectId } = reqQuery;
      if (!projectId) {
          throw new ServerError(400, "project id not exist!");
      }
      const collection = await getExpectationCollection(projectId, path);
      const expectation = collection.findOne({ id: expectationId });
      if (!expectation) {
          throw new ServerError(500, "expectation not exist");
      }
      expectation.matchers = expectation.matchers.filter(
          (item) => item.id !== reqParam.matcherId
      );
      collection.update(expectation);
      return{ message: "operation success" };
  })


}
