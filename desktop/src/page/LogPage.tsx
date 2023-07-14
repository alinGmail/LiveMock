import React, {useEffect, useMemo, useRef, useState} from "react";
import { v4 as uuId } from "uuid";
import { createSimpleFilter, FilterType, LogM } from "core/struct/log";
import LogFilterComponent from "../component/log/LogFilterComponent";
import { useAppSelector } from "../store";
import { useDispatch } from "react-redux";
import { Button, Table } from "antd";
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
  resetLogFilter,
  TableColumnItem,
} from "../slice/logSlice";
import ColumnConfig from "../component/table/ColumnConfig";
import { PlusOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { getLogViewReq, listLogViewLogs } from "../server/logServer";
import { addLogFilterReq } from "../server/logFilterServer";
import { binarySearch, toastPromise } from "../component/common";
import { Updater, useImmer } from "use-immer";
import {ColumnsType} from "antd/es/table/interface";

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
  const dispatch = useDispatch();
  const projectState = useAppSelector((state) => state.project);
  const currentProject = projectState.projectList[projectState.curProjectIndex];
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);
  const [logs, setLogs] = useImmer<Array<LogM>>([]);

  const getLogViewQuery = useQuery([currentProject.id], () => {
    return getLogViewReq({ projectId: currentProject.id }).then((res) => {
      logViewIdRef.current = res.at(0)?.id;
      dispatch(resetLogFilter(res[0].filters));
      return res;
    });
  });

  const logViewId = getLogViewQuery.data?.at(0)?.id;

  const logViewLogsQuery = useQuery(
    [currentProject.id, logViewId],
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
  const [logColumn,updateLogColumn] = useImmer<ColumnsType<LogM>>([]);
  useEffect(() =>{
    console.log("custom columns change")
    const customColumns = getCustomColumn(
        tableColumns.filter((item, index) => item.visible),
        dispatch
    );
    const newLogColumn = getDefaultColumn(dispatch)
        .filter((item, index) => defaultColumnVisible[index])
        .concat(customColumns)
        .concat(getConfigColumn(dispatch));
    updateLogColumn(newLogColumn);
  },[tableColumns,defaultColumnVisible,dispatch]);

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
    setSocketInstance(socket);
    return () => {
      socket.disconnect();
    };
  }, []);
  const listTable = useMemo(() =>{
      return (<Table
        columns={logColumn}
        dataSource={logs}
        size={"small"}
        tableLayout={"fixed"}
        rowKey={"id"}
        pagination={{
          pageSize:200,
        }}
    />)
  },[logColumn,logs])
  return (
    <div style={{ padding: "10px" }}>
      <div style={{ padding: "10px 0px" }}>
        {logViewId &&
          logState.logFilter.map((filter) => {
            return (
              <LogFilterComponent
                filter={filter}
                key={filter.id}
                projectId={currentProject.id}
                logViewId={logViewId}
                refreshLogList={logViewLogsQuery.refetch}
              />
            );
          })}
        {getLogViewQuery.isSuccess && (
          <AddLogFilterBtn
            refreshLogList={logViewLogsQuery.refetch}
            projectId={currentProject.id}
            logViewId={getLogViewQuery.data[0]?.id}
          />
        )}
      </div>
      <div>
        {listTable}
      </div>
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

function AddLogFilterBtn({
  logViewId,
  projectId,
  refreshLogList,
}: {
  logViewId: string;
  projectId: string;
  refreshLogList: () => void;
}) {
  const dispatch = useDispatch();
  return (
    <Button
      onClick={() => {
        const simpleFilterM = createSimpleFilter();
        dispatch(addLogFilter(simpleFilterM));
        const addPromise = addLogFilterReq({
          filter: simpleFilterM,
          logViewId: logViewId,
          projectId: projectId,
        });
        toastPromise(addPromise);
        refreshLogList();
      }}
      size={"small"}
      type={"text"}
      style={{
        fontSize: "14px",
        color: "#8c8c8c",
        lineHeight: "1.57",
        borderRadius: "3px",
      }}
      icon={
        <PlusOutlined
          style={{
            position: "relative",
            top: "0px",
          }}
        />
      }
    >
      Add Filter
    </Button>
  );
}

export default LogPage;
