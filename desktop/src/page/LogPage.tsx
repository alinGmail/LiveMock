import React, { useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuId } from "uuid";
import {
  createSimpleFilter,
  FilterType,
  LogM,
  PresetFilterM,
  PresetFilterName,
  WebsocketMessageM,
  WebsocketStatus,
} from "core/struct/log";
import { AppDispatch, store, useAppSelector } from "../store";
import { useDispatch } from "react-redux";
import { Button, Modal, Table } from "antd";
import {
  getConfigColumn,
  getCustomColumn,
  getDefaultColumn,
} from "./LogPageColumn";
import { ColumnEditor } from "../component/table/ColumnEditor";
import {
  addLogFilter,
  ColumnDisplayType,
  hideColumnEditor,
  PresetFilterState,
  resetLogFilter,
  setSelectedLogItem,
  setShowWebsocketChatPanel,
  TableColumnItem,
  updatePresetFilter,
} from "../slice/logSlice";
import ColumnConfig from "../component/table/ColumnConfig";
import { useQuery } from "@tanstack/react-query";
import { listLogViewReq, listLogViewLogs } from "../server/logServer";
import { binarySearch, toastPromise } from "../component/common";
import { Updater, useImmer } from "use-immer";
import { ColumnsType } from "antd/es/table/interface";
import { LogEvents, LogViewEvents } from "core/struct/events/desktopEvents";
import IpcRendererEvent = Electron.IpcRendererEvent;
import FilterRowComponent from "../component/log/FilterRowComponent";
import PresetFilterRowComponent from "../component/log/PresetFilterRowComponent";
import { setExpectationMap } from "../slice/expectationSlice";
import { listExpectationListReq } from "../server/expectationServer";
import _ from "lodash";
import { getExpectationSuccess } from "../slice/thunk";
import ChatMainComponent, {
  MessageListContainer,
} from "../component/chat/ChatMainComponent";
import { DisconnectOutlined, LinkOutlined } from "@ant-design/icons";
import { red, green } from "@ant-design/colors";

function onLogsInsert(
  insertLog: LogM,
  logViewId: string,
  currentLogViewId: string | undefined,
  setLogs: Updater<Array<LogM>>
) {
  if (logViewId !== currentLogViewId) {
    return;
  }
  setLogs((logs) => {
    if (logs.length === 0) {
      logs.push(insertLog);
    }
    for (let i = 0; i < logs.length; i++) {
      const curLog = logs.at(i);
      if (curLog!.id < insertLog.id) {
        logs.splice(i, 0, insertLog);
        return;
      }
    }
  });
}

function onLogsUpdate(
  updateLog: LogM,
  logViewId: string,
  currentLogViewId: string | undefined,
  setLogs: Updater<Array<LogM>>,
  isDelete: boolean
) {
  if (logViewId !== currentLogViewId) {
    return;
  }
  setLogs((logs) => {
    const updateLogIndex = binarySearch(logs, updateLog, (a, b) => {
      if (a.id === b.id) {
        return 0;
      }
      if (a.id > b.id) {
        return -1;
      }
      return 1;
    });
    if (updateLogIndex === -1) {
      return;
    }
    if (isDelete) {
      logs.splice(updateLogIndex, 1);
    } else {
      logs[updateLogIndex] = updateLog;
    }
  });
}

const placeHolderColumn: TableColumnItem = {
  id: uuId(),
  name: "",
  label: "",
  path: "",
  displayType: ColumnDisplayType.TEXT,
  visible: true,
};
// const pageId:string = uuId();

