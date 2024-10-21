
import ws from "ws"
import {WebsocketStatus} from "core/struct/log";

let websocketGroupMap = new Map<number,WebsocketGroupItem>();

export interface WebsocketGroupItem{
  requestId: number;
  webSocketServer:ws.WebSocketServer | null;
  websocketClient:ws.WebSocket | null;
  status:WebsocketStatus;
}

export function getWebsocketGroupItem(requestId:number):WebsocketGroupItem|undefined{
  return websocketGroupMap.get(requestId);
}

export function setWebsocketGroupItem(websocketGroupItem:WebsocketGroupItem){
  websocketGroupMap.set(websocketGroupItem.requestId,websocketGroupItem);
}

