import React, { useEffect, useState } from "react";
import { v4 as uuId } from "uuid";
import { createSimpleFilter, FilterType, LogM } from "core/struct/log";
import LogFilterComponent from "../component/log/LogFilterComponent";
import { io, Socket } from "socket.io-client";
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
import { toastPromise } from "../component/common";

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
  const [logs, setLogs] = useState<Array<LogM>>([]);

  const getLogViewQuery = useQuery([currentProject.id], () => {
    return getLogViewReq({ projectId: currentProject.id }).then((res) => {
      dispatch(resetLogFilter(res[0].filters));
      return res;
    });
  });

  const logViewId = getLogViewQuery.data?.at(0)?.id;

  useQuery(
    [currentProject.id, logViewId],
    () => {
      return listLogViewLogs(logViewId as string, {
        maxLogId: null,
        projectId: currentProject.id,
      }).then((res) => {
        setLogs(res);
      });
    },
    {
      enabled: !!logViewId,
    }
  );

  const customColumns = getCustomColumn(
    tableColumns.filter((item, index) => item.visible),
    dispatch
  );
  const logColumn = getDefaultColumn(dispatch)
    .filter((item, index) => defaultColumnVisible[index])
    .concat(customColumns)
    .concat(getConfigColumn(dispatch));

  useEffect(() => {
    const socket = io("http://localhost:9002", {
      query: {
        projectId: currentProject.id,
      },
    });

    // client-side
    socket.on("connect", () => {
      // socket.emit('setProjectId',currentProject.id);
      //socket.emit("initLogsReq");
      //console.log(socket.id); // x8WIv7-mJelg7on_ALbx
    });

    socket.on(
      "insert",
      ({ log, logViewId }: { log: LogM; logViewId: string }) => {
        //console.log(`receive log:`);
        //console.log(JSON.stringify(log));
      }
    );
    socket.on(
      "update",
      ({ log, logViewId }: { log: LogM; logViewId: string }) => {
        //console.log(`receive log:`);
        //console.log(JSON.stringify(log));
      }
    );
    socket.on(
      "delete",
      ({ log, logViewId }: { log: LogM; logViewId: string }) => {
        //console.log(`receive log:`);
        //console.log(JSON.stringify(log));
      }
    );
    setSocketInstance(socket);
    return () => {
      socket.disconnect();
    };
  }, []);
  return (
    <div>
      {logState.logFilter.map((filter) => {
        return <LogFilterComponent filter={filter} key={filter.id} />;
      })}
      {getLogViewQuery.isSuccess && (
        <AddLogFilterBtn
          projectId={currentProject.id}
          logViewId={getLogViewQuery.data[0]?.id}
        />
      )}
      <div>
        <Table
          columns={logColumn}
          dataSource={logs}
          size={"small"}
          tableLayout={"fixed"}
          rowKey={"id"}
        />
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
}: {
  logViewId: string;
  projectId: string;
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