const LogPage: React.FC = () => {
  const logState = useAppSelector((state) => state.log);
  const systemConfigState = useAppSelector((state) => state.systemConfig);
  const logViewIdRef = useRef<string>();
  const {
    columnConfigShow,
    columnEditorShow,
    currentColumnEditIndex,
    defaultColumnVisible,
    logFilter,
    logList,
    tableColumns,
  } = logState;
  const currentEditColumn = tableColumns[currentColumnEditIndex];
  const dispatch: AppDispatch = useDispatch();
  const projectState = useAppSelector((state) => state.project);
  const currentProject = projectState.projectList[projectState.curProjectIndex];
  const [logs, setLogs] = useImmer<Array<LogM>>([]);

  const expectationState = useAppSelector((state) => state.expectation);

  const getLogViewQuery = useQuery([currentProject.id], () => {
    return listLogViewReq({ projectId: currentProject.id }).then((res) => {
      logViewIdRef.current = res.at(0)?.id;
      dispatch(
        resetLogFilter(
          res[0].filters.filter(
            (item) => item.type === FilterType.SIMPLE_FILTER
          )
        )
      );

      // update preset filter
      const presetFilters: Array<PresetFilterM> = res[0].filters.filter(
        (item) => item.type === FilterType.PRESET_FILTER
      ) as Array<PresetFilterM>;
      const presetFilterUpdate: PresetFilterState = {
        expectationId: null,
        methods: [],
        statusCode: [],
      };
      presetFilters.forEach((presetFilter) => {
        if (presetFilter.name === PresetFilterName.EXPECTATION) {
          presetFilterUpdate.expectationId = presetFilter.value as string;
        } else if (presetFilter.name === PresetFilterName.METHODS) {
          presetFilterUpdate.methods = presetFilter.value as string[];
        } else if (presetFilter.name === PresetFilterName.STATUS_CODE) {
          presetFilterUpdate.statusCode = presetFilter.value as string[];
        }
      });
      dispatch(updatePresetFilter(presetFilterUpdate));
      // end update preset filter
      return res;
    });
  });

  const getExpectationListQuery = useQuery(
    ["getExpectationList", currentProject.id],
    () => {
      return listExpectationListReq(currentProject.id).then((res) => {
        const _expectationMap = _.keyBy(res, (expectation) => expectation.id);
        dispatch(setExpectationMap(_expectationMap));
        dispatch(getExpectationSuccess(currentProject.id, res));
        return res;
      });
    }
  );

  const logViewId = getLogViewQuery.data?.at(0)?.id;

  const logViewLogsQuery = useQuery(
    [logViewId],
    () => {
      return listLogViewLogs(logViewId as string, {
        maxLogId: null,
        projectId: currentProject.id,
      }).then((res) => {
        setLogs(res);
        return res;
      });
    },
    {
      enabled: !!logViewId,
    }
  );
  const [logColumn, updateLogColumn] = useImmer<ColumnsType<LogM>>([]);
  useEffect(() => {
    const customColumns = getCustomColumn(
      tableColumns.filter((item, index) => item.visible),
      dispatch,
      systemConfigState.mode
    );
    const newLogColumn = getDefaultColumn(
      dispatch,
      systemConfigState.mode,
      logViewId,
      currentProject.id,
      logViewLogsQuery.refetch,
      expectationState.expectationMap
    )
      .filter((item, index) => defaultColumnVisible[index])
      .concat(customColumns)
      .concat(getConfigColumn(dispatch));
    updateLogColumn(newLogColumn);
  }, [
    tableColumns,
    defaultColumnVisible,
    dispatch,
    systemConfigState.mode,
    logViewId,
    currentProject.id,
    expectationState,
  ]);

  useEffect(() => {
    // clear all event on reload
    window.api.event.removeAllListener(LogViewEvents.OnLogAdd);
    window.api.event.removeAllListener(LogViewEvents.OnLogUpdate);
    window.api.event.removeAllListener(LogViewEvents.OnLogDelete);
  }, []);

  useEffect(() => {
    const id = uuId();
    function onViewLogInsertHandle(
      event: IpcRendererEvent,
      { log, logViewId }: { log: LogM; logViewId: string }
    ) {
      onLogsInsert(log, logViewId, logViewIdRef.current, setLogs);
    }
    window.api.event.on(LogViewEvents.OnLogAdd, onViewLogInsertHandle, id);
    return () => {
      window.api.event.removeListener(LogViewEvents.OnLogAdd, id);
    };
  }, [currentProject.id]);

  useEffect(() => {
    const id = uuId();
    const onViewLogUpdateHandle = (
      event: IpcRendererEvent,
      { log, logViewId }: { log: LogM; logViewId: string }
    ) => {
      onLogsUpdate(log, logViewId, logViewIdRef.current, setLogs, false);
    };
    window.api.event.on(LogViewEvents.OnLogUpdate, onViewLogUpdateHandle, id);
    return () => {
      window.api.event.removeListener(LogViewEvents.OnLogUpdate, id);
    };
  }, [currentProject.id]);

  useEffect(() => {
    const id = uuId();
    const onViewLogDeleteHandle = (
      event: IpcRendererEvent,
      { log, logViewId }: { log: LogM; logViewId: string }
    ) => {
      onLogsUpdate(log, logViewId, logViewIdRef.current, setLogs, true);
    };
    window.api.event.on(LogViewEvents.OnLogDelete, onViewLogDeleteHandle, id);
    return () => {
      window.api.event.removeListener(LogViewEvents.OnLogDelete, id);
    };
  }, [currentProject.id]);

  /**
   * update select log item
   * use for websocket
   */
  useEffect(() => {
    const id = uuId();
    const onLogUpdateHandle = (
      event: IpcRendererEvent,
      { projectId, log, oldLog }: { projectId: string; log: LogM; oldLog: LogM }
    ) => {
      if (projectId !== currentProject.id) {
        return;
      }
      if (log.id === store.getState().log.selectedLogId) {
        dispatch(setSelectedLogItem(log));
      }
    };
    window.api.event.on(LogEvents.OnLogUpdate, onLogUpdateHandle, id);
    return () => {
      window.api.event.removeListener(LogEvents.OnLogUpdate, id);
    };
  }, [currentProject.id]);

  const listTable = useMemo(() => {
    return (
      <Table
        loading={logViewLogsQuery.isFetching}
        columns={logColumn}
        dataSource={logs}
        size={"small"}
        tableLayout={"fixed"}
        rowKey={"id"}
        pagination={{
          pageSize: 200,
        }}
      />
    );
  }, [logColumn, logs, expectationState]);
  const selLogM = logState.selectedLogItem;
  return (
    <div style={{ padding: "10px", marginTop: "10px" }}>
      {selLogM && (
        <WebsocketChatPanel
          path={selLogM.req?.path ?? ""}
          key={"wsChatPanel" + selLogM.id}
          show={logState.showWebsocketChatPanel}
          messageList={selLogM.websocketInfo?.messages ?? []}
          onClose={() => {
            dispatch(setShowWebsocketChatPanel(false));
          }}
          status={selLogM.websocketInfo?.status ?? null}
        ></WebsocketChatPanel>
      )}
      <PresetFilterRowComponent
        getExpectationListQuery={getExpectationListQuery}
        getLogViewQuery={getLogViewQuery}
        logViewId={logViewId}
        currentProject={currentProject}
        refreshLogList={logViewLogsQuery.refetch}
        logState={logState}
      />
      <FilterRowComponent
        getLogViewQuery={getLogViewQuery}
        logViewId={logViewId}
        currentProject={currentProject}
        refreshLogList={logViewLogsQuery.refetch}
        logState={logState}
        getExpectationListQuery={getExpectationListQuery}
      ></FilterRowComponent>
      <div>{listTable}</div>
      <ColumnEditor
        onClose={() => {
          dispatch(hideColumnEditor());
        }}
        show={columnEditorShow}
        tableColumnItem={currentEditColumn || placeHolderColumn}
      />
      <ColumnConfig show={columnConfigShow} />
    </div>
  );
};

