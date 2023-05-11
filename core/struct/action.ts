import express from "express";
import { v4 as uuId } from "uuid";

export enum ActionType {
  PROXY = "PROXY",
  CUSTOM_RESPONSE = "CUSTOM_RESPONSE",
}

export enum ResponseType {
  JSON = "JSON",
  TEXT = "TEXT",
}

interface JSONResponseContentM {
  type: ResponseType.JSON;
  value: string;
}
interface TEXTResponseContentM {
  type: ResponseType.TEXT;
  value: string;
}

type ResponseContentM = JSONResponseContentM | TEXTResponseContentM;

export interface ProxyActionM {
  id:string;
  type: ActionType.PROXY;
  host: string;
  pathRewrite: Array<PathRewriteM>;
}

export interface CustomResponseActionM {
  id:string;
  type: ActionType.CUSTOM_RESPONSE;
  headers: Array<[string, string]>;
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
  process: (req: express.Request, res: express.Response) => Promise<void>;
}
export function createProxyAction(): ProxyActionM {
  return {
    id:uuId(),
    host: "",
    pathRewrite: [],
    type: ActionType.PROXY,
  };
}
