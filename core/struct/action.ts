import express from "express";
import { v4 as uuId } from "uuid";
import { LogM } from "./log";

export enum ActionType {
  PROXY = "PROXY",
  CUSTOM_RESPONSE = "CUSTOM_RESPONSE",
}

export enum ResponseType {
  JSON = "JSON",
  TEXT = "TEXT",
}

export enum ContentHandler {
  NONE = "NONE",
  MOCK_JS = "MOCK_JS",
}

interface JSONResponseContentM {
  headers: Array<[string, string]>;
  type: ResponseType.JSON;
  value: string;
  contentHandler?: ContentHandler | undefined | null;
}
interface TEXTResponseContentM {
  headers: Array<[string, string]>;
  type: ResponseType.TEXT;
  value: string;
  contentHandler?: ContentHandler | undefined | null;
}

type ResponseContentM = JSONResponseContentM | TEXTResponseContentM;

export enum ProxyProtocol {
  HTTP = "http",
  HTTPS = "https",
}

export interface ProxyActionM {
  id: string;
  type: ActionType.PROXY;
  protocol: ProxyProtocol;
  host: string;
  handleCross: boolean;
  crossAllowCredentials: boolean;
  pathRewrite: Array<PathRewriteM>;
  prefixRemove: string | undefined | null;
  headers: Array<[string, string]> | undefined;
  requestHeaders: Array<[string, string]> | undefined;
}

export interface CustomResponseActionM {
  id: string;
  type: ActionType.CUSTOM_RESPONSE;
  status: number;
  responseContent: ResponseContentM;
}

export type ActionM = ProxyActionM | CustomResponseActionM;

export enum PathRewriteType {
  ADD_PREFIX = "ADD_PREFIX",
  REMOVE_PREFIX = "REMOVE_PREFIX",
  MATCH_REGEX = "MATCH_REGEX",
  NOT_MATCH_REGEX = "NOT_MATCH_REGEX",
}

interface AddPrefixM {
  type: PathRewriteType.ADD_PREFIX;
  value: string;
}

interface RemovePrefixM {
  type: PathRewriteType.REMOVE_PREFIX;
  value: string;
}

export type PathRewriteM = AddPrefixM | RemovePrefixM;

// 实现类的接口
export interface IAction {
  process: (
    req: express.Request,
    res: express.Response,
    log: LogM | undefined,
  ) => Promise<void>;
}
export function createProxyAction(): ProxyActionM {
  return {
    id: uuId(),
    host: "",
    pathRewrite: [],
    type: ActionType.PROXY,
    protocol: ProxyProtocol.HTTP,
    handleCross: false,
    crossAllowCredentials: false,
    headers: [],
    requestHeaders:[],
    prefixRemove:null
  };
}

export function createCustomResponseAction(): CustomResponseActionM {
  return {
    id: uuId(),
    responseContent: {
      type: ResponseType.JSON,
      value: "",
      headers: [],
      contentHandler: ContentHandler.NONE,
    },
    status: 200,
    type: ActionType.CUSTOM_RESPONSE,
  };
}

export function getNewAction(id: string, type: ActionType) {
  let newAction: ActionM;
  switch (type) {
    case ActionType.PROXY:
      newAction = createProxyAction();
      newAction.id = id;
      return newAction;
    case ActionType.CUSTOM_RESPONSE:
      newAction = createCustomResponseAction();
      newAction.id = id;
      return newAction;
  }
}