const WebsocketChatPanel: React.FunctionComponent<{
  show: boolean;
  messageList: Array<WebsocketMessageM> | undefined;
  path: string;
  status: WebsocketStatus | null;
  onClose: () => void;
}> = ({ show, messageList, onClose, path, status }) => {
  useEffect(() => {
    if (!messageList) {
      return;
    }
    messageListContainer.concat(
      messageList.slice(messageListContainer.messageList.length)
    );
  }, [messageList]);
  const [messageListContainer, setMessageListContainer] =
    useState<MessageListContainer>(
      new MessageListContainer(messageList ? [...messageList] : [])
    );
  return (
    <Modal
      open={show}
      onCancel={onClose}
      title={
        <div>
          {`${path}`}
          &nbsp;&nbsp;&nbsp;
          {status && status === WebsocketStatus.OPEN && (
            <>
              <LinkOutlined style={{ color: green[5] }} />
              &nbsp;<span style={{ color: green[5] }}>{status}</span>
            </>
          )}
          {status && status !== WebsocketStatus.OPEN && (
            <>
              <DisconnectOutlined style={{ color: red[5] }} />
              &nbsp;<span style={{ color: red[5] }}>{status}</span>
            </>
          )}
        </div>
      }
    >
      <ChatMainComponent messageListContainer={messageListContainer} />
    </Modal>
  );
};

export default LogPage;
