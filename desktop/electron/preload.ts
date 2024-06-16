import {
  CreateProjectPathParam,
  CreateProjectReqBody,
  CreateProjectReqQuery,
  ListProjectPathParam,
  ListProjectReqBody,
  ListProjectReqQuery,
  UpdateProjectPathParam,
  UpdateProjectReqBody,
  UpdateProjectReqQuery,
} from "core/struct/params/ProjectParams";
import {
  CreateProjectResponse,
  ListProjectResponse,
  UpdateProjectResponse,
} from "core/struct/response/ProjectResponse";
import * as electron from "electron";
import {
  ActionEvents,
  ExpectationEvents,
  LogFilterEvents,
  LogViewEvents,
  MatcherEvents,
  ProjectEvents,
} from "core/struct/events/desktopEvents";
import {
  CreateExpectationPathParam,
  CreateExpectationReqBody,
  CreateExpectationReqQuery,
  DeleteExpectationPathParam,
  DeleteExpectationReqBody,
  DeleteExpectationReqQuery,
  GetExpectationPathParam,
  GetExpectationReqBody,
  GetExpectationReqQuery,
  ListExpectationPathParam,
  ListExpectationReqBody,
  ListExpectationReqQuery,
  UpdateExpectationPathParam,
  UpdateExpectationReqBody,
  UpdateExpectationReqQuery,
} from "core/struct/params/ExpectationParams";
import { ListExpectationResponse } from "core/struct/response/ExpectationResponse";
import {
  CreateMatcherPathParam,
  CreateMatcherReqBody,
  CreateMatcherReqQuery,
  DeleteMatcherPathParam,
  DeleteMatcherReqBody,
  DeleteMatcherReqQuery,
  UpdateMatcherPathParam,
  UpdateMatcherReqBody,
  UpdateMatcherReqQuery,
} from "core/struct/params/MatcherParams";
import {
  CreateActionPathParam,
  CreateActionReqBody,
  CreateActionReqQuery,
  DeleteActionPathParam,
  DeleteActionReqBody,
  DeleteActionReqQuery,
  UpdateActionPathParam,
  UpdateActionReqBody,
  UpdateActionReqQuery,
} from "core/struct/params/ActionParams";
import {
  DeleteAllRequestLogsPathParam,
  DeleteAllRequestLogsReqBody,
  DeleteAllRequestLogsReqQuery,
  ListLogViewLogsPathParam,
  ListLogViewLogsReqBody,
  ListLogViewLogsReqQuery,
  ListLogViewPathParam,
  ListLogViewReqBody,
  ListLogViewReqQuery,
} from "core/struct/params/LogParams";
import {
  CreateLogFilterPathParam,
  CreateLogFilterReqBody,
  CreateLogFilterReqQuery,
  DeleteLogFilterPathParam,
  DeleteLogFilterReqBody,
  DeleteLogFilterReqQuery,
  UpdateLogFilterPathParam,
  UpdateLogFilterReqBody,
  UpdateLogFilterReqQuery,
  UpdatePresetLogFilterPathParam,
  UpdatePresetLogFilterReqBody,
  UpdatePresetLogFilterReqQuery,
} from "core/struct/params/LogFilterParam";
import IpcRendererEvent = electron.IpcRendererEvent;
const ipcRenderer = electron.ipcRenderer;

let funMap = new Map<
  string,
  (event: IpcRendererEvent, ...args: any[]) => void
>();

