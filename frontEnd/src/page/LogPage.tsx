import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FilterType,
  LogM,
  PresetFilterM,
  PresetFilterName,
  createExpectationPresetFilterM,
  createMethodsPresetFilterM,
  createStatusCodePresetFilterM,
} from "livemock-core/struct/log";
import { io, Socket } from "socket.io-client";
import { AppDispatch, store, useAppSelector } from "../store";
import { useDispatch } from "react-redux";
import { App } from "antd";
import { useQuery } from "@tanstack/react-query";
import { Updater, useImmer } from "use-immer";
import _ from "lodash";
import { ServerUrl } from "../config";
import {
  deleteAllRequestLogs,
  listLogViewLogs,
  listLogViewReq,
} from "../server/logServer";
import { updatePresetLogFilterReq } from "../server/logFilterServer";
import { listExpectationReq } from "../server/expectationServer";
import { getExpectationSuccess } from "../slice/thunk";
import {
  PresetFilterState,
  resetLogFilter,
  setSelectedLogId,
  setSelectedLogItem,
  updatePresetFilter,
} from "../slice/logSlice";
import {
  deleteExpectationMap,
  setExpectationMap,
  updateExpectationMap,
} from "../slice/expectationSlice";
import { binarySearch } from "../component/common";
import Select from "../component/Select";
import btn from "../component/buttonStyles.module.scss";
import LogDetailPane from "../component/log/LogDetailPane";
import styles from "./LogPage.module.scss";

const METHOD_COLOR: { [key: string]: string } = {
  GET: "#22c55e",
  POST: "#60a5fa",
  PUT: "#f59e0b",
  PATCH: "#a78bfa",
  DELETE: "#ef4444",
  OPTIONS: "#94a3b8",
};

const METHOD_OPTIONS = ["GET", "POST", "PUT", "DELETE"];
const STATUS_FAMILIES = [
  { value: "2xx", label: "2xx" },
  { value: "3xx", label: "3xx" },
  { value: "4xx", label: "4xx" },
  { value: "5xx", label: "5xx" },
];

function statusFamily(status: number | null | undefined): string {
  if (status == null) {
    return "none";
  }
  if (status < 300) {
    return "s2";
  }
  if (status < 400) {
    return "s3";
  }
  if (status < 500) {
    return "s4";
  }
  return "s5";
}

function onLogsInsert(
  insertLog: LogM,
  logViewId: string,
  currentLogViewId: string | undefined,
  setLogs: Updater<Array<LogM>>,
) {
  if (logViewId !== currentLogViewId) {
    return;
  }
  setLogs((logs) => {
    if (logs.length === 0) {
      logs.push(insertLog);
      return;
    }
    for (let i = 0; i < logs.length; i++) {
      const curLog = logs.at(i);
      if (curLog!.id < insertLog.id) {
        logs.splice(i, 0, insertLog);
        return;
      }
    }
    logs.push(insertLog);
  });
}

function onLogsUpdate(
  updateLog: LogM,
  logViewId: string,
  currentLogViewId: string | undefined,
  setLogs: Updater<Array<LogM>>,
) {
  if (logViewId !== currentLogViewId) {
    return;
  }
  setLogs((logs) => {
    const index = binarySearch(logs, updateLog, (a, b) => {
      if (a.id === b.id) {
        return 0;
      }
      return a.id > b.id ? -1 : 1;
    });
    if (index !== -1) {
      logs[index] = updateLog;
    }
  });
}

function onLogsDelete(
  logId: number,
  logViewId: string,
  currentLogViewId: string | undefined,
  setLogs: Updater<Array<LogM>>,
) {
  if (logViewId !== currentLogViewId) {
    return;
  }
  setLogs((logs) => {
    const index = logs.findIndex((log) => log.id === logId);
    if (index !== -1) {
      logs.splice(index, 1);
    }
  });
}

const CheckIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const ListIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
  </svg>
);

const SearchIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const LogPage: React.FC = () => {
  const logState = useAppSelector((state) => state.log);
  const expectationState = useAppSelector((state) => state.expectation);
  const projectState = useAppSelector((state) => state.project);
  const currentProject = projectState.projectList[projectState.curProjectIndex];
  const dispatch: AppDispatch = useDispatch();
  const { modal } = App.useApp();

  const logViewIdRef = useRef<string>();
  const [logs, setLogs] = useImmer<Array<LogM>>([]);
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);
  const [justInId, setJustInId] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const [cols, setCols] = useState({
    expectation: true,
    duration: true,
    marker: true,
  });
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const presetFilter = logState.presetFilter;

  const getLogViewQuery = useQuery([currentProject.id], () => {
    return listLogViewReq({ projectId: currentProject.id }).then((res) => {
      logViewIdRef.current = res.at(0)?.id;
      dispatch(
        resetLogFilter(
          res[0].filters.filter((item) => item.type === FilterType.SIMPLE_FILTER),
        ),
      );
      const presetFilters = res[0].filters.filter(
        (item) => item.type === FilterType.PRESET_FILTER,
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
      return res;
    });
  });

  const getExpectationListQuery = useQuery(
    ["getExpectationList", currentProject.id],
    () => {
      return listExpectationReq(currentProject.id).then((res) => {
        const expectationMap = _.keyBy(res, (expectation) => expectation.id);
        dispatch(setExpectationMap(expectationMap));
        dispatch(getExpectationSuccess(currentProject.id, res));
        return res;
      });
    },
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
    { enabled: !!logViewId },
  );

  const applyPresetFilter = (filter: PresetFilterM) => {
    if (!logViewId) {
      return;
    }
    updatePresetLogFilterReq({
      projectId: currentProject.id,
      logViewId,
      filter,
    }).then(() => logViewLogsQuery.refetch());
  };

  const onExpectationChange = (value: string) => {
    const id = value || null;
    dispatch(updatePresetFilter({ ...presetFilter, expectationId: id }));
    const filter = createExpectationPresetFilterM();
    filter.value = (id ?? []) as unknown as string;
    applyPresetFilter(filter);
  };

  const toggleMethod = (method: string) => {
    const next = presetFilter.methods.includes(method)
      ? presetFilter.methods.filter((item) => item !== method)
      : [...presetFilter.methods, method];
    dispatch(updatePresetFilter({ ...presetFilter, methods: next }));
    const filter = createMethodsPresetFilterM();
    filter.value = next;
    applyPresetFilter(filter);
  };

  const toggleStatusFamily = (family: string) => {
    const next = presetFilter.statusCode.includes(family)
      ? presetFilter.statusCode.filter((item) => item !== family)
      : [...presetFilter.statusCode, family];
    dispatch(updatePresetFilter({ ...presetFilter, statusCode: next }));
    const filter = createStatusCodePresetFilterM();
    filter.value = next;
    applyPresetFilter(filter);
  };

  const clearLogs = () => {
    modal.confirm({
      title: "Clear request log?",
      content:
        "This deletes every captured request for the current project. It cannot be undone.",
      okText: "Clear",
      okType: "danger",
      onOk: async () => {
        await deleteAllRequestLogs({ projectId: currentProject.id });
        logViewLogsQuery.refetch();
      },
    });
  };

  const resume = () => {
    setPaused(false);
    logViewLogsQuery.refetch();
  };

  useEffect(() => {
    const socket = io({
      path: `${ServerUrl}/socket.io`,
      query: { projectId: currentProject.id },
    });

    socket.on(
      "insert",
      ({ log, logViewId }: { log: LogM; logViewId: string }) => {
        if (pausedRef.current) {
          return;
        }
        onLogsInsert(log, logViewId, logViewIdRef.current, setLogs);
        setJustInId(log.id);
      },
    );
    socket.on(
      "update",
      ({ log, logViewId }: { log: LogM; logViewId: string }) => {
        if (pausedRef.current) {
          return;
        }
        onLogsUpdate(log, logViewId, logViewIdRef.current, setLogs);
      },
    );
    socket.on(
      "delete",
      ({ id, logViewId }: { id: number; logViewId: string }) => {
        if (pausedRef.current) {
          return;
        }
        onLogsDelete(id, logViewId, logViewIdRef.current, setLogs);
      },
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
        if (
          projectId === currentProject.id &&
          log.id === store.getState().log.selectedLogId
        ) {
          dispatch(setSelectedLogItem(log));
        }
      },
    );

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
  }, [socketInstance, logState.selectedLogId]);

  // default-select the newest request once logs arrive
  useEffect(() => {
    if (logs.length && logState.selectedLogId == null) {
      dispatch(setSelectedLogId(logs[0].id));
      dispatch(setSelectedLogItem(logs[0]));
    }
  }, [logs, logState.selectedLogId]);

  useEffect(() => {
    if (justInId == null) {
      return;
    }
    // clear the highlight after the animation (matches the design's 1.4s)
    const timer = window.setTimeout(() => setJustInId(null), 1500);
    return () => window.clearTimeout(timer);
  }, [justInId]);

  const selectedLog =
    logs.find((log) => log.id === logState.selectedLogId) ??
    logState.selectedLogItem ??
    null;

  const filteredLogs = useMemo(() => {
    const methods = presetFilter.methods;
    const families = presetFilter.statusCode;
    const expectationId = presetFilter.expectationId;
    return logs.filter((log) => {
      if (methods.length && !methods.includes((log.req?.method ?? "").toUpperCase())) {
        return false;
      }
      if (families.length && !families.includes(statusFamily(log.res?.status))) {
        return false;
      }
      if (expectationId && log.expectationId !== expectationId) {
        return false;
      }
      return true;
    });
  }, [logs, presetFilter]);

  const expectationOptions = useMemo(
    () => [
      { value: "", label: "All requests" },
      ...(getExpectationListQuery.data ?? []).map((expectation) => ({
        value: expectation.id,
        label: expectation.name || "unnamed expectation",
      })),
    ],
    [getExpectationListQuery.data],
  );

  const renderRow = (log: LogM) => {
    const method = (log.req?.method ?? "").toUpperCase();
    const path = log.req?.path ?? "";
    const status = log.res?.status ?? null;
    const duration = log.res?.duration;
    const expectation = log.expectationId
      ? expectationState.expectationMap[log.expectationId]
      : undefined;
    const family = statusFamily(status);
    return (
      <button
        key={log.id}
        type="button"
        role="listitem"
        className={[
          styles.reqRow,
          log.id === logState.selectedLogId ? styles.reqRowSelected : "",
          log.id === justInId ? styles.reqRowJustIn : "",
        ].join(" ")}
        onClick={() => {
          dispatch(setSelectedLogId(log.id));
          dispatch(setSelectedLogItem(log));
        }}
      >
        <span className={[styles.rail, styles[family]].join(" ")} aria-hidden="true" />
        <span className={styles.reqMain}>
          <span className={styles.reqLine1}>
            <span
              className={styles.method}
              style={
                { "--m": METHOD_COLOR[method] ?? "#94a3b8" } as React.CSSProperties
              }
            >
              {method}
            </span>
            <span className={styles.reqPath}>{path}</span>
          </span>
          <span className={styles.reqLine2}>
            {cols.expectation && expectation ? (
              <span className={styles.expRef}>{expectation.name}</span>
            ) : null}
            {cols.marker && log.proxyInfo?.isProxy ? (
              <span className={[styles.marker, styles.markerProxy].join(" ")}>
                proxy
              </span>
            ) : null}
            {cols.marker && log.websocketInfo?.isWebsocket ? (
              <span className={[styles.marker, styles.markerWs].join(" ")}>
                ws
              </span>
            ) : null}
            <span>{log.req?.requestTimeStr ?? ""}</span>
          </span>
        </span>
        <span className={styles.reqMeta}>
          {cols.duration && duration != null ? (
            <span className={styles.dur}>{duration} ms</span>
          ) : null}
          {status == null ? (
            <span className={[styles.sp, styles.spNone].join(" ")}>pending</span>
          ) : (
            <span className={[styles.sp, styles[family]].join(" ")}>{status}</span>
          )}
        </span>
      </button>
    );
  };

  let listContent: React.ReactNode;
  if (logs.length === 0) {
    listContent = (
      <div className={styles.empty}>
        <span className={styles.emptyGlyph}>
          <ListIcon />
        </span>
        <h3>No requests captured</h3>
        <p>Start the project and send a request to the mock port to see it here.</p>
      </div>
    );
  } else if (filteredLogs.length === 0) {
    listContent = (
      <div className={styles.empty}>
        <span className={styles.emptyGlyph}>
          <SearchIcon />
        </span>
        <h3>No matching requests</h3>
        <p>Adjust or clear the filters to see more.</p>
      </div>
    );
  } else {
    listContent = filteredLogs.map(renderRow);
  }

  return (
    <div className={styles.page}>
      <div className={styles.filterbar}>
        <span className={styles.flabel}>Filters</span>
        <Select
          className={styles.expectationSelect}
          value={presetFilter.expectationId ?? ""}
          onChange={onExpectationChange}
          options={expectationOptions}
        />
        <div className={styles.fgroup} aria-label="Method filters">
          {METHOD_OPTIONS.map((method) => (
            <button
              key={method}
              type="button"
              className={[
                styles.fchip,
                presetFilter.methods.includes(method) ? styles.fchipActive : "",
              ].join(" ")}
              onClick={() => toggleMethod(method)}
            >
              {method}
            </button>
          ))}
        </div>
        <div className={styles.fgroup} aria-label="Status filters">
          {STATUS_FAMILIES.map((family) => (
            <button
              key={family.value}
              type="button"
              className={[
                styles.fchip,
                presetFilter.statusCode.includes(family.value)
                  ? styles.fchipActive
                  : "",
              ].join(" ")}
              onClick={() => toggleStatusFamily(family.value)}
            >
              {family.label}
            </button>
          ))}
        </div>
        <span className={styles.spacer} />
        <span
          className={[styles.live, !paused ? styles.liveOn : ""].join(" ")}
        >
          <span className={styles.liveDot} />
          {paused ? "paused" : "live"}
        </span>
        {paused ? (
          <button
            type="button"
            className={[btn.btn, btn.ghost].join(" ")}
            onClick={resume}
          >
            Resume
          </button>
        ) : (
          <button
            type="button"
            className={[btn.btn, btn.ghost].join(" ")}
            onClick={() => setPaused(true)}
          >
            Pause
          </button>
        )}
        <button
          type="button"
          className={[btn.btn, btn.ghost].join(" ")}
          onClick={clearLogs}
        >
          Clear
        </button>
        <details className={styles.dropdown}>
          <summary className={styles.fchip}>Columns</summary>
          <div className={styles.menu}>
            <div className={styles.menuLabel}>Row fields</div>
            {(
              [
                ["expectation", "Expectation"],
                ["duration", "Duration"],
                ["marker", "Proxy / WS marker"],
              ] as Array<[keyof typeof cols, string]>
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={[styles.menuItem, cols[key] ? styles.menuOn : ""].join(
                  " ",
                )}
                onClick={() => setCols((prev) => ({ ...prev, [key]: !prev[key] }))}
              >
                <span className={styles.menuCheck}>
                  <CheckIcon />
                </span>
                {label}
              </button>
            ))}
          </div>
        </details>
      </div>

      <div className={styles.workspace}>
        <section className={styles.master} aria-label="Request log">
          <div className={styles.list} role="list">
            {listContent}
          </div>
        </section>
        <LogDetailPane
          log={selectedLog}
          expectations={expectationState.expectationMap}
        />
      </div>
    </div>
  );
};

export default LogPage;
