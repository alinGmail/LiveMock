import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import {
  getExpectationCollection,
  getGroupCollection,
} from "../db/dbManager";
import { addCross, ServerError, toAsyncRouter } from "./common";
import {
  CreateExpectationGroupPathParam,
  CreateExpectationGroupReqBody,
  CreateExpectationGroupReqQuery,
  DeleteExpectationGroupPathParam,
  DeleteExpectationGroupReqBody,
  DeleteExpectationGroupReqQuery,
  ListExpectationGroupPathParam,
  ListExpectationGroupReqBody,
  ListExpectationGroupReqQuery,
  UpdateExpectationGroupPathParam,
  UpdateExpectationGroupReqBody,
  UpdateExpectationGroupReqQuery,
} from "livemock-core/struct/params/ExpectationGroupParams";
import {
  CreateExpectationGroupResponse,
  DeleteExpectationGroupResponse,
  ListExpectationGroupResponse,
  UpdateExpectationGroupResponse,
} from "livemock-core/struct/response/ExpectationGroupResponse";
import { ExpectationGroupM } from "livemock-core/struct/expectationGroup";
import { logViewEventEmitter } from "../common/eventEmitters";

/**
 * group names are unique inside a project; empty names are the "unnamed" state
 * and may repeat
 */
function ensureGroupNameAvailable(
  collection: Collection<ExpectationGroupM>,
  name: string,
  exceptGroupId?: string
) {
  if (!name) {
    return;
  }
  const existing = collection.findOne({ name });
  if (existing && existing.id !== exceptGroupId) {
    throw new ServerError(400, "group name already exist!");
  }
}

export function getGroupRouter(path: string): express.Router {
  let router = toAsyncRouter(express());
  router.options("*", (req, res) => {
    addCross(res);
    res.end();
  });

  /**
   * create group
   */
  router.post(
    "/",
    bodyParser.json(),
    async (
      req: Request<
        CreateExpectationGroupPathParam,
        CreateExpectationGroupResponse,
        CreateExpectationGroupReqBody,
        CreateExpectationGroupReqQuery
      >,
      res: Response<CreateExpectationGroupResponse>
    ) => {
      addCross(res);
      const projectId = req.body.projectId;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const group = req.body.group;
      if (!group) {
        throw new ServerError(400, "group not exist!");
      }
      const collection = await getGroupCollection(projectId, path);
      ensureGroupNameAvailable(collection, group.name);
      const resGroup = collection.insert(group);
      res.json(resGroup);
    }
  );

  /**
   * update group
   */
  router.put(
    "/:groupId",
    bodyParser.json(),
    async (
      req: Request<
        UpdateExpectationGroupPathParam,
        UpdateExpectationGroupResponse,
        UpdateExpectationGroupReqBody,
        UpdateExpectationGroupReqQuery
      >,
      res: Response<UpdateExpectationGroupResponse>
    ) => {
      addCross(res);
      const projectId = req.body.projectId;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const collection = await getGroupCollection(projectId, path);
      const group = collection.findOne({ id: req.params.groupId });
      if (!group) {
        throw new ServerError(500, "group not exist");
      }
      const groupUpdate = req.body.groupUpdate || {};
      if (groupUpdate.name !== undefined) {
        ensureGroupNameAvailable(collection, groupUpdate.name, group.id);
      }
      // only the editable fields are copied; id, createTime and $loki stay put
      const allowedUpdate: Partial<ExpectationGroupM> = {};
      if (groupUpdate.name !== undefined) {
        allowedUpdate.name = groupUpdate.name;
      }
      if (groupUpdate.activate !== undefined) {
        allowedUpdate.activate = groupUpdate.activate;
      }
      if (groupUpdate.priority !== undefined) {
        allowedUpdate.priority = groupUpdate.priority;
      }
      Object.assign(group, allowedUpdate);
      const result = collection.update(group);
      res.json(result);
    }
  );

  /**
   * delete group and all expectations in it; request logs are kept
   */
  router.delete(
    "/:groupId",
    async (
      req: Request<
        DeleteExpectationGroupPathParam,
        DeleteExpectationGroupResponse,
        DeleteExpectationGroupReqBody,
        DeleteExpectationGroupReqQuery
      >,
      res: Response<DeleteExpectationGroupResponse>
    ) => {
      addCross(res);
      const projectId = req.query.projectId;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const collection = await getGroupCollection(projectId, path);
      const group = collection.findOne({ id: req.params.groupId });
      if (!group) {
        throw new ServerError(500, "group not exist");
      }
      const expectationCollection = await getExpectationCollection(
        projectId,
        path
      );
      const members = expectationCollection.find({ groupId: group.id });
      members.forEach((member) => {
        expectationCollection.remove(member);
        logViewEventEmitter.emit("deleteExpectation", {
          projectId,
          expectation: member,
        });
      });
      collection.remove(group);
      res.json({ message: "success" });
    }
  );

  /**
   * list groups
   */
  router.get(
    "/",
    async (
      req: Request<
        ListExpectationGroupPathParam,
        ListExpectationGroupResponse,
        ListExpectationGroupReqBody,
        ListExpectationGroupReqQuery
      >,
      res: Response<ListExpectationGroupResponse>
    ) => {
      addCross(res);
      const projectId = req.query.projectId;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const collection = await getGroupCollection(projectId, path);
      res.json(collection.find({}));
    }
  );

  return router;
}
