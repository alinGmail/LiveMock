import { sysEventEmitter, websocketEventEmitter } from "./eventEmitters";
import { SystemEvent, WebsocketEvent } from "core/struct/events/systemEvent";
import { getLogCollection, getProjectCollection } from "../db/dbManager";
import { LogM, WebsocketStatus } from "core/struct/log";
import ws from "ws";

/**
 * add websocket relative event listeners
 */
export function addWsEventListeners() {
  // project start
  sysEventEmitter.on(SystemEvent.START, async () => {
    // reset the opening websocket req log
    const projectCollection = await getProjectCollection("db");
    const projects = projectCollection.find({});
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      if (project.unclosedWebsocketRequestLogIds) {
        for (
          let idIndex = 0;
          idIndex < project.unclosedWebsocketRequestLogIds.length;
          idIndex++
        ) {
          const reqLogId = project.unclosedWebsocketRequestLogIds[idIndex];
          const collection = await getLogCollection(project.id, "db");
          const reqLog = collection.findOne({
            id: { $eq: reqLogId },
          });
          try {
            reqLog!.websocketInfo!.status = WebsocketStatus.CLOSED;
          } catch (err) {}
        }
      }
    }
  });

  // websocket connect
  websocketEventEmitter.on(
    WebsocketEvent.CONNECTION,
    async (
      projectId: string,
      wss: ws.WebSocketServer,
      wsc: ws.WebSocket,
      logM: LogM
    ) => {
      const projectCollection = await getProjectCollection("db");
      const project = projectCollection.findOne({
        id: {
          $eq: projectId,
        },
      });
      if (!project) {
        return;
      }
      if (project.unclosedWebsocketRequestLogIds) {
        project.unclosedWebsocketRequestLogIds.push(logM.id);
      } else {
        project.unclosedWebsocketRequestLogIds = [logM.id];
      }
    }
  );

  // websocket close
}
