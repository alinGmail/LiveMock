import * as electron from "electron";
import { GroupEvents } from "livemock-core/struct/events/desktopEvents";
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
import { ServerError } from "./common";
import { getExpectationCollection, getGroupCollection } from "../db/dbManager";
import { logViewEventEmitter } from "../common/eventEmitters";

const ipcMain = electron.ipcMain;

export async function setGroupHandler(path: string): Promise<void> {
  ipcMain.handle(
    GroupEvents.CreateGroup,
    async (
      event,
      reqParam: CreateExpectationGroupPathParam,
      reqQuery: CreateExpectationGroupReqQuery,
      reqBody: CreateExpectationGroupReqBody
    ): Promise<CreateExpectationGroupResponse> => {
      const { group, projectId } = reqBody;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      if (!group) {
        throw new ServerError(400, "group not exist!");
      }
      const collection = await getGroupCollection(projectId, path);
      ensureGroupNameAvailable(collection, group.name);
      const resGroup = collection.insert(group);
      if (!resGroup) {
        throw new ServerError(500, "group not exist");
      }
      return resGroup;
    }
  );

  ipcMain.handle(
    GroupEvents.ListGroup,
    async (
      event,
      reqParam: ListExpectationGroupPathParam,
      reqQuery: ListExpectationGroupReqQuery,
      reqBody: ListExpectationGroupReqBody
    ): Promise<ListExpectationGroupResponse> => {
      const projectId = reqQuery.projectId;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const collection = await getGroupCollection(projectId, path);
      return collection.find({});
    }
  );

  ipcMain.handle(
    GroupEvents.UpdateGroup,
    async (
      event,
      reqParam: UpdateExpectationGroupPathParam,
      reqQuery: UpdateExpectationGroupReqQuery,
      reqBody: UpdateExpectationGroupReqBody
    ): Promise<UpdateExpectationGroupResponse> => {
      const projectId = reqBody.projectId;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const collection = await getGroupCollection(projectId, path);
      const group = collection.findOne({ id: reqParam.groupId });
      if (!group) {
        throw new ServerError(500, "group not exist");
      }
      const groupUpdate = reqBody.groupUpdate || {};
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
      return collection.update(group);
    }
  );

  /**
   * delete group and all expectations in it; request logs are kept
   */
  ipcMain.handle(
    GroupEvents.DeleteGroup,
    async (
      event,
      reqParam: DeleteExpectationGroupPathParam,
      reqQuery: DeleteExpectationGroupReqQuery,
      reqBody: DeleteExpectationGroupReqBody
    ): Promise<DeleteExpectationGroupResponse> => {
      const projectId = reqQuery.projectId;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const collection = await getGroupCollection(projectId, path);
      const group = collection.findOne({ id: reqParam.groupId });
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
      return { message: "success" };
    }
  );
}

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
