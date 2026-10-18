import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FilterType,
  LogFilterCondition,
  LogFilterConditionMap,
  LogM,
  PresetFilterM,
  PresetFilterName,
  SimpleFilterM,
  createExpectationPresetFilterM,
  createMethodsPresetFilterM,
  createSimpleFilter,
  createStatusCodePresetFilterM,
} from "livemock-core/struct/log";
import { io, Socket } from "socket.io-client";
import { AppDispatch, store, useAppSelector } from "../store";
import { useDispatch } from "react-redux";
import { App } from "antd";
import toast from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import { Updater, useImmer } from "use-immer";
import _ from "lodash";
import { ServerUrl } from "../config";
import {
  deleteAllRequestLogs,
  listLogViewLogs,
  listLogViewReq,
} from "../server/logServer";
import {
  addLogFilterReq,
  deleteLogFilterReq,
  updateLogFilterReq,
  updatePresetLogFilterReq,
} from "../server/logFilterServer";
import { listExpectationReq } from "../server/expectationServer";
import { getExpectationSuccess } from "../slice/thunk";
import {
  PresetFilterState,
  addLogFilter,
  modifyLogFilter,
  removeLogFilter,
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
import { binarySearch, getErrorMessage } from "../component/common";
import Select from "../component/Select";
import btn from "../component/buttonStyles.module.scss";
import LogDetailPane from "../component/log/LogDetailPane";
import LogFilterEditor from "../component/log/LogFilterEditor";
import { MockFromLogModal } from "../component/expectation/MockFromLogModal";
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
const PAGE_SIZE = 50;
const STATUS_FAMILIES = [
  { value: "2xx", label: "2xx" },
  { value: "3xx", label: "3xx" },
  { value: "4xx", label: "4xx" },
  { value: "5xx", label: "5xx" },
];

type FilterEditorState = {
  mode: "create" | "edit";
  filter: SimpleFilterM;
  anchor: HTMLElement;
};

const cloneFilter = (filter: SimpleFilterM): SimpleFilterM => ({
  ...filter,
  value: Array.isArray(filter.value) ? [...filter.value] : filter.value,
});

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

const XIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M18 6 6 18M6 6l12 12" />
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
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState({
    expectation: true,
    duration: true,
    marker: true,
  });
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [mockLog, setMockLog] = useState<LogM | null>(null);
  const [filterEditor, setFilterEditor] = useState<FilterEditorState | null>(
    null,
  );
  const [filterSaving, setFilterSaving] = useState(false);
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
        limit: PAGE_SIZE,
        projectId: currentProject.id,
      }).then((res) => {
        setLogs(res);
        setHasMore(res.length === PAGE_SIZE);
        return res;
      });
    },
    { enabled: !!logViewId },
  );

  const loadMore = () => {
    if (!logViewId || !hasMore || loadingMore || logs.length === 0) {
      return;
    }
    setLoadingMore(true);
    const maxLogId = logs[logs.length - 1].id;
    listLogViewLogs(logViewId, {
      maxLogId,
      limit: PAGE_SIZE,
      projectId: currentProject.id,
    })
      .then((res) => {
        setLogs((prev) => {
          const existing = new Set(prev.map((log) => log.id));
          res.forEach((log) => {
            if (!existing.has(log.id)) {
              prev.push(log);
            }
          });
        });
        setHasMore(res.length === PAGE_SIZE);
      })
      .finally(() => setLoadingMore(false));
  };

  const onListScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 240) {
      loadMore();
    }
  };

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

  const openAddFilter = (anchor: HTMLElement) => {
    const filter = createSimpleFilter();
    filter.property = "req.path";
    filter.condition = LogFilterCondition.CONTAINS;
    setFilterEditor({ mode: "create", filter, anchor });
  };

  const openEditFilter = (filter: SimpleFilterM, anchor: HTMLElement) => {
    setFilterEditor({ mode: "edit", filter: cloneFilter(filter), anchor });
  };

  const saveFilter = async (next: SimpleFilterM) => {
    if (!logViewId || !filterEditor || filterSaving) {
      return;
    }
    setFilterSaving(true);
    try {
      if (filterEditor.mode === "create") {
        await addLogFilterReq({
          projectId: currentProject.id,
          logViewId,
          filter: next,
        });
        dispatch(addLogFilter(next));
      } else {
        await updateLogFilterReq(next.id, {
          projectId: currentProject.id,
          logViewId,
          filter: next,
        });
        dispatch(modifyLogFilter(next));
      }
      setFilterEditor(null);
      logViewLogsQuery.refetch();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setFilterSaving(false);
    }
  };

  const removeFilter = async (filter: SimpleFilterM) => {
    if (!logViewId || filterSaving) {
      return;
    }
    setFilterSaving(true);
    try {
      await deleteLogFilterReq(filter.id, {
        projectId: currentProject.id,
        logViewId,
      });
      dispatch(removeLogFilter(filter.id));
      setFilterEditor(null);
      logViewLogsQuery.refetch();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setFilterSaving(false);
    }
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

  // Flash a row green on insert / update / websocket update. Uses the Web
  // Animations API so multiple rows can flash at once and a repeated change
  // restarts the animation (a CSS class would only play once).
  const highlightRow = (id: number) => {
    window.requestAnimationFrame(() => {
      const el = listRef.current?.querySelector<HTMLElement>(
        `[data-log-id="${id}"]`,
      );
      if (!el || typeof el.animate !== "function") {
        return;
      }
      el.getAnimations().forEach((animation) => animation.cancel());
      el.animate(
        [
          { backgroundColor: "rgba(34, 197, 94, 0.24)" },
          { backgroundColor: "transparent" },
        ],
        { duration: 1500, easing: "ease" },
      );
    });
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
        highlightRow(log.id);
      },
    );
    socket.on(
      "update",
      ({ log, logViewId }: { log: LogM; logViewId: string }) => {
        if (pausedRef.current) {
          return;
        }
        onLogsUpdate(log, logViewId, logViewIdRef.current, setLogs);
        highlightRow(log.id);
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
        if (projectId === currentProject.id) {
          highlightRow(log.id);
          if (log.id === store.getState().log.selectedLogId) {
            dispatch(setSelectedLogItem(log));
          }
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

  const selectedLog =
    logs.find((log) => log.id === logState.selectedLogId) ??
    logState.selectedLogItem ??
    null;

  // Filtering happens on the server (persisted in the log view); the list only
  // renders what the server returns. This flag just picks the empty-state copy.
  const hasActiveFilters =
    presetFilter.methods.length > 0 ||
    presetFilter.statusCode.length > 0 ||
    !!presetFilter.expectationId ||
    logState.logFilter.some((filter) => filter.activate);

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

  const simpleFilters = logState.logFilter.filter(
    (filter): filter is SimpleFilterM =>
      filter.type === FilterType.SIMPLE_FILTER,
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
        data-log-id={log.id}
        className={[
          styles.reqRow,
          log.id === logState.selectedLogId ? styles.reqRowSelected : "",
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
    listContent = hasActiveFilters ? (
      <div className={styles.empty}>
        <span className={styles.emptyGlyph}>
          <SearchIcon />
        </span>
        <h3>No matching requests</h3>
        <p>Adjust or clear the filters to see more.</p>
      </div>
    ) : (
      <div className={styles.empty}>
        <span className={styles.emptyGlyph}>
          <ListIcon />
        </span>
        <h3>No requests captured</h3>
        <p>Start the project and send a request to the mock port to see it here.</p>
      </div>
    );
  } else {
    listContent = logs.map(renderRow);
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
        <div className={styles.fgroup} aria-label="Custom filters">
          {simpleFilters.map((filter) => {
            const active = filter.activate !== false;
            const valueText = Array.isArray(filter.value)
              ? filter.value.join(", ")
              : filter.value;
            return (
              <span
                key={filter.id}
                className={[
                  styles.fchip,
                  styles.fchipCustom,
                  active ? "" : styles.fchipOff,
                ].join(" ")}
                role="button"
                tabIndex={0}
                title={
                  active
                    ? "Edit filter"
                    : "Inactive filter — click to edit"
                }
                onClick={(event) =>
                  openEditFilter(filter, event.currentTarget)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openEditFilter(filter, event.currentTarget);
                  }
                }}
              >
                {active ? null : (
                  <span className={styles.offRing} aria-hidden="true" />
                )}
                <span className={styles.fcProp}>
                  {filter.property || "empty"}
                </span>
                <span className={styles.fcCond}>
                  {LogFilterConditionMap[filter.condition]}
                </span>
                <span className={styles.fcVal}>{valueText || "empty"}</span>
                <button
                  type="button"
                  className={styles.fcRemove}
                  aria-label={`Remove filter ${filter.property || "empty"}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    void removeFilter(filter);
                  }}
                >
                  <XIcon />
                </button>
              </span>
            );
          })}
        </div>
        <button
          type="button"
          className={[styles.fchip, styles.fchipAdd].join(" ")}
          onClick={(event) => openAddFilter(event.currentTarget)}
          disabled={!logViewId || filterSaving}
          title={logViewId ? "Add filter" : "Loading filters…"}
        >
          + Add filter
        </button>
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
          <div
            className={styles.list}
            role="list"
            ref={listRef}
            onScroll={onListScroll}
          >
            {listContent}
            {loadingMore ? (
              <div className={styles.listFooter}>Loading more…</div>
            ) : null}
          </div>
        </section>
        <LogDetailPane
          log={selectedLog}
          expectations={expectationState.expectationMap}
          onMock={() => setMockLog(selectedLog)}
        />
      </div>
      {filterEditor ? (
        <LogFilterEditor
          mode={filterEditor.mode}
          filter={filterEditor.filter}
          anchor={filterEditor.anchor}
          saving={filterSaving}
          onSave={saveFilter}
          onDelete={
            filterEditor.mode === "edit"
              ? () => void removeFilter(filterEditor.filter)
              : undefined
          }
          onClose={() => {
            if (!filterSaving) {
              setFilterEditor(null);
            }
          }}
        />
      ) : null}
      <MockFromLogModal
        projectId={currentProject.id}
        log={mockLog}
        open={!!mockLog}
        onClose={() => setMockLog(null)}
        onSaved={() => getExpectationListQuery.refetch()}
      />
    </div>
  );
};

export default LogPage;
