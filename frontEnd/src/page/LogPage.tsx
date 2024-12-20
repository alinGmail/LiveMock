import React, { useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuId } from "uuid";
import {
  FilterType,
  LogM,
  PresetFilterM,
  PresetFilterName,
  WebsocketMessageM,
  WebsocketStatus,
} from "livemock-core/struct/log";
import { io, Socket } from "socket.io-client";
import {AppDispatch, store, useAppSelector} from "../store";
import { useDispatch } from "react-redux";
import { Modal, Table } from "antd";
import {
  getConfigColumn,
  getCustomColumn,
  getDefaultColumn,
} from "./LogPageColumn";
import { ColumnEditor } from "../component/table/ColumnEditor";
import {
  ColumnDisplayType,
  hideColumnEditor,
  logSlice,
  PresetFilterState,
  resetLogFilter,
  setSelectedLogItem,
  setShowWebsocketChatPanel,
  TableColumnItem,
  updatePresetFilter,
} from "../slice/logSlice";
import ColumnConfig from "../component/table/ColumnConfig";
import { useQuery } from "@tanstack/react-query";
import { listLogViewLogs, listLogViewReq } from "../server/logServer";
import { binarySearch } from "../component/common";
import { Updater, useImmer } from "use-immer";
import { ColumnsType } from "antd/es/table/interface";
import { ServerUrl } from "../config";
import FilterRowComponent from "../component/log/FilterRowComponent";
import { listExpectationReq } from "../server/expectationServer";
import { getExpectationSuccess } from "../slice/thunk";
import _ from "lodash";
import {
  deleteExpectationMap,
  setExpectationMap,
  updateExpectationMap,
} from "../slice/expectationSlice";
import PresetFilterRowComponent from "../component/log/PresetFilterRowComponent";
import ChatMainComponent, {
  MessageListContainer,
} from "src/component/chat/ChatMainComponent";
import { LinkOutlined, DisconnectOutlined } from "@ant-design/icons";
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

const LogPage: React.FC = () => {
  const logState = useAppSelector((state) => state.log);
  const systemConfigState = useAppSelector((state) => state.systemConfig);
  const logViewIdRef = useRef<string>();
  let {
    columnConfigShow,
    columnEditorShow,
    currentColumnEditIndex,
    defaultColumnVisible,
    logFilter,
    logList,
    tableColumns,
  } = logState;
  let currentEditColumn = tableColumns[currentColumnEditIndex];
  const dispatch: AppDispatch = useDispatch();
  const projectState = useAppSelector((state) => state.project);
  const currentProject = projectState.projectList[projectState.curProjectIndex];
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);
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
      return listExpectationReq(currentProject.id).then((res) => {
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
    const socket = io(ServerUrl, {
      query: {
        projectId: currentProject.id,
      },
    });

    socket.on("connect", () => {});

    socket.on(
      "insert",
      ({ log, logViewId }: { log: LogM; logViewId: string }) => {
        onLogsInsert(log, logViewId, logViewIdRef.current, setLogs);
      }
    );
    socket.on(
      "update",
      ({ log, logViewId }: { log: LogM; logViewId: string }) => {
        onLogsUpdate(log, logViewId, logViewIdRef.current, setLogs, false);
      }
    );
    socket.on(
      "delete",
      ({ log, logViewId }: { log: LogM; logViewId: string }) => {
        onLogsUpdate(log, logViewId, logViewIdRef.current, setLogs, true);
      }
    );

    socket.on("updateExpectation", ({ projectId, expectation }) => {
      if (projectId === currentProject.id) {
        dispatch(updateExpectationMap(expectation));
      }
    });
    socket.on("insertExpectation", ({ projectId, expectation }) => {
      if (projectId === currentProject.id) {
        dispatch(updateExpectationMap(expectation));
      }
    });
    socket.on("deleteExpectation", ({ projectId, expectation }) => {
      if (projectId === currentProject.id) {
        dispatch(deleteExpectationMap(expectation));
      }
    });
    socket.on(
      "updateLog",
      ({ projectId, log }: { projectId: string; log: LogM }) => {
        if (projectId === currentProject.id && log.id === store.getState().log.selectedLogId) {
          dispatch(setSelectedLogItem(log));
        }
      }
    );

    if (logState.selectedLogId) {
      socket.emit("join_log_update", logState.selectedLogId);
    }

    setSocketInstance(socket);
    return () => {
      setSocketInstance(null);
      socket.disconnect();
    };
  }, [currentProject.id]);

  useEffect(() => {
    if (socketInstance && logState.selectedLogId) {
      socketInstance.emit("join_log_update", logState.selectedLogId);
    }
    return () => {
      if (socketInstance && logState.selectedLogId) {
        socketInstance.emit("leave_log_update", logState.selectedLogId);
      }
    };
  }, [logState.selectedLogId]);

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
        getExpectationListQuery={getExpectationListQuery}
        getLogViewQuery={getLogViewQuery}
        logViewId={logViewId}
        currentProject={currentProject}
        refreshLogList={logViewLogsQuery.refetch}
        logState={logState}
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