// ----------------------------------------------------------------------
export const api = {
  event: {
    on: (
      channel: string,
      listener: (event: IpcRendererEvent, ...args: any[]) => void,
      id: string
    ) => {
      funMap.set(id, listener);
      ipcRenderer.on(channel, listener);
    },
    removeListener: (channel: string, id: string) => {
      const fun = funMap.get(id);
      if (fun == null) return;
      ipcRenderer.removeListener(channel, fun);
      funMap.delete(id);
    },
    removeAllListener: (channel: string) => {
      ipcRenderer.removeAllListeners(channel);
    },
  },
  project: {
    listProject: (
      reqParam: ListProjectPathParam,
      reqQuery: ListProjectReqQuery,
      reqBody: ListProjectReqBody
    ): Promise<ListProjectResponse> => {
      return ipcRenderer.invoke(
        ProjectEvents.ListProject,
        reqParam,
        reqQuery,
        reqBody
      );
    },
    createProject: (
      reqParam: CreateProjectPathParam,
      reqQuery: CreateProjectReqQuery,
      reqBody: CreateProjectReqBody
    ): Promise<CreateProjectResponse> => {
      return ipcRenderer.invoke(
        ProjectEvents.CreateProject,
        reqParam,
        reqQuery,
        reqBody
      );
    },
    deleteProject: ({ projectId }: { projectId: string }) => {
      return ipcRenderer.invoke(ProjectEvents.DeleteProject,projectId);
    },
    startProject: ({ projectId }: { projectId: string }) => {
      return ipcRenderer.invoke(ProjectEvents.StartProject, projectId);
    },
    stopProject: ({ projectId }: { projectId: string }) => {
      return ipcRenderer.invoke(ProjectEvents.StopProject, projectId);
    },
    updateProject: (
      reqParam: UpdateProjectPathParam,
      reqQuery: UpdateProjectReqQuery,
      reqBody: UpdateProjectReqBody
    ): Promise<UpdateProjectResponse> => {
      return ipcRenderer.invoke(
        ProjectEvents.UpdateProject,
        reqParam,
        reqQuery,
        reqBody
      );
    },
  },
  expectation: {
    createExpectation: (
      reqParam: CreateExpectationPathParam,
      reqQuery: CreateExpectationReqQuery,
      reqBody: CreateExpectationReqBody
    ) => {
      return ipcRenderer.invoke(
        ExpectationEvents.CreateExpectation,
        reqParam,
        reqQuery,
        reqBody
      );
    },
    updateExpectation: (
      reqParam: UpdateExpectationPathParam,
      reqQuery: UpdateExpectationReqQuery,
      reqBody: UpdateExpectationReqBody
    ) => {
      return ipcRenderer.invoke(
        ExpectationEvents.UpdateExpectation,
        reqParam,
        reqQuery,
        reqBody
      );
    },
    listExpectation: (
      reqParam: ListExpectationPathParam,
      reqQuery: ListExpectationReqQuery,
      reqBody: ListExpectationReqBody
    ): Promise<ListExpectationResponse> => {
      return ipcRenderer.invoke(
        ExpectationEvents.ListExpectation,
        reqParam,
        reqQuery,
        reqBody
      );
    },
    deleteExpectation: (
      reqParam: DeleteExpectationPathParam,
      reqQuery: DeleteExpectationReqQuery,
      reqBody: DeleteExpectationReqBody
    ) => {
      return ipcRenderer.invoke(
        ExpectationEvents.DeleteExpectation,
        reqParam,
        reqQuery,
        reqBody
      );
    },
    getExpectation: (
      reqParam: GetExpectationPathParam,
      reqQuery: GetExpectationReqQuery,
      reqBody: GetExpectationReqBody
    ) => {
      return ipcRenderer.invoke(
        ExpectationEvents.GetExpectation,
        reqParam,
        reqQuery,
        reqBody
      );
    },
  },
  matcher: {
    createMatcher: (
      reqParam: CreateMatcherPathParam,
      reqQuery: CreateMatcherReqQuery,
      reqBody: CreateMatcherReqBody
    ) => {
      return ipcRenderer.invoke(
        MatcherEvents.CreateMatcher,
        reqParam,
        reqQuery,
        reqBody
      );
    },
    updateMatcher: (
      reqParam: UpdateMatcherPathParam,
      reqQuery: UpdateMatcherReqQuery,
      reqBody: UpdateMatcherReqBody
    ) => {
      return ipcRenderer.invoke(
        MatcherEvents.UpdateMatcher,
        reqParam,
        reqQuery,
        reqBody
      );
    },
    deleteMatcher: (
      reqParam: DeleteMatcherPathParam,
      reqQuery: DeleteMatcherReqQuery,
      reqBody: DeleteMatcherReqBody
    ) => {
      return ipcRenderer.invoke(
        MatcherEvents.DeleteMatcher,
        reqParam,
        reqQuery,
        reqBody
      );
    },
  },
  action: {
    createAction: (
      reqParam: CreateActionPathParam,
      reqQuery: CreateActionReqQuery,
      reqBody: CreateActionReqBody
    ) => {
      return ipcRenderer.invoke(
        ActionEvents.CreateAction,
        reqParam,
        reqQuery,
        reqBody
      );
    },
    updateAction: (
      reqParam: UpdateActionPathParam,
      reqQuery: UpdateActionReqQuery,
      reqBody: UpdateActionReqBody
    ) => {
      return ipcRenderer.invoke(
        ActionEvents.UpdateAction,
        reqParam,
        reqQuery,
        reqBody
      );
    },
    deleteAction: (
      reqParam: DeleteActionPathParam,
      reqQuery: DeleteActionReqQuery,
      reqBody: DeleteActionReqBody
    ) => {
      return ipcRenderer.invoke(
        ActionEvents.DeleteAction,
        reqParam,
        reqQuery,
        reqBody
      );
    },
  },
  logView: {
    listLogView: (
      reqParam: ListLogViewPathParam,
      reqQuery: ListLogViewReqQuery,
      reqBody: ListLogViewReqBody
    ) => {
      return ipcRenderer.invoke(
        LogViewEvents.ListLogView,
        reqParam,
        reqQuery,
        reqBody
      );
    },
    listLogViewLogs: (
      reqParam: ListLogViewLogsPathParam,
      reqQuery: ListLogViewLogsReqQuery,
      reqBody: ListLogViewLogsReqBody
    ) => {
      return ipcRenderer.invoke(
        LogViewEvents.ListLogViewLogs,
        reqParam,
        reqQuery,
        reqBody
      );
    },
    deleteAllRequestLogs: (
      reqParam: DeleteAllRequestLogsPathParam,
      reqQuery: DeleteAllRequestLogsReqQuery,
      reqBody: DeleteAllRequestLogsReqBody
    ) => {
      return ipcRenderer.invoke(
        LogViewEvents.DeleteAllRequestLogs,
        reqParam,
        reqQuery,
        reqBody
      );
    },
  },
  logFilter: {
    createLogFilter: (
      reqParam: CreateLogFilterPathParam,
      reqQuery: CreateLogFilterReqQuery,
      reqBody: CreateLogFilterReqBody
    ) => {
      return ipcRenderer.invoke(
        LogFilterEvents.CreateLogFilter,
        reqParam,
        reqQuery,
        reqBody
      );
    },
    updateLogFilter: (
      reqParam: UpdateLogFilterPathParam,
      reqQuery: UpdateLogFilterReqQuery,
      reqBody: UpdateLogFilterReqBody
    ) => {
      return ipcRenderer.invoke(
        LogFilterEvents.UpdateLogFilter,
        reqParam,
        reqQuery,
        reqBody
      );
    },
    updatePresetLogFilter: (
      reqParam: UpdatePresetLogFilterPathParam,
      reqQuery: UpdatePresetLogFilterReqQuery,
      reqBody: UpdatePresetLogFilterReqBody
    ) => {
      return ipcRenderer.invoke(
        LogFilterEvents.UpdatePresetLogFilter,
        reqParam,
        reqQuery,
        reqBody
      );
    },
    deleteLogFilter: (
      reqParam: DeleteLogFilterPathParam,
      reqQuery: DeleteLogFilterReqQuery,
      reqBody: DeleteLogFilterReqBody
    ) => {
      return ipcRenderer.invoke(
        LogFilterEvents.DeleteLogFilter,
        reqParam,
        reqQuery,
        reqBody
      );
    },
  },
};

electron.contextBridge.exposeInMainWorld("api", api);
